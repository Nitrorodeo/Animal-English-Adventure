"""Prépare les images déposées dans Animaux/ pour le jeu.

- découpe les personnages d'une planche (composante connexe autour d'un point 'seed') ;
- nettoie les bords des détourages (halos colorés) ;
- recadre, redimensionne et exporte en WebP dans public/assets/ ;
- écrit src/content/assetManifest.json (liste des assets réellement disponibles).

Usage : python tools/prepare_assets.py   (ou npm run assets)
Dépendances : Pillow, numpy.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "tools" / "asset_sources.json"
OUT_DIR = ROOT / "public" / "assets"
MANIFEST = ROOT / "src" / "content" / "assetManifest.json"
CHAR_MAX_H = 720


def clean_alpha(img: Image.Image) -> Image.Image:
    """Supprime le halo coloré des détourages : seuil, érosion légère, couleurs de bord reprises de l'intérieur."""
    rgba = np.asarray(img.convert("RGBA")).astype(np.float32)
    rgb, a = rgba[:, :, :3], rgba[:, :, 3]
    solid = (a >= 250).astype(np.float32)
    # couleurs « décontaminées » : moyenne floue des seuls pixels opaques
    w = np.asarray(Image.fromarray((solid * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
    filled = np.empty_like(rgb)
    for c in range(3):
        ch = Image.fromarray(np.clip(rgb[:, :, c] * solid, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))
        filled[:, :, c] = np.asarray(ch).astype(np.float32) / np.maximum(w, 1e-3)
    edge = a < 250
    rgb = np.where(edge[:, :, None], np.clip(filled, 0, 255), rgb)
    # alpha : seuil + érosion 1 px + adoucissement
    a2 = np.clip((a - 110) * 1.8, 0, 255).astype(np.uint8)
    a2_img = Image.fromarray(a2).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    out = np.dstack([rgb.astype(np.uint8), np.asarray(a2_img)])
    return Image.fromarray(out, "RGBA")


def component_from_seed(alpha: np.ndarray, seed: tuple[int, int]) -> np.ndarray:
    """Composante connexe (alpha >= 250) contenant le point seed, par dilatations successives."""
    mask = alpha >= 250
    x, y = seed
    if not mask[y, x]:
        ys, xs = np.nonzero(mask)
        i = np.argmin((xs - x) ** 2 + (ys - y) ** 2)
        x, y = int(xs[i]), int(ys[i])
    region = np.zeros_like(mask)
    region[y, x] = True
    while True:
        grown = region.copy()
        grown[1:, :] |= region[:-1, :]
        grown[:-1, :] |= region[1:, :]
        grown[:, 1:] |= region[:, :-1]
        grown[:, :-1] |= region[:, 1:]
        # pas de 4 pixels par itération pour aller plus vite
        for _ in range(3):
            g2 = grown.copy()
            g2[1:, :] |= grown[:-1, :]
            g2[:-1, :] |= grown[1:, :]
            g2[:, 1:] |= grown[:, :-1]
            g2[:, :-1] |= grown[:, 1:]
            grown = g2
        grown &= mask
        if grown.sum() == region.sum():
            return region
        region = grown


def crop_to_content(img: Image.Image, pad: int = 6) -> Image.Image:
    bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    return img.crop((max(l - pad, 0), max(t - pad, 0), min(r + pad, img.width), min(b + pad, img.height)))


def fit_height(img: Image.Image, max_h: int) -> Image.Image:
    if img.height <= max_h:
        return img
    return img.resize((round(img.width * max_h / img.height), max_h), Image.LANCZOS)


def main() -> int:
    cfg = json.loads(SOURCES.read_text(encoding="utf-8"))
    (OUT_DIR / "backgrounds").mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "characters").mkdir(parents=True, exist_ok=True)
    manifest: dict = {"backgrounds": {}, "characters": {}}

    for name, spec in cfg.get("backgrounds", {}).items():
        src = ROOT / spec["src"]
        if not src.exists():
            print(f"[manquant] fond {name}: {src}")
            continue
        img = Image.open(src).convert("RGB")
        mw = spec.get("maxWidth", 1920)
        if img.width > mw:
            img = img.resize((mw, round(img.height * mw / img.width)), Image.LANCZOS)
        rel = f"assets/backgrounds/{name}.webp"
        img.save(ROOT / "public" / rel, "WEBP", quality=86, method=6)
        manifest["backgrounds"][name] = {"path": rel, "width": img.width, "height": img.height}
        print(f"[ok] fond {name} {img.size}")

    for species, roles in cfg.get("characters", {}).items():
        sheet_path = roles.get("_sheet")
        sheet = None
        if sheet_path:
            p = ROOT / sheet_path
            if p.exists():
                sheet = Image.open(p).convert("RGBA")
            else:
                print(f"[manquant] planche {species}: {p}")
        for role, spec in roles.items():
            if role.startswith("_"):
                continue
            if spec.get("sheet"):
                if sheet is None:
                    continue
                arr = np.asarray(sheet)
                comp = component_from_seed(arr[:, :, 3], tuple(spec["seed"]))
                comp_img = Image.fromarray((comp * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))
                alpha = np.minimum(arr[:, :, 3], np.asarray(comp_img))
                img = Image.fromarray(np.dstack([arr[:, :, :3], alpha]), "RGBA")
            else:
                p = ROOT / spec["src"]
                if not p.exists():
                    print(f"[manquant] {species}/{role}: {p}")
                    continue
                img = Image.open(p).convert("RGBA")
            img = fit_height(crop_to_content(clean_alpha(img)), CHAR_MAX_H)
            key = f"{species}_{role}"
            rel = f"assets/characters/{key}.webp"
            img.save(ROOT / "public" / rel, "WEBP", quality=88, method=6)
            manifest["characters"][key] = {"path": rel, "width": img.width, "height": img.height}
            print(f"[ok] {key} {img.size}")

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"manifeste : {len(manifest['characters'])} personnages, {len(manifest['backgrounds'])} fonds")
    return 0


if __name__ == "__main__":
    sys.exit(main())
