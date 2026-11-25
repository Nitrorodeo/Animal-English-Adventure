"""Tests des planches marines : python -m unittest scripts/test_sea_famille.py"""
import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sea_famille as s  # noqa: E402


class FondVert(unittest.TestCase):
    def setUp(self):
        img = np.zeros((120, 160, 3), np.uint8)
        img[:] = (0, 255, 0)  # fond vert vif
        img[40:80, 40:120] = (200, 150, 60)  # animal brun-orangé
        img[50:60, 50:60] = (240, 235, 140)  # ventre jaune pâle (ne doit pas être pris pour du vert)
        img[40, 40:120] = (90, 200, 60)  # bord teinté de vert
        self.out = s.chroma_key(img)

    def test_fond_transparent(self):
        self.assertEqual(self.out[5, 5, 3], 0)
        self.assertEqual(self.out[110, 150, 3], 0)

    def test_animal_opaque_et_couleur_gardee(self):
        self.assertEqual(self.out[70, 100, 3], 255)
        self.assertEqual(tuple(self.out[70, 100, :3]), (200, 150, 60))
        self.assertEqual(self.out[55, 55, 3], 255)  # ventre jaune pâle

    def test_vert_du_bord_ramene_au_gris(self):
        r, g, b, _ = self.out[40, 80]
        self.assertLessEqual(g, max(r, b) + 4)


class Sorties(unittest.TestCase):
    def test_les_planches_et_les_fonds_ont_ete_fabriques(self):
        for name in ("whale_family_hd", "turtle_mother_hd", "turtle_baby_hd", "bg_whale_1", "bg_whale_2", "bg_whale_3", "bg_dolphins_1", "bg_dolphins_2", "bg_turtle_1", "bg_turtle_2"):
            self.assertTrue((s.OUT / f"{name}.webp").exists(), name)

    def test_la_petite_tortue_est_plus_petite_que_la_grande(self):
        from PIL import Image

        big, little = (Image.open(s.OUT / f"turtle_{k}_hd.webp").width for k in ("mother", "baby"))
        self.assertLess(little, big)


if __name__ == "__main__":
    unittest.main()
