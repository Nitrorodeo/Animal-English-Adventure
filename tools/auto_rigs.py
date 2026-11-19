"""Squelettes automatiques des marionnettes, calculés à partir de la silhouette de chaque dessin.

Pour chaque personnage de src/content/assetManifest.json, on lit l'alpha de son WebP et on place :
- `head` : sur la masse du haut du dessin (côté où regarde l'animal) ;
- `body` : à travers le tronc ;
- `legFL`, `legFR`, `legBL`, `legBR` : une par pied posé au sol, quand les pieds sont séparés
  (un animal assis ou couché n'en a pas : il respire, parle et rebondit sans bouger les pattes).

Écrit src/game/autoRigs.json. Les squelettes réglés à la main (src/game/rigs.ts, ex. Leo)
restent prioritaires.

Usage : python tools/auto_rigs.py   (après npm run assets)
Dépendances : Pillow, numpy.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "src" / "content" / "assetManifest.json"
OUT = ROOT / "src" / "game" / "autoRigs.json"


# Pattes des parents debout de profil : position de chaque pied (fraction de la largeur) et haut
# des pattes (fraction de la hauteur). Relevées sur une grille le 2026-11-19. Les autres
# personnages (assis, de face, bébés) n'ont pas d'os de patte : ils se dandinent en marchant.
LEGS: dict[str, dict] = {
    "red_panda_father": {"pivot": 0.68, "x": {"legBL": 0.27, "legBR": 0.43, "legFL": 0.68, "legFR": 0.86}},
    "red_panda_mother": {"pivot": 0.68, "x": {"legFR": 0.16, "legFL": 0.34, "legBR": 0.53, "legBL": 0.68}},
    "fox_father": {"pivot": 0.7, "x": {"legBL": 0.27, "legBR": 0.38, "legFL": 0.58, "legFR": 0.68}},
    "bear_father": {"pivot": 0.68, "x": {"legBL": 0.12, "legBR": 0.33, "legFL": 0.55, "legFR": 0.76}},
    "bear_mother": {"pivot": 0.7, "x": {"legFR": 0.15, "legFL": 0.38, "legBR": 0.58, "legBL": 0.8}},
    "bison_father": {"pivot": 0.72, "x": {"legBL": 0.13, "legBR": 0.27, "legFL": 0.52, "legFR": 0.68}},
    "bison_mother": {"pivot": 0.72, "x": {"legFR": 0.13, "legFL": 0.28, "legBR": 0.53, "legBL": 0.69}},
    "tiger_father": {"pivot": 0.7, "x": {"legBL": 0.22, "legBR": 0.4, "legFL": 0.56, "legFR": 0.71}},
    "giraffe_father": {"pivot": 0.68, "x": {"legBL": 0.17, "legBR": 0.3, "legFL": 0.47, "legFR": 0.62}},
}


def rig_for(sprite: str, path: Path) -> dict:
    img = Image.open(path).convert("RGBA")
    W, H = img.size
    mask = np.asarray(img)[:, :, 3] >= 128
    ys, xs = np.nonzero(mask)
    top = int(ys.min())
    cx = float(xs.mean())

    # tête : masse du tiers haut de la silhouette
    band = mask[: top + int(0.38 * (H - top))]
    hy_, hx_ = np.nonzero(band)
    hx, hy = float(hx_.mean()), float(hy_.mean())
    side = (hx - cx) / W
    frontal = abs(side) < 0.06
    facing = 1 if side >= 0 else -1

    # pattes : placées à l'œil (LEGS) ; l'ombre dessinée au sol relie les pieds, on ne peut pas les détecter
    legs = LEGS.get(sprite)
    belly = legs["pivot"] * H if legs else None

    clampx = lambda v: float(min(W - 1, max(1, v)))
    clampy = lambda v: float(min(H - 1, max(1, v)))
    bones: list[dict] = []
    trunk_y = (belly - 0.1 * H) if belly else 0.72 * H
    if frontal:
        bones.append({"id": "body", "pivot": [clampx(cx), clampy(0.94 * H)], "tip": [clampx(cx), clampy(0.55 * H)], "strength": 1.1, "layer": 2})
        hp = [clampx(hx), clampy(min(0.62 * H, hy + 0.22 * H))]
    else:
        f = facing
        bones.append({"id": "body", "pivot": [clampx(cx - f * 0.24 * W), clampy(trunk_y)], "tip": [clampx(cx + f * 0.12 * W), clampy(trunk_y - 0.03 * H)], "strength": 1.1, "layer": 2})
        hp = [clampx(hx + (cx - hx) * 0.45), clampy(min(trunk_y, hy + 0.3 * H))]
    head_top = float(np.nonzero(mask[:, int(round(hx))])[0].min()) if mask[:, int(round(hx))].any() else float(top)
    bones.append({"id": "head", "parent": "body", "pivot": hp, "tip": [clampx(hx), clampy(head_top + 0.06 * H)], "strength": 1.6, "layer": 4})

    if legs:
        pivot_y = clampy(belly)
        for name, fx in legs["x"].items():
            front = name.startswith("legF")
            bones.append({"id": name, "pivot": [clampx(fx * W), pivot_y], "tip": [clampx(fx * W), clampy(0.95 * H)], "strength": 1.0 if front else 0.9, "layer": 3 if front else 0})

    mouth = [clampx(hx + (0 if frontal else facing * 0.07 * W)), clampy(hy + 0.08 * H)]
    rig = {"sprite": sprite, "width": W, "height": H, "facing": facing, "mouth": mouth, "drinkDip": 0.04, "bones": bones}
    return {k: (round(v, 1) if isinstance(v, float) else v) for k, v in rig.items()} | {
        "bones": [{**b, "pivot": [round(v, 1) for v in b["pivot"]], "tip": [round(v, 1) for v in b["tip"]]} for b in bones],
        "mouth": [round(v, 1) for v in mouth],
    }


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    rigs = {}
    for sprite, info in sorted(manifest["characters"].items()):
        rigs[sprite] = rig_for(sprite, ROOT / "public" / info["path"])
        r = rigs[sprite]
        legs = sum(1 for b in r["bones"] if b["id"].startswith("leg"))
        print(f"{sprite:28s} {r['width']}x{r['height']} regarde {'→' if r['facing'] > 0 else '←'} pattes {legs}")
    OUT.write_text(json.dumps(rigs, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(rigs)} squelettes -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
