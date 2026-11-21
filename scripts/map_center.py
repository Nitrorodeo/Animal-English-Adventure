"""Recentre la carte du monde élargie (demande du parent, 2026-11-20 : « on est trop décalé vers la droite,
centre-moi ce décor »).

Les continents commençaient à 286 px du bord gauche et touchaient presque le bord droit (Japon à 2169 px sur
2172). On enlève `SHIFT` colonnes d'océan à gauche (coutures verticales choisies dans la mer et le ciel, à
gauche des Amériques) et on en ajoute autant à droite, dans la mer à droite de l'Asie et de l'Océanie. Les
terres et les animaux ne sont pas touchés : tout le dessin se décale d'exactement `SHIFT` px vers la gauche
(les zones cliquables de world.ts et sea.ts reculent de SHIFT / 2172 × 100 %).

Entrée et sortie : public/assets/backgrounds/world_map.webp (copie d'avant : world_map_avant_centrage.webp).

    python scripts/map_center.py
"""
from __future__ import annotations

import shutil
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

from map_wide import best_seam, gradient, grow, insert, open_water

ROOT = Path(__file__).resolve().parent.parent
MAP = ROOT / "public/assets/backgrounds/world_map.webp"
BACKUP = ROOT / "public/assets/backgrounds/world_map_avant_centrage.webp"
SHIFT = 135


def remove(arr: np.ndarray, seam: np.ndarray) -> np.ndarray:
    h, w = arr.shape[:2]
    keep = np.ones((h, w), dtype=bool)
    keep[np.arange(h), seam] = False
    return arr[keep].reshape((h, w - 1) + arr.shape[2:])


def components(mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Étiquette les terres d'un seul tenant (4-voisinage) ; renvoie (étiquettes, tailles)."""
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32)
    sizes = [0]
    for y0, x0 in zip(*np.nonzero(mask)):
        if lab[y0, x0]:
            continue
        n = len(sizes)
        lab[y0, x0] = n
        todo = deque([(y0, x0)])
        count = 0
        while todo:
            y, x = todo.popleft()
            count += 1
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n
                    todo.append((yy, xx))
        sizes.append(count)
    return lab, np.array(sizes)


def main() -> int:
    if not BACKUP.exists():
        shutil.copyfile(MAP, BACKUP)
    a = np.asarray(Image.open(BACKUP).convert("RGB")).astype(np.float64)
    H, W = a.shape[:2]
    land = grow(~open_water(a), 2)
    lab, sizes = components(land)
    main_land = np.isin(lab, np.nonzero(sizes > 20000)[0])
    main_land[:, 0] = False
    protect = np.where(land, 2e5, 0.0)
    # pointe de la Sibérie, coupée par le bord droit : seul endroit où l'on étire un peu la terre (herbe, rivage)
    tip = np.zeros((H, W), bool)
    tip[140:310, 2030:] = True
    protect[tip & main_land] = 0.0
    # à droite, on n'insère qu'à droite des grands continents (et jamais avant x = 1960) : rien ne se déforme
    right = np.array([max(1960, int(np.nonzero(r)[0].max()) + 4 if r.any() else 0) for r in main_land])
    allowed = np.arange(W)[None, :] >= right[:, None]
    allowed |= tip

    # 1) à gauche : on retire SHIFT coutures, seulement dans l'océan à gauche des Amériques (terres dès 286 px)
    for i in range(SHIFT):
        w = a.shape[1]
        energy = gradient(a) + protect
        energy[:, 270 - i :] = 1e9
        seam = best_seam(energy)
        a, protect, allowed = remove(a, seam), remove(protect, seam), remove(allowed, seam)

    # 2) à droite : on ajoute SHIFT coutures dans la mer, à droite des terres, en les répartissant
    crowd = np.zeros(a.shape[:2])
    rows = np.arange(H)
    for i in range(SHIFT):
        energy = gradient(a) + protect + crowd * 20.0
        energy[~allowed] = 1e9
        seam = best_seam(energy)
        a = insert(a, seam)
        protect = insert(protect, seam)
        allowed = insert(allowed, seam, value=np.ones(H, bool))
        crowd = insert(crowd, seam, value=crowd[rows, seam] + 1)
        for d in range(-6, 8):
            xs = np.clip(seam + 1 + d, 0, a.shape[1] - 1)
            crowd[rows, xs] += max(0.0, 1.0 - abs(d - 0.5) / 7.5)
        if i % 30 == 0:
            print(f"  droite {i} / {SHIFT}", flush=True)

    out = Image.fromarray(np.clip(a + 0.5, 0, 255).astype(np.uint8), "RGB")
    assert out.size == (W, H), out.size
    out.save(MAP, "WEBP", quality=95, method=6)
    print(f"ok {MAP.relative_to(ROOT)} {out.size} : dessin décalé de {SHIFT} px ({SHIFT / W * 100:.3f} %) vers la gauche")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
