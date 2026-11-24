"""Rend les dessins des cadeaux du soir (SVG) en images PNG transparentes, avec Chrome (ou Edge) sans fenêtre.

Usage : python tools/cadeaux/rendre.py fichier.svg [autre.svg ...] [--taille 768] [--sortie dossier]
Sans --sortie, le PNG est écrit à côté du SVG. La taille est celle du plus grand côté (le dessin garde ses proportions).
Rien à installer : Chrome (ou Edge en repli) sans fenêtre.
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

# Chrome d'abord : il écrit l'image avant de rendre la main (Edge la termine parfois après)
NAVIGATEURS = [
    Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
    Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
    Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
]


def navigateur() -> Path:
    for p in NAVIGATEURS:
        if p.exists():
            return p
    sys.exit("Ni Edge ni Chrome trouvé.")


def proportions(svg: str) -> tuple[float, float]:
    m = re.search(r'viewBox\s*=\s*"([-\d.eE]+)[ ,]+([-\d.eE]+)[ ,]+([-\d.eE]+)[ ,]+([-\d.eE]+)"', svg)
    if not m:
        sys.exit("Le SVG doit avoir un viewBox.")
    return float(m.group(3)), float(m.group(4))


def rendre(src: Path, taille: int, sortie: Path) -> Path:
    svg = src.read_text(encoding="utf-8")
    w, h = proportions(svg)
    k = taille / max(w, h)
    pw, ph = max(1, round(w * k)), max(1, round(h * k))
    page = (
        "<!doctype html><html><head><meta charset='utf-8'><style>html,body{margin:0;background:transparent;overflow:hidden}"
        f"img{{display:block;width:{pw}px;height:{ph}px}}</style></head><body><img src='{src.resolve().as_uri()}'></body></html>"
    )
    with tempfile.TemporaryDirectory() as tmp:
        html = Path(tmp) / "page.html"
        html.write_text(page, encoding="utf-8")
        png = sortie / (src.stem + ".png")
        cmd = [
            str(navigateur()), "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
            "--allow-file-access-from-files", "--default-background-color=00000000", "--force-device-scale-factor=1",
            f"--user-data-dir={Path(tmp) / 'profil'}", f"--window-size={pw},{ph}", f"--screenshot={png}", html.as_uri(),
        ]
        subprocess.run(cmd, check=True, capture_output=True, timeout=90)
        for _ in range(100):  # Edge peut finir d'écrire après avoir rendu la main
            if png.exists() and png.stat().st_size > 0:
                break
            time.sleep(0.1)
    if not png.exists():
        sys.exit(f"Rendu impossible : {src}")
    return png


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("svg", nargs="+", type=Path)
    ap.add_argument("--taille", type=int, default=768)
    ap.add_argument("--sortie", type=Path)
    a = ap.parse_args()
    for s in a.svg:
        out = a.sortie or s.parent
        out.mkdir(parents=True, exist_ok=True)
        print(rendre(s, a.taille, out))


if __name__ == "__main__":
    main()
