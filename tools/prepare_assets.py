"""Prépare les images déposées dans Animaux/ pour le jeu.

- découpe les personnages d'une planche (composante connexe autour d'un point 'seed') ;
- nettoie les bords des détourages (halos colorés), sauf pour les espèces marquées "_raw"
  (images déjà détourées par tools/decoupe_planche.py) ;
- recadre, redimensionne et exporte en WebP dans public/assets/ ;
- écrit src/content/assetManifest.json (liste des assets réellement disponibles).

Usage : python tools/prepare_assets.py   (ou npm run assets)
        python tools/prepare_assets.py --only lion_girl_newborn,africa_pond
            ne (re)convertit que ces images (clé exacte, ou préfixe terminé par « _ » : lion_girl_) ;
            toutes les autres gardent leur fichier et leur entrée du manifeste, octet pour octet.
Une entrée de personnage peut porter "raw": true (image déjà détourée par decoupe_planche.py)
même si le reste de l'espèce ne l'est pas (ex. lion : papa et maman d'origine, bébés de la planche).
Dépendances : Pillow, numpy.
"""
from __future__ import annotations

import argparse
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
# Images HD (demande du parent, 2026-11-20) mais jeu rapide : qualité 95, indiscernable de la source.
# Transparence gardée sans perte (bords nets). Le sans-perte complet triplait le poids sans gain visible.
CHAR_WEBP = {"quality": 95, "alpha_quality": 100, "method": 6}
BG_WEBP = {"quality": 95, "method": 6}  # ~0,6 Mo par décor


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


def prepare_character(img: Image.Image, raw: bool = False) -> Image.Image:
    """Recadre et met à la hauteur du jeu. `raw` : image déjà détourée proprement par
    tools/decoupe_planche.py — on garde son bord doux tel quel (pas de seuil ni d'érosion)."""
    img = img.convert("RGBA")
    return fit_height(crop_to_content(img if raw else clean_alpha(img)), CHAR_MAX_H)


def prepare_background(img: Image.Image, spec: dict) -> Image.Image:
    """Fond de décor : RGB, largeur limitée à maxWidth, miroir horizontal si "flip"
    (pour que la terre ferme tombe à droite, là où se tient la famille)."""
    img = img.convert("RGB")
    mw = spec.get("maxWidth", 1920)
    if img.width > mw:
        img = img.resize((mw, round(img.height * mw / img.width)), Image.LANCZOS)
    if spec.get("flip"):
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    return img


def selected(key: str, only: list[str] | None) -> bool:
    """Image à (re)convertir : toutes sans --only, sinon clé exacte ou préfixe terminé par « _ »."""
    if not only:
        return True
    return any(key == o or (o.endswith("_") and key.startswith(o)) for o in only)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Prépare les images du jeu.")
    parser.add_argument("--only", help="clés à convertir, séparées par des virgules (les autres ne sont pas touchées)")
    opts = parser.parse_args(argv)
    only = [o.strip() for o in opts.only.split(",") if o.strip()] if opts.only else None
    cfg = json.loads(SOURCES.read_text(encoding="utf-8"))
    (OUT_DIR / "backgrounds").mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "characters").mkdir(parents=True, exist_ok=True)
    manifest: dict = {"backgrounds": {}, "characters": {}}
    # source déplacée ou remplacée : on garde l'image déjà convertie plutôt que de la perdre
    old = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {"backgrounds": {}, "characters": {}}

    def keep(kind: str, key: str) -> None:
        entry = old.get(kind, {}).get(key)
        if entry and (ROOT / "public" / entry["path"]).exists():
            manifest[kind][key] = entry
            if not only:
                print(f"[conservé] {key} (image déjà convertie)")

    for name, spec in cfg.get("backgrounds", {}).items():
        if not selected(name, only):
            keep("backgrounds", name)
            continue
        src = ROOT / spec["src"]
        if not src.exists():
            print(f"[manquant] fond {name}: {src}")
            keep("backgrounds", name)
            continue
        img = prepare_background(Image.open(src), spec)
        rel = f"assets/backgrounds/{name}.webp"
        img.save(ROOT / "public" / rel, "WEBP", **BG_WEBP)
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
            if not selected(f"{species}_{role}", only):
                keep("characters", f"{species}_{role}")
                continue
            if spec.get("sheet"):
                if sheet is None:
                    keep("characters", f"{species}_{role}")
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
                    keep("characters", f"{species}_{role}")
                    continue
                img = Image.open(p).convert("RGBA")
            img = prepare_character(img, raw=bool(spec.get("raw", roles.get("_raw"))))
            key = f"{species}_{role}"
            rel = f"assets/characters/{key}.webp"
            img.save(ROOT / "public" / rel, "WEBP", **CHAR_WEBP)
            manifest["characters"][key] = {"path": rel, "width": img.width, "height": img.height}
            print(f"[ok] {key} {img.size}")

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"manifeste : {len(manifest['characters'])} personnages, {len(manifest['backgrounds'])} fonds")
    return 0


if __name__ == "__main__":
    sys.exit(main())
