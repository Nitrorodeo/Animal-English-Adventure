"""Contrôle mécanique des dessins des cadeaux du soir (SVG de `assets/cadeaux/v2/`).

Usage : python -I tools/cadeaux/controle.py assets/cadeaux/v2/ball.svg [...]   (ou un dossier)
Chaque dessin est rendu (Chrome sans fenêtre, comme `rendre.py`) puis mesuré sur l'image réelle :
  - SVG valide, viewBox présent, pas de texte ni d'image externe, ids préfixés par le nom de l'objet, < 150 Ko ;
  - fond transparent (coins vides), objet serré dans le viewBox (marges ≤ 3 %), posé par sa base (bas ≤ 1,5 %) ;
  - couleurs du catalogue bien présentes (les jeux demandent « Is the ball red? »).
Sortie : une ligne OK / ÉCHEC par objet, avec la raison. Code de sortie 1 s'il y a un échec.
"""
from __future__ import annotations

import colorsys
import json
import re
import sys
import tempfile
import xml.dom.minidom
from pathlib import Path

import numpy as np
from PIL import Image

ICI = Path(__file__).parent
sys.path.insert(0, str(ICI))
from rendre import rendre  # noqa: E402

TAILLE = 512
MAX_KO = 150


def teinte(nom: str, h: np.ndarray, s: np.ndarray, v: np.ndarray) -> np.ndarray:
    """Pixels qui « sont » de cette couleur, au sens d'un enfant (teinte en degrés, s et v entre 0 et 1)."""
    vif = (s > 0.35) & (v > 0.35)
    return {
        "red": vif & ((h < 14) | (h > 340)),
        "orange": vif & (h >= 14) & (h < 40),
        "yellow": vif & (h >= 40) & (h < 68),
        "gold": (s > 0.3) & (v > 0.45) & (h >= 30) & (h < 62),
        "green": vif & (h >= 68) & (h < 170),
        "blue": (s > 0.25) & (v > 0.3) & (h >= 185) & (h < 255),
        "purple": vif & (h >= 255) & (h < 315),
        "pink": (s > 0.2) & (v > 0.55) & ((h >= 315) | (h < 12)),
        "brown": (s > 0.25) & (v > 0.12) & (v < 0.75) & (h >= 8) & (h < 50),
        "white": (s < 0.2) & (v > 0.8),
    }[nom]


def couleurs(png: Path, voulues: list[str]) -> list[str]:
    a = np.asarray(Image.open(png).convert("RGBA"), dtype=np.float32) / 255
    rgb = a[..., :3][a[..., 3] > 0.6]
    if len(rgb) == 0:
        return ["image vide"]
    hsv = np.array([colorsys.rgb_to_hsv(*p) for p in rgb[:: max(1, len(rgb) // 20000)]])
    h, s, v = hsv[:, 0] * 360, hsv[:, 1], hsv[:, 2]
    manque = []
    for c in voulues:
        if c == "rainbow":
            n = sum(teinte(x, h, s, v).mean() > 0.02 for x in ("red", "orange", "yellow", "green", "blue", "purple"))
            if n < 4:
                manque.append(f"arc-en-ciel ({n} couleurs vives sur 6)")
            continue
        part = teinte(c, h, s, v).mean()
        if part < 0.03:
            manque.append(f"{c} {part:.1%}")
    return manque


def controler(svg: Path, cat: dict[str, dict]) -> list[str]:
    nom = svg.stem
    err: list[str] = []
    g = cat.get(nom)
    if g is None:
        return [f"« {nom} » n'est pas dans catalogue.json"]
    if svg.stat().st_size > MAX_KO * 1024:
        err.append(f"fichier {svg.stat().st_size // 1024} Ko > {MAX_KO}")
    txt = svg.read_text(encoding="utf-8")
    try:
        doc = xml.dom.minidom.parseString(txt)
    except Exception as e:  # noqa: BLE001
        return err + [f"XML invalide : {e}"]
    root = doc.documentElement
    if root.tagName != "svg" or not root.getAttribute("viewBox"):
        err.append("pas de viewBox sur <svg>")
    if doc.getElementsByTagName("text"):
        err.append("contient du texte")
    for im in doc.getElementsByTagName("image"):
        if not (im.getAttribute("href") or im.getAttribute("xlink:href")).startswith("data:"):
            err.append("image externe")
    ids = re.findall(r'\bid="([^"]+)"', txt)
    mauvais = [i for i in ids if not i.startswith(nom + "-")]
    if mauvais:
        err.append(f"ids non préfixés par « {nom}- » : {', '.join(mauvais[:4])}")
    if len(ids) != len(set(ids)):
        err.append("ids en double")
    with tempfile.TemporaryDirectory() as tmp:
        png = rendre(svg, TAILLE, Path(tmp))
        im = Image.open(png).convert("RGBA")
        a = np.asarray(im)[..., 3]
        W, H = im.size
        if max(a[0, 0], a[0, -1], a[-1, 0], a[-1, -1]) > 10 and (a > 10).mean() > 0.97:
            err.append("fond opaque (pas transparent)")
        ys, xs = np.nonzero(a > 24)
        if len(xs) == 0:
            return err + ["rendu vide"]
        marges = {"gauche": xs.min() / W, "droite": (W - 1 - xs.max()) / W, "haut": ys.min() / H, "bas": (H - 1 - ys.max()) / H}
        for cote, m in marges.items():
            if m > (0.015 if cote == "bas" else 0.03):
                err.append(f"marge {cote} {m:.1%} (viewBox pas serré" + (", l'objet ne repose pas sur le bas)" if cote == "bas" else ")"))
        manque = couleurs(png, g["colors"])
        if manque:
            err.append("couleurs trop peu présentes : " + ", ".join(manque))
    return err


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    cat ={g["id"]: g for g in json.loads((ICI / "catalogue.json").read_text(encoding="utf-8"))["gifts"]}
    fichiers: list[Path] = []
    for a in sys.argv[1:]:
        p = Path(a)
        fichiers += sorted(p.glob("*.svg")) if p.is_dir() else [p]
    echecs = 0
    for f in fichiers:
        e = controler(f, cat)
        echecs += bool(e)
        print(f"{'ÉCHEC' if e else 'OK   '} {f.stem}" + (" — " + " ; ".join(e) if e else ""))
    print(f"{len(fichiers) - echecs}/{len(fichiers)} OK")
    sys.exit(1 if echecs else 0)


if __name__ == "__main__":
    main()
