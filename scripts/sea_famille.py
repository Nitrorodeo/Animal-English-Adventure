"""Les deux animaux de chaque planche marine, et les six fonds sous-marins (revue des décors, 2026-11-23).

Demande du parent : « Tu as 2 décors de fond marin et tu en as placé aucun pour les baleines, tortues et dauphins »,
« Tu n'as pas non plus passé les 2 petites tortues », « ni les 2 baleines, regarde le dossier ».

Sources (`Animaux/Ocean map/<animal>/`) :
- `Baleines à bosse complices.png` : la maman baleine et son baleineau, sur fond vert (gardés ensemble : ils se chevauchent) ;
- `Tortues de mer joyeuses en nageant.png` : la grande tortue et la petite, sur fond vert ;
- deux fonds sous-marins par animal (baleine : cathédrale de glace + panorama de l'Antarctique ;
  dauphin : paradis lumineux + canyon de kelp ; tortue : jardin corallien + canyon turquoise).

Sorties dans `public/assets/sea/` : `whale_family_hd` (maman + baleineau), `turtle_mother_hd`, `turtle_baby_hd`
(fond vert retiré ; les deux tortues séparées), `dolphin_family_hd` (planche
« Dauphins joyeux » : la maman et son petit qui nagent, gardés ensemble) et `bg_<jeu>_<1|2>.webp` (fonds). Les anciennes images des dauphins
(`scripts/sea_hd.py`, sautant hors de l'eau) restent sur le disque, plus utilisées par le jeu ; les petites découpes de la carte du monde ne changent pas.

Lancement : python scripts/sea_famille.py
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sea_hd as h  # noqa: E402

SRC = h.SRC
OUT = h.OUT
MAX_W = {"whale_family_hd": 1400, "turtle_mother_hd": 1000, "turtle_baby_hd": 600, "dolphin_family_hd": 1300}
BG_W = 1600

SHEETS = {
    "whale": ("Baleine", "Baleines à bosse complices.png"),
    "turtle": ("Tortue", "Tortues de mer joyeuses en nageant.png"),
    # 2026-11-24 : « termine les 3 animaux des océans correctement » — les dauphins de la carte sautaient hors de l'eau
    # avec leur flaque, posés en plein fond marin ; la planche « Dauphins joyeux » les montre nageant sous l'eau
    "dolphin": ("Dauphin", "Dauphins joyeux dans l’océan.png"),
}
BACKGROUNDS = {
    "whale": ("Baleine", ["Cathédrale de glace sous-marine-2.png", "Panorama sous-marin de l’Antarctique-1.png", "Aurores polaires sous-marines.webp"]),  # 3e : « elle est magnifique », 2026-11-25
    "dolphins": ("Dauphin", ["Paradis sous-marin lumineux pour dauphins.png", "Canyon sous-marin enchanté aux forêts de kelp.png"]),
    "turtle": ("Tortue", ["Jardin corallien sous-marin éclatant.png", "Canyon sous-marin aux rayons turquoise.png"]),
}


def chroma_key(rgb: np.ndarray) -> np.ndarray:
    """Retire le fond vert vif : transparence douce, et le vert qui déborde sur le bord est ramené au gris du contour."""
    f = rgb.astype(np.float32)
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    spill = g - np.maximum(r, b)
    alpha = 1 - np.clip((spill - 40) / 90, 0, 1)
    g2 = np.minimum(g, np.maximum(r, b) + 4)
    out = np.dstack([r, g2, b, alpha * 255]).clip(0, 255).astype(np.uint8)
    # poussières isolées retirées
    import cv2

    solid = (out[..., 3] > 60).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(solid, connectivity=8)
    for i in range(1, n):
        if st[i, 4] < 60:
            out[lab == i, 3] = 0
    return out


def save(rgba: np.ndarray, name: str) -> tuple[int, int]:
    img = Image.fromarray(h.crop(rgba), "RGBA")
    if img.width > MAX_W[name]:
        img = img.resize((MAX_W[name], round(img.height * MAX_W[name] / img.width)), Image.LANCZOS)
    img.save(OUT / f"{name}.webp", "WEBP", **h.WEBP)
    return img.size


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    for game, (folder, name) in SHEETS.items():
        rgba = chroma_key(np.asarray(Image.open(SRC / folder / name).convert("RGB")))
        if game == "dolphin":
            # la maman et son petit se chevauchent (la tête du petit cache le ventre de la maman) : gardés ENSEMBLE,
            # comme les baleines (« ce n'est pas grave si les 2 restent ensemble », 2026-11-24)
            print("dolphin_family_hd", save(rgba, "dolphin_family_hd"))
            continue
        if game == "whale":
            # la maman et son baleineau se chevauchent (le petit cache le ventre de la maman) : on les garde ENSEMBLE,
            # exactement comme sur la planche, plutôt que de couper la maman suivant le contour du petit
            print("whale_family_hd", save(rgba, "whale_family_hd"))
            continue
        baby, mother = h.split_two(rgba, fade=6)  # le petit est à gauche, le grand à droite
        print(f"{game}_baby_hd", save(baby, f"{game}_baby_hd"))
        print(f"{game}_mother_hd", save(mother, f"{game}_mother_hd"))
    for game, (folder, names) in BACKGROUNDS.items():
        for i, name in enumerate(names, 1):
            img = Image.open(SRC / folder / name).convert("RGB")
            img = img.resize((BG_W, round(img.height * BG_W / img.width)), Image.LANCZOS)
            img.save(OUT / f"bg_{game}_{i}.webp", "WEBP", quality=82, method=6)
            print(f"bg_{game}_{i}", img.size)
    return 0


if __name__ == "__main__":
    sys.exit(main())
