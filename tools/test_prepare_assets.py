"""Tests de la préparation des personnages : python -m unittest tools/test_prepare_assets.py"""
import sys
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import prepare_assets as pa  # noqa: E402


def disque_bord_doux() -> Image.Image:
    yy, xx = np.mgrid[:200, :200]
    d = np.hypot(xx - 100, yy - 100)
    a = np.clip((80 - d) * 40, 0, 255)  # bord doux de quelques pixels
    rgba = np.zeros((200, 200, 4), np.uint8)
    rgba[..., :3] = (200, 120, 40)
    rgba[..., 3] = a
    return Image.fromarray(rgba)


class PrepareCharacter(unittest.TestCase):
    def test_brut_garde_le_bord_doux(self):
        out = np.asarray(pa.prepare_character(disque_bord_doux(), raw=True))
        a = out[..., 3]
        self.assertTrue(((a > 0) & (a < 255)).any(), 'bord doux perdu')
        self.assertEqual(int((a > 0).sum()), int((np.asarray(disque_bord_doux())[..., 3] > 0).sum()))

    def test_nettoyage_classique_resserre_le_bord(self):
        brut = np.asarray(pa.prepare_character(disque_bord_doux(), raw=True))[..., 3]
        net = np.asarray(pa.prepare_character(disque_bord_doux(), raw=False))[..., 3]
        self.assertLess(int((net > 8).sum()), int((brut > 8).sum()))

    def test_recadre_et_limite_la_hauteur(self):
        big = Image.new('RGBA', (300, 2000), (0, 0, 0, 0))
        big.paste(Image.new('RGBA', (100, 1500), (200, 100, 50, 255)), (100, 250))
        out = pa.prepare_character(big, raw=True)
        self.assertEqual(out.height, pa.CHAR_MAX_H)
        self.assertLess(out.width, 100)


class ExportHD(unittest.TestCase):
    def test_personnage_haute_qualite_et_transparence_exacte(self):
        import io
        img = pa.prepare_character(disque_bord_doux(), raw=True)
        buf = io.BytesIO()
        img.save(buf, "WEBP", **pa.CHAR_WEBP)
        back = np.asarray(Image.open(buf).convert("RGBA")).astype(int)
        src = np.asarray(img).astype(int)
        self.assertLessEqual(np.abs(back[..., 3] - src[..., 3]).max(), 2)  # bord doux intact
        opaque = src[..., 3] == 255
        self.assertLessEqual(np.abs(back[opaque, :3] - src[opaque, :3]).max(), 6)  # couleurs fidèles

    def test_decor_en_haute_qualite(self):
        self.assertGreaterEqual(pa.BG_WEBP["quality"], 95)


if __name__ == '__main__':
    unittest.main()


class PrepareBackground(unittest.TestCase):
    def fond(self) -> Image.Image:
        img = Image.new('RGB', (400, 225), (0, 0, 255))
        img.paste(Image.new('RGB', (100, 225), (255, 0, 0)), (0, 0))  # bande rouge à gauche
        return img

    def test_miroir_place_la_gauche_a_droite(self):
        out = pa.prepare_background(self.fond(), {'flip': True})
        self.assertEqual(out.getpixel((399, 100)), (255, 0, 0))
        self.assertEqual(out.getpixel((0, 100)), (0, 0, 255))

    def test_sans_miroir_et_largeur_limitee(self):
        out = pa.prepare_background(self.fond(), {'maxWidth': 200})
        self.assertEqual(out.size, (200, 112))
        self.assertEqual(out.getpixel((10, 50)), (255, 0, 0))
