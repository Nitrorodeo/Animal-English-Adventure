"""Fond de la carte du monde sur toute la page (demande du parent, 2026-11-20 : « la MAP propre et mise
correctement sur toute la page »).

La carte est en 4:3 ; l'écran est plus large. Les bandes de côté reçoivent ce fond : le bord de la carte
(océan, nuages) étiré vers l'extérieur, puis flouté ; la mer et les nuages continuent sans raccord. Petite image
(quelques dizaines de Ko), agrandie par le navigateur : le jeu reste rapide.

Lancement : python scripts/map_backdrop.py
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "assets" / "backgrounds" / "world_map.webp"
OUT = ROOT / "public" / "assets" / "backgrounds" / "world_map_backdrop.webp"
H = 360  # hauteur du fond : le flou n'a pas besoin de plus


def backdrop(src: Image.Image, height: int = H) -> Image.Image:
    """Carte au centre ; de chaque côté, sa bande de bord (océan, nuages) étirée vers l'extérieur, puis
    tout est flouté : les côtés prolongent la mer et les nuages sans répéter les continents."""
    w = round(src.width * height / src.height)
    mid = src.convert("RGB").resize((w, height), Image.LANCZOS)
    strip = max(4, w // 40)
    left = mid.crop((0, 0, strip, height)).resize((w, height), Image.BICUBIC)
    right = mid.crop((w - strip, 0, w, height)).resize((w, height), Image.BICUBIC)
    wide = Image.new("RGB", (3 * w, height))
    wide.paste(left, (0, 0))
    wide.paste(mid, (w, 0))
    wide.paste(right, (2 * w, 0))
    return wide.filter(ImageFilter.GaussianBlur(height / 14))


def main() -> int:
    img = backdrop(Image.open(SRC))
    img.save(OUT, "WEBP", quality=80, method=6)
    print(OUT.name, img.size, OUT.stat().st_size // 1024, "Ko")
    return 0


if __name__ == "__main__":
    sys.exit(main())
