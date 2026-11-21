"""Reflets verts restants sur les PNG déjà découpés d'une famille (ancien pipeline fond vert) :
    python tools/despill_png.py <dossier> [<dossier> ...]
Chaque PNG du dossier est repris en place par `decoupe_planche.despill_spots` ; affiche le nombre de
pixels changés par personnage. Sans effet sur ce qui n'est pas un petit point olive ou jaune-vert."""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import decoupe_planche as d  # noqa: E402


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 2
    for folder in argv:
        for f in sorted(Path(folder).glob('*.png')):
            im = np.array(Image.open(f).convert('RGBA'))
            out = d.despill_spots(im)
            n = int((out != im).any(axis=2).sum())
            if n:
                Image.fromarray(out).save(f, optimize=True)
            print(f'{f.name}: {n} pixel(s) repris')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
