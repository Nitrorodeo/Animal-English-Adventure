"""Outils de mise au point des lieux (décors) : grille de repérage et contrôle visuel des zones.

  python tools/dev/place_tools.py grid  <image.png> <sortie.jpg>
      superpose une grille tous les 5 % (lignes fortes tous les 10 %, étiquetées) pour lire des coordonnées en %.
  python tools/dev/place_tools.py check <src/content/places/xxx.json> <dossier_sortie>
      dessine, pour chaque lieu du fichier, les zones cliquables (rouge, avec le mot), les recadrages des cartes-images
      (bleu pointillé), les points « stand » (vert), les emplacements d'objets « spots » (jaune) et la position de la
      famille « familyAt » (rose), pour vérifier à l'œil que tout tombe au bon endroit.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent


def font(size: int):
    for name in ("arialbd.ttf", "arial.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def grid(src: str, out: str) -> None:
    img = Image.open(src).convert("RGB")
    W, H = img.size
    d = ImageDraw.Draw(img, "RGBA")
    f = font(max(14, W // 90))
    for p in range(0, 101, 5):
        strong = p % 10 == 0
        x = round(W * p / 100)
        y = round(H * p / 100)
        col = (255, 255, 255, 200) if strong else (255, 255, 255, 90)
        d.line([(x, 0), (x, H)], fill=col, width=2 if strong else 1)
        d.line([(0, y), (W, y)], fill=col, width=2 if strong else 1)
        if strong and 0 < p < 100:
            for (tx, ty, label) in ((x + 3, 3, f"x{p}"), (3, y + 2, f"y{p}")):
                d.rectangle([tx - 1, ty - 1, tx + f.size * 2.4, ty + f.size + 2], fill=(0, 0, 0, 150))
                d.text((tx, ty), label, fill=(255, 255, 0, 255), font=f)
    img.save(out, quality=88)


def check(json_path: str, out_dir: str) -> None:
    data = json.loads(Path(json_path).read_text(encoding="utf-8"))
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    for place in data["places"]:
        src = place.get("source")
        if not src:
            continue
        img = Image.open(ROOT / src).convert("RGB")
        W, H = img.size
        d = ImageDraw.Draw(img, "RGBA")
        f = font(max(16, W // 80))
        px = lambda r: (W * r["x"] / 100, H * r["y"] / 100, W * (r["x"] + r["w"]) / 100, H * (r["y"] + r["h"]) / 100)
        for a in place["anchors"]:
            if "crop" in a:
                d.rectangle(px(a["crop"]), outline=(60, 140, 255, 230), width=2)
            x0, y0, x1, y1 = px(a["hit"])
            d.rectangle((x0, y0, x1, y1), outline=(255, 40, 40, 255), width=4, fill=(255, 40, 40, 40))
            d.rectangle([x0, y0, x0 + len(a["word"]) * f.size * 0.62 + 6, y0 + f.size + 4], fill=(255, 40, 40, 220))
            d.text((x0 + 3, y0 + 1), a["word"], fill=(255, 255, 255, 255), font=f)
            if "stand" in a:
                sx, sy = W * a["stand"]["x"] / 100, H * a["stand"]["y"] / 100
                d.ellipse([sx - 9, sy - 9, sx + 9, sy + 9], fill=(40, 220, 80, 255), outline=(0, 0, 0, 255))
        for s in place.get("spots", []):
            sx, sy = W * s["x"] / 100, H * s["y"] / 100
            d.ellipse([sx - 12, sy - 12, sx + 12, sy + 12], fill=(255, 220, 0, 230), outline=(0, 0, 0, 255), width=2)
        fa = place.get("familyAt")
        if fa:
            sx, sy = W * fa["x"] / 100, H * fa["y"] / 100
            d.rectangle([sx - 60, sy - 200, sx + 60, sy], outline=(255, 80, 200, 255), width=4)
            d.text((sx - 55, sy - 195), "famille", fill=(255, 80, 200, 255), font=f)
        img.save(out / f"{place['id']}.jpg", quality=85)
        print("ok", place["id"])


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "grid":
        grid(sys.argv[2], sys.argv[3])
    elif cmd == "check":
        check(sys.argv[2], sys.argv[3])
