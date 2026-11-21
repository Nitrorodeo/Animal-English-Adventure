"""Images HD des jeux bonus de la mer (demande du parent, 2026-11-20 : « images hd de partout »).

Sources : `Animaux/Ocean map/` (baleine, deux dauphins, tortue). Sorties : `public/assets/sea/*_hd.webp`,
utilisées par les jeux bonus (src/ui/SeaBonus.tsx). Les petites découpes de la carte du monde
(`scripts/sea_sprites.py`, sans `_hd`) restent : elles se posent exactement sur la peinture de la carte.

- Baleine : son fond est un faux damier gris et blanc peint dans l'image ; il est retiré ici.
  Les reflets blancs enfermés (œil, gouttes) restent opaques ; un trou qui montre le damier devient transparent.
- Dauphins : une seule image, reliés par la flaque ; séparés par érosion puis chaque pixel va au dauphin le plus proche.
- Tortue : déjà transparente, seulement recadrée.

Lancement : python scripts/sea_hd.py
"""
from __future__ import annotations

import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Animaux" / "Ocean map"
OUT = ROOT / "public" / "assets" / "sea"
WEBP = {"quality": 95, "alpha_quality": 100, "method": 6}
# largeur maximale : la place à l'écran sur une tablette en Retina (largeur de scène × part × 2), sans plus
MAX_W = {"whale_hd": 1300, "turtle_hd": 800, "dolphin_big_hd": 900, "dolphin_little_hd": 700}


def checker_alpha(rgb: np.ndarray) -> np.ndarray:
    """Transparence d'un dessin posé sur un faux damier clair (gris neutre très clair)."""
    f = rgb.astype(np.int16)
    sat = f.max(2) - f.min(2)
    lum = f.mean(2)
    bg = ((sat <= 6) & (lum >= 236)).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(bg, connectivity=4)
    edge = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]]).tolist())
    clear = np.zeros(bg.shape, bool)
    for i in range(1, n):
        part = lab == i
        if i in edge:
            clear |= part
            continue
        # trou enfermé : reflet blanc pur (opaque) ou damier visible (case grise plus sombre) ?
        if st[i, 4] > 40 and (lum[part] < 249).mean() > 0.2:
            clear |= part
    obj = (~clear).astype(np.uint8)
    # poussières isolées retirées
    n, lab, st, _ = cv2.connectedComponentsWithStats(obj, connectivity=8)
    for i in range(1, n):
        if st[i, 4] < 15:
            obj[lab == i] = 0
    return cv2.GaussianBlur(obj.astype(np.float32) * 255, (0, 0), 0.8).clip(0, 255).astype(np.uint8)


def bleed_edge(rgba: np.ndarray) -> np.ndarray:
    """Couleur des pixels du bord semi-transparent reprise de l'intérieur : pas de liseré gris du fond."""
    out = rgba.copy()
    solid = rgba[..., 3] >= 250
    band = (rgba[..., 3] > 0) & ~solid
    if not band.any() or not solid.any():
        return out
    # étiquette du pixel opaque le plus proche de chaque pixel
    _, labels = cv2.distanceTransformWithLabels((~solid).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    ys, xs = np.nonzero(solid)
    order = labels[ys, xs]  # chaque pixel opaque porte sa propre étiquette
    lut = np.zeros((order.max() + 1, 3), np.uint8)
    lut[order] = rgba[ys, xs, :3]
    out[band, :3] = lut[labels[band]]
    return out


def split_two(rgba: np.ndarray, fade: float = 50) -> tuple[np.ndarray, np.ndarray]:
    """Sépare deux personnages qui se touchent : (gauche, droite), chacun sur sa propre image transparente.
    `fade` : largeur (px) du fondu le long de la coupure."""
    solid = (rgba[..., 3] > 128).astype(np.uint8)
    # érosion poussée tant que DEUX corps survivent : il ne reste que le cœur épais de chacun,
    # sans la flaque ni les éclaboussures (plus minces) qui les relient
    cores = None
    for r in range(1, 200, 2):
        e = cv2.erode(solid, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1)))
        n, lab, st, cen = cv2.connectedComponentsWithStats(e)
        comps = sorted(range(1, n), key=lambda i: -st[i, 4])
        if len(comps) >= 2 and st[comps[1], 4] > 0.1 * st[comps[0], 4]:
            two = sorted(comps[:2], key=lambda i: cen[i][0])
            cores = [lab == two[0], lab == two[1]]
        elif cores is not None or not comps:
            break
    if cores is None:
        raise ValueError("impossible de séparer les deux personnages")
    # chaque noyau grandit pas à pas À L'INTÉRIEUR du dessin (distance le long de la forme) :
    # une queue reste avec le corps auquel elle tient, même si l'autre personnage est plus près à vol d'oiseau
    grow = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    own = [c.astype(np.uint8) for c in cores]
    free = solid.copy()
    free[cores[0] | cores[1]] = 0
    while free.any():
        moved = False
        for k in (0, 1):
            new = cv2.dilate(own[k], grow) & free
            if new.any():
                own[k] |= new
                free &= 1 - new
                moved = True
        if not moved:
            break  # morceaux isolés : partagés à vol d'oiseau ci-dessous
    dist = [cv2.distanceTransform(1 - o, cv2.DIST_L2, 5) for o in own]
    left = dist[0] <= dist[1]
    # couture : là où la coupure traverse vraiment le dessin (dans la flaque), pas dans le vide
    drawn = rgba[..., 3] > 20
    k3 = np.ones((3, 3), np.uint8)
    seam = drawn & ((cv2.dilate(left.astype(np.uint8), k3) > 0) & (cv2.dilate((~left).astype(np.uint8), k3) > 0))
    near = cv2.distanceTransform((~seam).astype(np.uint8), cv2.DIST_L2, 5) if seam.any() else np.full(left.shape, fade, np.float32)
    out = []
    for keep in (left, ~left):
        part = rgba.copy()
        # fondu près de la couture : la flaque partagée n'a pas de bord droit tranché net
        t = np.clip(near / fade, 0, 1)
        part[..., 3] = np.where(keep, rgba[..., 3] * (t * t * (3 - 2 * t)), 0).astype(np.uint8)
        out.append(part)
    return out[0], out[1]


def crop(rgba: np.ndarray, pad: int = 6) -> np.ndarray:
    ys, xs = np.nonzero(rgba[..., 3] > 4)
    if not len(xs):
        raise ValueError("image vide")
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, rgba.shape[0])
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, rgba.shape[1])
    return rgba[y0:y1, x0:x1]


def save(rgba: np.ndarray, name: str) -> tuple[int, int]:
    img = Image.fromarray(crop(rgba), "RGBA")
    mw = MAX_W[name]
    if img.width > mw:
        img = img.resize((mw, round(img.height * mw / img.width)), Image.LANCZOS)
    img.save(OUT / f"{name}.webp", "WEBP", **WEBP)
    return img.size


def source(word: str) -> Path:
    found = [p for p in SRC.glob("*.png") if word.lower() in p.name.lower()]
    if len(found) != 1:
        raise FileNotFoundError(f"{word} : {len(found)} image(s) dans {SRC}")
    return found[0]


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    whale = np.asarray(Image.open(source("baleine")).convert("RGB"))
    print("whale_hd", save(bleed_edge(np.dstack([whale, checker_alpha(whale)])), "whale_hd"))
    big, little = split_two(np.asarray(Image.open(source("dauphins")).convert("RGBA")))
    print("dolphin_big_hd", save(big, "dolphin_big_hd"))
    print("dolphin_little_hd", save(little, "dolphin_little_hd"))
    print("turtle_hd", save(np.asarray(Image.open(source("tortue")).convert("RGBA")), "turtle_hd"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
