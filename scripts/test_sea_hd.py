"""Tests des images HD de la mer : python -m unittest scripts/test_sea_hd.py"""
import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sea_hd as s  # noqa: E402


def damier(h=200, w=300):
    yy, xx = np.mgrid[:h, :w]
    light = ((yy // 16 + xx // 16) % 2 == 0)
    img = np.where(light[..., None], 254, 243).astype(np.uint8)
    return np.repeat(img, 3, axis=2) if img.shape[-1] == 1 else img


class Baleine(unittest.TestCase):
    def setUp(self):
        img = damier()
        yy, xx = np.mgrid[:200, :300]
        body = (xx - 150) ** 2 / 90 ** 2 + (yy - 100) ** 2 / 60 ** 2 <= 1
        img[body] = (40, 90, 200)  # baleine bleue
        img[(xx - 120) ** 2 + (yy - 90) ** 2 <= 36] = (255, 255, 255)  # reflet de l'œil, blanc pur
        img[85:118, 170:203] = damier()[85:118, 170:203]  # trou qui laisse voir le damier
        self.alpha = s.checker_alpha(img)

    def test_fond_damier_transparent(self):
        self.assertEqual(self.alpha[5, 5], 0)
        self.assertEqual(self.alpha[190, 290], 0)

    def test_corps_et_reflet_opaques(self):
        self.assertEqual(self.alpha[100, 80], 255)
        self.assertEqual(self.alpha[90, 120], 255)

    def test_trou_montrant_le_damier_transparent(self):
        self.assertEqual(self.alpha[100, 186], 0)

    def test_bord_sans_liseré_gris(self):
        rgba = s.bleed_edge(np.dstack([np.where(self.alpha[..., None] > 0, (40, 90, 200), 250).astype(np.uint8), self.alpha]))
        edge = (self.alpha > 0) & (self.alpha < 250)
        self.assertTrue(edge.any())
        self.assertLess(rgba[edge][:, 0].max(), 120, 'bord resté gris clair')


class Dauphins(unittest.TestCase):
    def test_deux_dauphins_relies_par_la_flaque_separes(self):
        rgba = np.zeros((200, 400, 4), np.uint8)
        yy, xx = np.mgrid[:200, :400]
        rgba[(xx - 110) ** 2 + (yy - 90) ** 2 <= 70 ** 2] = (60, 120, 220, 255)  # grand dauphin
        rgba[(xx - 300) ** 2 + (yy - 110) ** 2 <= 50 ** 2] = (60, 120, 220, 255)  # petit dauphin
        rgba[170:180, 100:310] = (120, 200, 240, 255)  # flaque qui les relie
        big, little = s.split_two(rgba)
        self.assertEqual(big[90, 110, 3], 255)
        self.assertEqual(big[110, 300, 3], 0)
        self.assertEqual(little[110, 300, 3], 255)
        self.assertEqual(little[90, 110, 3], 0)
        # rien en double ; la flaque s'efface en fondu à la couture au lieu d'être tranchée net
        self.assertFalse(((big[..., 3] > 0) & (little[..., 3] > 0)).any())
        row = big[175, 100:320, 3].astype(int)
        self.assertEqual(row[0], 255)
        self.assertTrue(0 < row[row > 0][-1] < 128, 'flaque coupée net')

    def test_queue_reste_avec_son_corps_meme_si_l_autre_est_plus_pres(self):
        rgba = np.zeros((300, 500, 4), np.uint8)
        yy, xx = np.mgrid[:300, :500]
        rgba[(xx - 120) ** 2 + (yy - 120) ** 2 <= 80 ** 2] = (60, 120, 220, 255)  # grand dauphin, à gauche
        rgba[(xx - 380) ** 2 + (yy - 80) ** 2 <= 60 ** 2] = (60, 120, 220, 255)  # petit dauphin, à droite
        rgba[130:260, 260:280] = (60, 120, 220, 255)  # queue du petit : descend sous lui, vers la gauche
        rgba[90:140, 270:340] = (60, 120, 220, 255)  # ... rattachée à son corps
        rgba[250:262, 120:270] = (120, 200, 240, 255)  # flaque qui relie la queue au grand
        big, little = s.split_two(rgba)
        self.assertEqual(little[200, 270, 3], 255, 'queue du petit partie avec le grand')
        self.assertEqual(big[200, 270, 3], 0)


if __name__ == '__main__':
    unittest.main()
