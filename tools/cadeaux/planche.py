"""Planches de contrôle visuel des cadeaux du soir.

Usage :
  python -I tools/cadeaux/planche.py lot  sortie.jpg id1 id2 ...      objets côte à côte, même hauteur, avec leur nom
  python -I tools/cadeaux/planche.py famille sortie.jpg lion          le papa + tous les cadeaux que cette famille peut
                                                                      recevoir, chacun à sa taille logique (h × papa)
Les dessins sont lus dans `assets/cadeaux/v2/<id>.svg` et rendus avec Chrome sans fenêtre (`rendre.py`).
"""
from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ICI = Path(__file__).parent
REPO = ICI.parent.parent
sys.path.insert(0, str(ICI))
from rendre import rendre  # noqa: E402

FOND = (245, 239, 228, 255)
ENCRE = (60, 40, 30)
# hauteur du papa en % de la scène (src/ui/scene.ts, ADULT_HEIGHT)
ADULT = {"elephant": 44, "giraffe": 54, "lion": 34, "tiger": 34, "giant_panda": 32, "bear": 36, "polar_bear": 38, "bison": 36,
         "kangaroo": 38, "jaguar": 30, "koala": 30, "fox": 30, "snow_leopard": 31, "sloth": 30, "penguin": 30, "owl": 28,
         "toucan": 28, "beaver": 27, "seal": 25, "frilled_lizard": 24, "hedgehog": 22}


def police(t: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype("arialbd.ttf", t)
    except OSError:
        return ImageFont.load_default()


def image(id_: str, tmp: Path, taille: int = 768) -> Image.Image | None:
    svg = REPO / "assets" / "cadeaux" / "v2" / f"{id_}.svg"
    if not svg.exists():
        return None
    im = Image.open(rendre(svg, taille, tmp)).convert("RGBA")
    return im.crop(im.getbbox())


def a_hauteur(im: Image.Image, h: float) -> Image.Image:
    h = max(1, round(h))
    return im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)


def grille(cases: list[tuple[str, Image.Image]], par_ligne: int, haut: int) -> Image.Image:
    f = police(26)
    cases = [(n, a_hauteur(i, haut)) for n, i in cases]
    lignes = [cases[k:k + par_ligne] for k in range(0, len(cases), par_ligne)]
    W = max(sum(i.width for _, i in l) + 40 * (len(l) + 1) for l in lignes)
    out = Image.new("RGBA", (W, len(lignes) * (haut + 80) + 20), FOND)
    d = ImageDraw.Draw(out)
    y = 20
    for l in lignes:
        x = 40
        for n, i in l:
            out.alpha_composite(i, (x, y + 40))
            d.text((x, y), n, fill=ENCRE, font=f)
            x += i.width + 40
        y += haut + 80
    return out


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    mode, sortie = sys.argv[1], Path(sys.argv[2])
    cat = json.loads((ICI / "catalogue.json").read_text(encoding="utf-8"))
    gifts = {g["id"]: g for g in cat["gifts"]}
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        if mode == "lot":
            cases = [(i, im) for i in sys.argv[3:] if (im := image(i, tmp)) is not None]
            manquants = [i for i in sys.argv[3:] if i not in dict(cases)]
            out = grille(cases, 5, 300)
        else:
            sp = sys.argv[3]
            papa_h = 420.0
            papa = Image.open(REPO / "public" / "assets" / "characters" / f"{sp}_father.webp").convert("RGBA")
            papa = a_hauteur(papa.crop(papa.getbbox()), papa_h)
            ids = [g["id"] for g in cat["gifts"] if g.get("species") in (None, sp)]
            objets, manquants = [], []
            for i in ids:
                im = image(i, tmp)
                if im is None:
                    manquants.append(i)
                else:
                    objets.append((i, a_hauteur(im, gifts[i]["h"] * papa_h)))
            # le papa à gauche, puis les objets alignés sur le même sol, en rangées
            f = police(20)
            largeur = 2400
            rangs, rang, x = [], [], papa.width + 80
            for n, im in objets:
                if x + im.width > largeur and rang:
                    rangs.append(rang); rang, x = [], 40
                rang.append((n, im)); x += im.width + 40
            rangs.append(rang)
            hr = [max([im.height for _, im in r] + ([papa.height] if k == 0 else [1])) for k, r in enumerate(rangs)]
            out = Image.new("RGBA", (largeur, sum(h + 70 for h in hr) + 40), FOND)
            d = ImageDraw.Draw(out)
            y = 20
            for k, (r, h) in enumerate(zip(rangs, hr)):
                sol = y + h
                x = 40
                if k == 0:
                    out.alpha_composite(papa, (x, sol - papa.height)); x += papa.width + 40
                for n, im in r:
                    out.alpha_composite(im, (x, sol - im.height))
                    d.text((x, sol + 8), n, fill=ENCRE, font=f)
                    x += im.width + 40
                d.line([(20, sol), (largeur - 20, sol)], fill=(200, 185, 160), width=2)
                y = sol + 70
        out.convert("RGB").save(sortie, quality=90)
    if manquants:
        print("pas encore dessinés :", ", ".join(manquants))
    print(sortie)


if __name__ == "__main__":
    main()
