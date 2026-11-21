"""Carte du monde élargie pour un écran large (demande du parent, 2026-11-20 : « Écarte les continents et
joue avec pour pouvoir mettre cette carte plein écran propre en HD »).

On n'étire pas l'image : on insère de l'océan entre les continents (« seam carving » en élargissement).
Chaque couture est un chemin vertical d'un pixel par ligne, choisi là où l'image est la plus unie (mer,
nuages, banquise) ; les terres, les animaux dessinés et les animaux marins découpés (sea.ts) sont protégés
et gardent exactement leur forme. Les coutures se répartissent : une couture déjà insérée rend la zone
voisine plus chère pour les suivantes, pour ne pas étirer toujours le même bout de mer.

Entrée : public/assets/backgrounds/world_map_1448.webp (carte d'origine, 1448 × 1086, gardée).
Sortie : public/assets/backgrounds/world_map.webp + scripts/map_warp.json (pour recaler les repères, non chargé par le jeu).

    python scripts/map_wide.py [ratio=2.0]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public/assets/backgrounds/world_map_1448.webp"
OUT = ROOT / "public/assets/backgrounds/world_map.webp"
WARP = ROOT / "scripts/map_warp.json"

# zones intouchables, en % de la carte d'origine (x, y, w, h) : animaux marins découpés (sea.ts), manchots
HARD = [
    (60.5, 42.5, 14.5, 12.5),  # baleine
    (66, 70, 10, 9),  # tortue
    (24.5, 64, 10, 11.5),  # grand dauphin
    (28.5, 67, 10, 9),  # petit dauphin
    (42, 73, 15, 15),  # famille de manchots
]


def luminance(a: np.ndarray) -> np.ndarray:
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def gradient(a: np.ndarray) -> np.ndarray:
    l = luminance(a)
    gx = np.zeros_like(l)
    gy = np.zeros_like(l)
    gx[:, 1:-1] = l[:, 2:] - l[:, :-2]
    gy[1:-1, :] = l[2:, :] - l[:-2, :]
    return np.abs(gx) + np.abs(gy)


def open_water(a: np.ndarray) -> np.ndarray:
    """Mer (bleu franc) ou nuage / banquise (très clair, peu coloré) : là où on peut insérer."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    sat = (mx - mn) / np.maximum(mx, 1)
    blue = (b >= mx - 1) & (b > r + 25) & (sat > 0.18)
    pale = (mn > 185) & (sat < 0.22)
    return blue | pale


def grow(mask: np.ndarray, n: int) -> np.ndarray:
    """Dilatation simple (carré de côté 2n+1)."""
    out = mask.copy()
    for _ in range(n):
        m = out.copy()
        m[1:, :] |= out[:-1, :]
        m[:-1, :] |= out[1:, :]
        m[:, 1:] |= out[:, :-1]
        m[:, :-1] |= out[:, 1:]
        out = m
    return out


def best_seam(energy: np.ndarray) -> np.ndarray:
    h, w = energy.shape
    cost = energy[0].copy()
    back = np.zeros((h, w), dtype=np.int8)
    inf = np.float64(np.inf)
    for y in range(1, h):
        left = np.concatenate(([inf], cost[:-1]))
        right = np.concatenate((cost[1:], [inf]))
        stack = np.vstack((left, cost, right))
        k = np.argmin(stack, axis=0)
        back[y] = k - 1
        cost = energy[y] + stack[k, np.arange(w)]
    seam = np.empty(h, dtype=np.int64)
    seam[-1] = int(np.argmin(cost))
    for y in range(h - 1, 0, -1):
        seam[y - 1] = seam[y] + back[y, seam[y]]
    return seam


def insert(arr: np.ndarray, seam: np.ndarray, value: np.ndarray | None = None) -> np.ndarray:
    """Insère une colonne juste à droite de la couture ; valeur = moyenne des voisins (ou `value`)."""
    h, w = arr.shape[:2]
    out = np.empty((h, w + 1) + arr.shape[2:], dtype=arr.dtype)
    for y in range(h):
        x = seam[y]
        out[y, : x + 1] = arr[y, : x + 1]
        out[y, x + 2 :] = arr[y, x + 1 :]
        if value is not None:
            out[y, x + 1] = value[y]
        else:
            nxt = arr[y, min(x + 1, w - 1)]
            out[y, x + 1] = (arr[y, x] + nxt) / 2
    return out


def main() -> int:
    ratio = float(sys.argv[1]) if len(sys.argv) > 1 else 2.0
    img = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float64)
    H, W = img.shape[:2]
    target = round(H * ratio)
    print(f"carte {W}x{H} -> {target}x{H} ({target - W} coutures)")

    water = open_water(img)
    # une terre garde aussi son rivage (2 px) ; les petits îlots isolés dans la mer ne bloquent pas
    land = grow(~water, 2)
    protect = np.where(land, 2e5, 0.0)  # traverser une terre coûte plus que n importe quel détour en mer
    for x, y, w, h in HARD:
        protect[int(y / 100 * H) : int((y + h) / 100 * H), int(x / 100 * W) : int((x + w) / 100 * W)] = 1e7
    # origine de chaque pixel (colonne d'origine, fractionnaire pour les pixels insérés)
    origin = np.tile(np.arange(W, dtype=np.float64), (H, 1))
    crowd = np.zeros((H, W))  # coutures déjà passées par là : on s'en écarte

    a = img
    for i in range(target - W):
        energy = gradient(a) + protect + crowd * 20.0
        seam = best_seam(energy)
        a = insert(a, seam)
        origin = insert(origin, seam)
        protect = insert(protect, seam)
        rows = np.arange(H)
        crowd = insert(crowd, seam, value=crowd[rows, seam] + 1)
        # la zone autour de la couture devient plus chère (répartit l'élargissement)
        for d in range(-6, 8):
            xs = np.clip(seam + 1 + d, 0, a.shape[1] - 1)
            crowd[rows, xs] += max(0.0, 1.0 - abs(d - 0.5) / 7.5)
        if i % 100 == 0:
            print(f"  {i} / {target - W}")

    out = Image.fromarray(np.clip(a + 0.5, 0, 255).astype(np.uint8), "RGB")
    out.save(OUT, "WEBP", quality=95, method=6)
    # table de recalage : pour 1 ligne sur 4, nouvelle position (en %) des colonnes d'origine tous les 1 %
    step = 4
    table = []
    for y in range(0, H, step):
        o = origin[y]
        xs = np.linspace(0, W - 1, 101)
        nx = np.interp(xs, o, np.arange(a.shape[1]))
        table.append([round(float(v) / (a.shape[1] - 1) * 100, 2) for v in nx])
    WARP.write_text(
        json.dumps({"from": [W, H], "to": [a.shape[1], H], "rowStep": step / H * 100, "cols": table}, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    print(f"ok {OUT.relative_to(ROOT)} {out.size}, {WARP.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
