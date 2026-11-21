"""Tests du découpeur de planches : python -m unittest tools/test_decoupe_planche.py"""
import sys
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import decoupe_planche as d  # noqa: E402

GREEN = (0, 255, 0)
# (centre x, centre y, rayon, couleur) : 2 parents, puis garçon 1→4, puis fille 1→4 (tailles croissantes)
SPOTS = [(150, 80, 55, (230, 120, 30)), (420, 80, 50, (200, 100, 40))]
SPOTS += [(60 + 120 * k, 230, 25 + 5 * k, (240, 140, 40)) for k in range(4)]
SPOTS += [(60 + 120 * k, 360, 25 + 5 * k, (250, 150, 60)) for k in range(4)]


def planche(bg=GREEN):
    img = np.zeros((430, 560, 3), np.uint8)
    img[:] = bg
    yy, xx = np.mgrid[:430, :560]
    for x, y, r, col in SPOTS:
        img[(xx - x) ** 2 + (yy - y) ** 2 <= r * r] = col
    return img


class DecoupePlanche(unittest.TestCase):
    def test_fond_vert_dix_personnages_dans_l_ordre(self):
        crops = d.split(d.to_rgba(Image.fromarray(planche())))
        self.assertEqual(len(crops), 10)
        # les tailles suivent l'ordre attendu : bébés de plus en plus grands, sur chaque ligne
        widths = [c.shape[1] for c in crops]
        self.assertEqual(widths[2:6], sorted(widths[2:6]))
        self.assertEqual(widths[6:], sorted(widths[6:]))
        for c in crops:
            a = c[..., 3]
            self.assertEqual(a[0, 0], 0)  # coin transparent
            self.assertEqual(a[c.shape[0] // 2, c.shape[1] // 2], 255)  # cœur opaque
            visible = c[a > 30]
            self.assertTrue((visible[:, 1] <= np.maximum(visible[:, 0], visible[:, 2]) + 4).all(), 'reflet vert au bord')

    def test_planche_deja_transparente(self):
        rgb = planche()
        alpha = np.where((rgb == GREEN).all(axis=2), 0, 254).astype(np.uint8)
        crops = d.split(d.to_rgba(Image.fromarray(np.dstack([rgb, alpha]))))
        self.assertEqual(len(crops), 10)
        self.assertEqual(crops[0][crops[0].shape[0] // 2, crops[0].shape[1] // 2, 3], 255)

    def test_fond_creme_en_degrade_ombre_retiree_ventre_et_dent_gardes(self):
        h, w = 430, 560
        ramp = np.linspace(0, 18, h)[:, None, None]
        bg = np.clip(np.array([253, 246, 239], np.float32) - ramp + np.zeros((h, w, 3)), 0, 255)
        img = bg.copy()
        yy, xx = np.mgrid[:h, :w]
        # ombre au sol, plus sombre que le fond mais lisse, sous papa
        shadow = ((xx - 150) / 70.0) ** 2 + ((yy - 138) / 9.0) ** 2 <= 1
        img[shadow] *= 0.8
        rng = np.random.default_rng(1)
        for x, y, r, col in SPOTS:
            disk = (xx - x) ** 2 + (yy - y) ** 2 <= r * r
            img[disk] = np.clip(np.array(col) + rng.normal(0, 12, (disk.sum(), 3)), 0, 255)  # fourrure
        img[85:105, 135:165] = (250, 236, 205)  # ventre crème, proche du fond mais d'une autre teinte
        img[60:72, 160:170] = (255, 255, 255)  # dent blanche
        crops = d.split(d.to_rgba(Image.fromarray(img.astype(np.uint8))))
        self.assertEqual(len(crops), 10)
        papa = crops[0][..., 3]
        oy, ox = 80 - 55 - d.PAD, 150 - 55 - d.PAD
        self.assertLess(papa.shape[0], 2 * 55 + 2 * d.PAD + 8, 'ombre au sol emportée avec papa')
        self.assertEqual(papa[95 - oy, 150 - ox], 255, 'ventre crème troué')
        self.assertEqual(papa[66 - oy, 165 - ox], 255, 'dent trouée')

    def test_fond_bruite_refuse(self):
        rng = np.random.default_rng(2)
        noisy = rng.integers(0, 256, (430, 560, 3), dtype=np.uint8)
        with self.assertRaises(ValueError):
            d.to_rgba(Image.fromarray(noisy))

    def test_animaux_qui_se_touchent_separes_au_contact(self):
        img = planche()
        img[78:83, 200:375] = (230, 120, 30)  # un fil (queue contre oreille) relie papa et maman
        crops = d.split(d.to_rgba(Image.fromarray(img)))
        self.assertEqual(len(crops), 10)
        # papa n'emporte pas maman : sa découpe garde à peu près sa propre largeur
        self.assertLess(crops[0].shape[1], 2 * 55 + 120)
        self.assertLess(crops[1].shape[1], 2 * 50 + 120)

    def test_ombre_verte_entre_les_pattes_retiree_feuille_gardee(self):
        img = planche()
        img[100:128, 140:160] = (0, 70, 0)  # ombre du fond, vert sombre, dans le bas de papa
        img[35:45, 140:160] = (10, 75, 10)  # feuille vert sombre près de la tête de papa
        papa = d.split(d.to_rgba(Image.fromarray(img)))[0]
        a = papa[..., 3]
        oy, ox = 80 - 55 - d.PAD, 150 - 55 - d.PAD  # origine de la découpe : bord du disque - PAD
        self.assertEqual(a[114 - oy, 150 - ox], 0, 'ombre verte restée opaque')
        self.assertGreater(a[40 - oy, 150 - ox], 200, 'feuille effacée')

    def test_etiquettes_ecartees(self):
        img = planche()
        for x, y, r, _ in SPOTS[2:]:
            img[y + r + 8:y + r + 22, x - 40:x + 40] = (40, 90, 200)  # pastille « Stade n » sous chaque bébé
        self.assertEqual(len(d.split(d.to_rgba(Image.fromarray(img)))), 10)

    def test_personnage_manquant_refuse(self):
        img = planche()
        img[330:400, 160:220] = GREEN  # un bébé effacé
        with self.assertRaises(ValueError):
            d.split(d.to_rgba(Image.fromarray(img)))

    def test_ombre_au_sol_retiree_sur_planche_transparente(self):
        rgb = planche()
        alpha = np.where((rgb == GREEN).all(axis=2), 0, 255).astype(np.uint8)
        alpha[135:150, 90:220] = np.maximum(alpha[135:150, 90:220], 90)  # ombre semi-transparente sous papa
        crops = d.split(d.to_rgba(Image.fromarray(np.dstack([rgb, alpha]))))
        self.assertLess(crops[0].shape[0], 2 * 55 + 2 * d.PAD + 2 * d.SOFT_EDGE + 8)

    def test_retouche_grabcut_retire_le_sol_garde_le_corps(self):
        rng = np.random.default_rng(1)
        rgb = np.clip(np.full((160, 200, 3), (215, 200, 170), float) + rng.normal(0, 4, (160, 200, 3)), 0, 255).astype(np.uint8)
        rgb[30:110, 40:160] = (200, 120, 30)  # corps orange
        rgba = np.dstack([rgb, np.zeros((160, 200), np.uint8)])
        rgba[30:110, 40:160, 3] = 255
        rgba[110:125, 60:140, 3] = 255  # sol crème resté collé sous le corps
        out = d.retouch(rgb, rgba, [[50, 100, 150, 130]])
        self.assertEqual(int((out[112:125, 60:140, 3] > 0).sum()), 0)
        self.assertTrue((out[30:110, 40:160, 3] == 255).all())
        self.assertTrue((out[:, :, :3][out[:, :, 3] > 0] == rgba[:, :, :3][out[:, :, 3] > 0]).all())

    def test_retouche_pale_retire_le_gris_garde_couleur_et_hors_zone(self):
        rgb = np.zeros((60, 60, 3), np.uint8)
        rgb[:, :30] = (190, 185, 175)  # sol pâle presque gris
        rgb[:, 30:] = (200, 110, 30)   # touffe orange
        rgb[:, :10] = (235, 230, 220)  # corne claire, hors zone
        rgba = np.dstack([rgb, np.full((60, 60), 255, np.uint8)])
        out = d.retouch(rgb, rgba, [{'zone': [10, 0, 60, 60], 'pale': True}])
        self.assertTrue((out[:, 10:30, 3] == 0).all())
        self.assertTrue((out[:, 30:, 3] == 255).all())
        self.assertTrue((out[:, :10, 3] == 255).all())

    def test_zones_de_retouche_des_planches(self):
        self.assertEqual(d.zones_for(Path('planche_inconnue.png')), [])
        for nom in ('planche_reference_jaguars.png', 'planche_reference_bisons.png', 'planche_reference_castors.png', 'planche_reference_toucans.png'):
            zones = d.zones_for(Path(nom))
            self.assertTrue(zones)
            for z in zones:
                x0, y0, x1, y1 = z['zone'] if isinstance(z, dict) else z
                self.assertLess(x0, x1)
                self.assertLess(y0, y1)

    def test_retouche_pale_edge_ne_touche_que_le_bord(self):
        rgb = np.zeros((60, 60, 3), np.uint8)
        rgb[:] = (235, 230, 220)  # pelage clair presque gris
        a = np.zeros((60, 60), np.uint8)
        a[10:50, 10:50] = 255      # personnage entouré de vide
        rgba = np.dstack([rgb, a])
        out = d.retouch(rgb, rgba, [{'zone': [0, 0, 60, 60], 'pale': True, 'edge': 3}])
        self.assertEqual(out[10, 30, 3], 0)    # frange retirée
        self.assertEqual(out[30, 30, 3], 255)  # cœur gardé

    def test_retouche_clear_retire_tout_dans_la_zone(self):
        rgb = np.full((40, 40, 3), (200, 110, 30), np.uint8)
        rgba = np.dstack([rgb, np.full((40, 40), 255, np.uint8)])
        out = d.retouch(rgb, rgba, [{'zone': [5, 5, 15, 15], 'clear': True}])
        self.assertTrue((out[5:15, 5:15, 3] == 0).all())
        self.assertEqual(out[20, 20, 3], 255)
        self.assertEqual(out[4, 4, 3], 255)

    def test_zones_des_nouvelles_planches(self):
        for nom in ('planche_reference_ours_bruns.png', 'planche_reference_herissons.png', 'planche_reference_koalas.png'):
            self.assertTrue(d.zones_for(Path(nom)), nom)

    def test_despill_reprend_le_reflet_olive_du_contour_pas_le_coeur(self):
        rgba = np.zeros((80, 80, 4), np.uint8)
        rgba[10:70, 10:70] = (200, 110, 30, 255)   # pelage orange
        rgba[40:44, 10:30] = (110, 100, 20, 255)   # reflet olive sur le contour gauche
        rgba[40:44, 36:40] = (110, 100, 20, 255)   # même teinte au cœur (œil, détail) : à garder
        out = d.despill_spots(rgba)
        self.assertEqual(tuple(out[41, 11, :3]), (200, 110, 30))
        self.assertEqual(tuple(out[41, 37, :3]), (110, 100, 20))
        self.assertTrue((out[..., 3] == rgba[..., 3]).all())

    def test_despill_coeur_reprend_le_creux_olive_mais_pas_pres_d_une_pupille(self):
        rgba = np.zeros((120, 120, 4), np.uint8)
        rgba[5:115, 5:115] = (230, 190, 140, 255)   # pelage crème
        rgba[40:44, 30:34] = (100, 120, 30, 255)    # creux olive au cœur, loin du bord
        rgba[80:90, 80:90] = (10, 8, 8, 255)        # pupille
        rgba[84:86, 91:93] = (100, 120, 30, 255)    # reflet olive collé à la pupille
        out = d.despill_spots(rgba)
        self.assertEqual(tuple(out[41, 31, :3]), (230, 190, 140))
        self.assertEqual(tuple(out[85, 91, :3]), (100, 120, 30))

    def test_noms_attendus_par_le_jeu(self):
        self.assertEqual(d.names_for('tigre')[:3], ['papa_tigre', 'maman_tigre', 'bebe_garcon_stade_1'])
        self.assertEqual(d.names_for('tigre')[-1], 'bebe_fille_stade_4')


if __name__ == '__main__':
    unittest.main()
