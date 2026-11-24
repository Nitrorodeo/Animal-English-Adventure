"""Exporte les cadeaux du soir pour le jeu : chaque dessin `assets/cadeaux/v2/<id>.svg` devient
`public/assets/gifts/<id>.webp` (transparent, 640 px sur le plus grand côté), et le catalogue devient
`src/content/gifts.json` (sans les consignes de dessin, avec les proportions largeur / hauteur de chaque image).

Usage : python tools/cadeaux/exporter.py [--taille 640] [id ...]
Sans id, tout le catalogue est exporté. Rien à installer : Chrome sans fenêtre (voir rendre.py), PIL.
"""
from __future__ import annotations

import argparse
import json
import sys
import tempfile
from pathlib import Path

from PIL import Image

ICI = Path(__file__).parent
RACINE = ICI.parent.parent
sys.path.insert(0, str(ICI))
from rendre import proportions, rendre  # noqa: E402

DESSINS = RACINE / "assets" / "cadeaux" / "v2"
IMAGES = RACINE / "public" / "assets" / "gifts"
CONTENU = RACINE / "src" / "content" / "gifts.json"


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--taille", type=int, default=640)
    a = ap.parse_args()
    cat = json.loads((ICI / "catalogue.json").read_text(encoding="utf-8"))
    IMAGES.mkdir(parents=True, exist_ok=True)
    sortie = []
    for g in cat["gifts"]:
        svg = DESSINS / f"{g['id']}.svg"
        w, h = proportions(svg.read_text(encoding="utf-8"))
        if not a.ids or g["id"] in a.ids:
            with tempfile.TemporaryDirectory() as tmp:
                png = rendre(svg, a.taille, Path(tmp))
                im = Image.open(png).convert("RGBA")
                im.save(IMAGES / f"{g['id']}.webp", "WEBP", quality=88, method=6)
            print(g["id"], im.size)
        e = {k: g[k] for k in ("id", "en", "fr", "colors", "h", "where", "use") if k in g}
        if g.get("species"):
            e["species"] = g["species"]
        if g.get("float"):
            e["float"] = True
        e["ratio"] = round(w / h, 3)
        sortie.append(e)
    CONTENU.write_text(
        json.dumps({"branchMaxH": cat["branch_max_h"], "gifts": sortie}, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )
    print(len(sortie), "cadeaux ->", CONTENU)


if __name__ == "__main__":
    main()
