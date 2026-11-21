"""Découpe une planche de famille (10 personnages) en images détourées, rangées dans le dossier de l'espèce.

Usage :
    python tools/decoupe_planche.py <planche.png> <dossier> <espece>
    ex. python tools/decoupe_planche.py "Animaux/Asie/Tigres/Fiche familiale de tigres en évolution.png" Animaux/Asie/Tigres/tigre tigre

Planche attendue : Papa et Maman sur la 1re ligne, les 4 stades du garçon sur la 2e, les 4 stades de la
fille sur la 3e (lignes trouvées d'après les pieds). Étiquettes en pastille écartées ; deux animaux qui se
touchent en un point (queue contre une oreille) sont séparés au point de contact.
Fond accepté :
- vert vif uni (#00FF00) : transparence calculée sur la « verdeur », reflet vert retiré des bords ;
- planche déjà transparente (PNG avec canal alpha) : simple séparation des personnages ;
- fond crème ou dégradé doux : fond reconstitué, ombre au sol et trous de fond retirés.
Un fond bruité (photo, décor) est refusé. Restes ponctuels (sol pris entre deux rangées) : zones de
retouche par planche dans tools/retouches_planches.json (voir `retouch`).

Fichiers écrits : papa_<espece>.png, maman_<espece>.png, bebe_garcon_stade_1..4.png, bebe_fille_stade_1..4.png
(les noms attendus par tools/asset_sources.json ; ensuite `npm run assets` les met dans le jeu).
Dépendances : Pillow, numpy, opencv-python.
"""
from __future__ import annotations

import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

BABIES = [f'bebe_garcon_stade_{i}' for i in range(1, 5)] + [f'bebe_fille_stade_{i}' for i in range(1, 5)]
MIN_AREA = 1500
EDGE_SPILL = 5
PAD = 6


def names_for(species: str) -> list[str]:
    return [f'papa_{species}', f'maman_{species}'] + BABIES


def fill_holes(mask: np.ndarray) -> np.ndarray:
    h, w = mask.shape
    ff = mask.copy()
    cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 255)
    return mask | cv2.bitwise_not(ff)


def fill_small_holes(mask: np.ndarray, max_area: int = 40) -> np.ndarray:
    holes = cv2.bitwise_not(mask)
    n, lbl, st, _ = cv2.connectedComponentsWithStats(holes, 4)
    out = mask.copy()
    for i in range(1, n):
        if st[i][4] <= max_area:
            out[lbl == i] = 255
    return out


def is_green_background(rgb: np.ndarray) -> bool:
    border = np.concatenate([rgb[:6].reshape(-1, 3), rgb[-6:].reshape(-1, 3), rgb[:, :6].reshape(-1, 3), rgb[:, -6:].reshape(-1, 3)])
    r, g, b = np.median(border, axis=0)
    return g - max(r, b) > 80


def shadow_holes(f: np.ndarray, a: np.ndarray) -> np.ndarray:
    """Ombre du fond vert entre les pattes (vert sombre, donc peu « vert » en valeur absolue et resté
    opaque) : rendue transparente quand elle est dans le bas du personnage. Un vert sombre plus haut
    (feuille près d'une fleur sur la tête) est gardé."""
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    gr = g - np.maximum(r, b)
    shade = ((gr > 25) & (gr > 0.55 * g) & (a > 0.02)).astype(np.uint8)
    if not shade.any():
        return a
    _, fig, fst, _ = cv2.connectedComponentsWithStats((a > 0.5).astype(np.uint8), 8)
    sn, sl, ss, _ = cv2.connectedComponentsWithStats(shade, 8)
    out = a.copy()
    rim = gr > 8
    for j in range(1, sn):
        if ss[j][4] < 12:
            continue
        ys, xs = np.nonzero(sl == j)
        owner = np.bincount(fig[ys, xs]).argmax()
        if owner == 0:
            continue
        top, h = fst[owner][1], fst[owner][3]
        if ys.mean() < top + 0.55 * h:
            continue
        x, y, w, hh = ss[j][:4]
        y0, y1, x0, x1 = max(0, y - 2), y + hh + 2, max(0, x - 2), x + w + 2
        blob = cv2.dilate((sl[y0:y1, x0:x1] == j).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
        blob &= rim[y0:y1, x0:x1] | (sl[y0:y1, x0:x1] == j)
        out[y0:y1, x0:x1][blob] = 0
    return out


def alpha_from_green(rgb: np.ndarray) -> np.ndarray:
    """Transparence d'après « combien le pixel est plus vert que rouge et bleu » ; au bord, la part du
    fond vert est retirée de la couleur, puis le reflet vert restant est ramené."""
    f = rgb.astype(np.float32)
    border = np.concatenate([f[:6].reshape(-1, 3), f[-6:].reshape(-1, 3)])
    key_rgb = np.median(border, axis=0)
    key = key_rgb[1] - max(key_rgb[0], key_rgb[2])
    green = f[..., 1] - np.maximum(f[..., 0], f[..., 2])
    a = 1 - np.clip((green - 0.12 * key) / (0.55 * key), 0, 1)
    hard = fill_small_holes((a > 0.5).astype(np.uint8) * 255)
    a = np.where(hard > 0, np.maximum(a, cv2.erode(hard, np.ones((5, 5), np.uint8)) / 255.0), a)
    a = shadow_holes(f, a)
    a = a ** 1.4  # bord resserré d'un demi-pixel
    af = np.clip(a, 0.15, 1)[..., None]
    unmixed = np.clip((f - (1 - af) * key_rgb) / af, 0, 255)
    f = np.where((a < 0.98)[..., None], unmixed, f)
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    # reflet vert : fort sur le bord et jusqu'à EDGE_SPILL pixels à l'intérieur (lumière du fond renvoyée
    # sur la fourrure), léger au cœur du personnage pour ne pas ternir ses vraies couleurs
    k = 2 * EDGE_SPILL + 1
    near_edge = cv2.dilate((a < 0.5).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))) > 0
    strong = (a < 0.98) | near_edge
    g = np.where(strong, np.minimum(g, (r + b) / 2 + 0.35 * np.abs(r - b)), np.minimum(g, np.maximum(r, b) + 4))
    out = np.dstack([r, g, b, a * 255])
    out[a < 0.02] = 0
    return np.clip(out, 0, 255).astype(np.uint8)


SPILL_JUMP = 12  # de combien (en degrés de teinte) le point est plus vert que le pelage voisin
SPILL_EDGE = 7  # distance maximale au vide (px) d'un reflet du fond
SPILL_INNER_JUMP = 25  # idem au cœur du personnage, plus exigeant
SPILL_MAX_LEAF = 150  # amas vert plus grand : une feuille
SPILL_INNER_MAX = 60  # amas maximal au cœur du personnage
SPILL_MAX = 400  # au-delà, c'est une vraie feuille ou un vrai détail vert, pas un reflet du fond


def despill_spots(rgba: np.ndarray) -> np.ndarray:
    """Petits points olive ou jaune-vert laissés par le fond vert (creux entre une patte et la jambe, frange
    jaunâtre sur une queue blanche) : leur couleur est remplacée par la moyenne du pelage voisin. Les amas
    de plus de SPILL_MAX pixels (feuille d'hibiscus) et ceux collés à une fleur rose ne sont pas touchés."""
    out = rgba.copy()
    r, g, b, a = (out[..., i].astype(np.int32) for i in range(4))
    # teinte jaune-olive ou verte, saturée, et plus verte que le pelage tout autour : le crème ou le jaune
    # naturels (peu saturés, ou aussi jaunes que leur voisinage) ne sont pas touchés
    hsv = cv2.cvtColor(np.ascontiguousarray(out[..., :3]), cv2.COLOR_RGB2HSV).astype(np.float32)
    hue, sat = hsv[..., 0] * 2.0, hsv[..., 1] / 255.0
    opaque = (a > 200).astype(np.float32)
    w = np.maximum(cv2.boxFilter(opaque, -1, (15, 15), normalize=False), 1)
    local = cv2.boxFilter(hue * opaque, -1, (15, 15), normalize=False) / w
    # seulement près du vide : le reflet du fond est sur le contour, jamais au cœur (yeux, cils, feuilles)
    dist = cv2.distanceTransform((a > 30).astype(np.uint8), cv2.DIST_L2, 3)
    base = (a > 20) & (hue >= 46) & (hue <= 130) & (sat > 0.5) & (hue - local >= SPILL_JUMP)
    # au cœur (creux entre une patte et le corps, vu à travers le fond vert) : seulement un vert-olive net,
    # bien plus vert que le pelage tout autour, et en petit amas
    inner = (a > 20) & (dist > SPILL_EDGE) & (hue >= 56) & (hue <= 110) & (sat > 0.6) & (hue - local >= SPILL_INNER_JUMP)
    # un œil (pupille presque noire tout près) a des reflets olive naturels : jamais touché
    dark = cv2.dilate(((hsv[..., 2] < 50) & (a > 200)).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    # une vraie feuille (grand amas vert) n'est jamais touchée, ni ses bords ni ses pointes
    green = ((hue >= 56) & (hue <= 130) & (sat > 0.4) & (a > 200)).astype(np.uint8)
    gn, glab, gst, _ = cv2.connectedComponentsWithStats(green, connectivity=8)
    leaf = np.isin(glab, [i for i in range(1, gn) if gst[i][4] > SPILL_MAX_LEAF])
    leaf = cv2.dilate(leaf.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    spill = ((base & (dist <= SPILL_EDGE)) | (inner & ~dark)) & ~leaf
    n, lab, st, _ = cv2.connectedComponentsWithStats(spill.astype(np.uint8), connectivity=8)
    pink = cv2.dilate(((r > 190) & (g < 130) & (b > 90) & (a > 200)).astype(np.uint8), np.ones((31, 31), np.uint8)) > 0
    keep = np.zeros(n, bool)
    for i in range(1, n):
        sel = lab == i
        small = st[i][4] <= (SPILL_MAX if (dist[sel] <= SPILL_EDGE).any() else SPILL_INNER_MAX)
        if small and not pink[sel].any():
            keep[i] = True
    fix = keep[lab] & spill
    if not fix.any():
        return out
    fix = cv2.dilate(fix.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    good = ((a > 200) & ~fix).astype(np.float32)
    k = (9, 9)
    w = cv2.boxFilter(good, -1, k, normalize=False)
    for c in range(3):
        ch = out[..., c].astype(np.float32) * good
        mean = cv2.boxFilter(ch, -1, k, normalize=False) / np.maximum(w, 1)
        sel = fix & (w > 3) & (a > 20)
        out[..., c][sel] = np.clip(mean[sel], 0, 255).astype(np.uint8)
    return out


FRINGE_EDGE = 3  # largeur (px) du contour examiné
FRINGE_DV = 55   # de combien le point est plus clair que le pelage voisin (0-255)
FRINGE_DS = 55   # de combien il est moins saturé


def pale_fringe(rgba: np.ndarray) -> np.ndarray:
    """Éclats clairs presque blancs (reste du fond crème) posés sur le contour d'un pelage plus foncé et plus
    coloré : retirés. Un pelage naturellement clair (ours polaire, phoque, ventre crème) n'est pas touché,
    car la comparaison se fait avec la couleur du pelage voisin, ni les moustaches (rien de plein autour)."""
    out = rgba.copy()
    a = out[..., 3]
    solid = (a > 128).astype(np.uint8)
    dist = cv2.distanceTransform(solid, cv2.DIST_L2, 3)
    hsv = cv2.cvtColor(np.ascontiguousarray(out[..., :3]), cv2.COLOR_RGB2HSV).astype(np.float32)
    sat, val = hsv[..., 1], hsv[..., 2]
    inner = ((dist >= 6) & (dist <= 14)).astype(np.float32)
    w = cv2.boxFilter(inner, -1, (25, 25), normalize=False)
    mv = cv2.boxFilter(val * inner, -1, (25, 25), normalize=False) / np.maximum(w, 1)
    ms = cv2.boxFilter(sat * inner, -1, (25, 25), normalize=False) / np.maximum(w, 1)
    odd = (a > 20) & (dist <= FRINGE_EDGE) & (w > 40) & (val - mv > FRINGE_DV) & (ms - sat > FRINGE_DS) & (val > 190)
    odd = cv2.dilate(odd.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    odd &= (a > 20) & (dist <= FRINGE_EDGE + 1) & (val - mv > 25) & (ms - sat > 25)
    out[odd] = 0
    return out


SOFT_EDGE = 4


def clean_transparent(rgba: np.ndarray) -> np.ndarray:
    """Planche déjà transparente : opaque vraiment opaque ; ombre au sol et lueur (semi-transparentes,
    larges) retirées au-delà de SOFT_EDGE pixels du corps ; le bord doux de la fourrure est gardé."""
    out = rgba.copy()
    a = out[..., 3].astype(np.int32)
    body = fill_small_holes((a >= 230).astype(np.uint8) * 255, 200)
    body = cv2.morphologyEx(body, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    near = cv2.dilate(body, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * SOFT_EDGE + 1, 2 * SOFT_EDGE + 1)))
    a = np.where(near > 0, a, 0)
    out[..., 3] = np.where(a >= 248, 255, np.where(a < 10, 0, a))
    out[out[..., 3] == 0] = 0
    return out


# --- fond doux : dégradé en vignette (mauve → blanc rosé) ou crème uni, avec ombres au sol -------------
SEED_DIFF = 60       # graine du remplissage écartée si elle s'éloigne autant de la couleur médiane du bord
FLOOD_TOL = 2.5      # écart toléré d'un pixel à son voisin pour rester « fond » (le dégradé est lent)
SHADOW_TOL = 6       # idem dans l'ombre au sol, plus marquée mais toujours lisse
SHADOW_BAND = 45     # hauteur (px) du bas de chaque personnage où une ombre au sol est cherchée
SHADOW_MIN = 0.45    # une ombre garde au moins 45 % de la luminosité du fond (un sabot noir, non)
MODEL_DIFF = 8       # tache de cette couleur à 8 près du fond reconstitué : c'est du fond
MODEL_DEPTH = 45     # ... si elle est à moins de 45 px du fond visible, ou lisse
CHROMA_DIFF = 5      # tache enfermée lisse de la teinte du fond (écart hors luminosité) : du fond éclairci
LIGHT_SHIFT = 30     # ... jusqu'à 30 niveaux plus clair que le fond reconstitué
HOLE_CHROMA = 8      # au-delà, une tache lisse claire n'est pas un trou de fond (dent, joue, creux d'oreille)
HOLE_DIFF = 12       # trou enfermé (entre les pattes) presque de la couleur du fond voisin : c'est du fond
EDGE_BAND = 4        # largeur (px) du bord doux calculé contre le fond
GLOW_BAND = 10       # largeur (px) où une lueur de contre-jour aussi claire que le fond est retirée


def flood_from_border(b: np.ndarray, tol: float, block: np.ndarray | None = None) -> np.ndarray:
    """Fond relié au bord de la planche, de proche en proche (un dégradé passe, un contour arrête)."""
    h, w, _ = b.shape
    mask = np.zeros((h + 2, w + 2), np.uint8)
    if block is not None:
        mask[1:-1, 1:-1][block] = 1
    flags = 4 | (255 << 8) | cv2.FLOODFILL_MASK_ONLY
    seeds = [(x, y) for x in range(0, w, 8) for y in (0, h - 1)] + [(x, y) for y in range(0, h, 8) for x in (0, w - 1)]
    # une oreille qui touche le bord de la planche n'est pas une graine de fond
    ref = np.median(np.array([b[y, x] for x, y in seeds], np.float32), axis=0)
    for x, y in seeds:
        if np.abs(b[y, x].astype(np.float32) - ref).max() > SEED_DIFF:
            continue
        if not mask[y + 1, x + 1]:
            cv2.floodFill(b, mask, (x, y), 0, (tol,) * 3, (tol,) * 3, flags)
    return mask[1:-1, 1:-1] == 255


def background_model(rgb: np.ndarray, bg: np.ndarray) -> np.ndarray:
    """Couleur du fond partout, même sous les personnages (prolongée depuis le fond visible)."""
    h, w, _ = rgb.shape
    s = 4
    sw, sh = max(1, w // s), max(1, h // s)
    small = cv2.resize(rgb, (sw, sh), interpolation=cv2.INTER_AREA)
    known = cv2.erode(bg.astype(np.uint8), np.ones((5, 5), np.uint8))
    ks = cv2.resize(known, (sw, sh), interpolation=cv2.INTER_NEAREST)
    fill = cv2.inpaint(small, (1 - ks).astype(np.uint8), 9, cv2.INPAINT_TELEA)
    fill = cv2.GaussianBlur(fill, (0, 0), 2)
    return cv2.resize(fill, (w, h), interpolation=cv2.INTER_CUBIC).astype(np.float32)


def is_soft_background(rgb: np.ndarray) -> bool:
    """Bord de planche clair ou moyen et lisse (dégradé ou uni), pas une photo ni un décor."""
    b = cv2.GaussianBlur(rgb, (0, 0), 1.2).astype(np.float32)
    border = np.concatenate([b[:6].reshape(-1, 3), b[-6:].reshape(-1, 3), b[:, :6].reshape(-1, 3), b[:, -6:].reshape(-1, 3)])
    steps = np.concatenate([np.abs(np.diff(e, axis=1)).max(2).ravel()
                            for e in (b[:6], b[-6:], b[:, :6].transpose(1, 0, 2), b[:, -6:].transpose(1, 0, 2))])
    # 95e centile : une oreille ou une queue peut toucher le bord sans faire refuser la planche
    return float(border.mean()) > 60 and float(np.percentile(steps, 95)) <= FLOOD_TOL * 2


def below_to_background(bg: np.ndarray) -> np.ndarray:
    """Distance (px) de chaque pixel au fond situé juste en dessous, dans sa colonne : le bas de chaque
    personnage, même quand deux personnages superposés se touchent."""
    h, _ = bg.shape
    out = np.zeros(bg.shape, np.int32)
    run = np.full(bg.shape[1], h, np.int32)  # pas de fond en dessous : très loin
    for y in range(h - 1, -1, -1):
        run = np.where(bg[y], 0, run + 1)
        out[y] = run
    return out


def ground_shadows(rgb: np.ndarray, b: np.ndarray, bg: np.ndarray, model: np.ndarray) -> np.ndarray:
    """Ombre au sol sous chaque personnage : candidates = bas du personnage, plus sombre que le fond mais
    pas noir, atteint depuis le fond par un chemin lisse ; GrabCut tranche ensuite entre ombre et patte
    d'après les couleurs (une patte grise et une ombre chaude ne se confondent pas)."""
    lum = cv2.cvtColor(b, cv2.COLOR_RGB2GRAY).astype(np.float32)
    ml = model.mean(2)
    n, lab, st, _ = cv2.connectedComponentsWithStats((~bg).astype(np.uint8), connectivity=8)
    dim = ~bg & (lum < ml - 3) & (lum > SHADOW_MIN * ml)
    band = ~bg & (below_to_background(bg) <= SHADOW_BAND)
    allowed = band & dim
    likely = flood_from_border(b, SHADOW_TOL, ~(allowed | bg)) & ~bg
    out = np.zeros(bg.shape, bool)
    H, W = bg.shape
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if a < MIN_AREA:
            continue
        m = 30
        x0, y0, x1, y1 = max(0, x - m), max(0, y - m), min(W, x + w + m), min(H, y + h + m)
        fig = lab[y0:y1, x0:x1] == i
        sh = likely[y0:y1, x0:x1] & fig
        if sh.sum() < 20:
            continue
        low = band[y0:y1, x0:x1]
        gm = np.full(fig.shape, cv2.GC_PR_FGD, np.uint8)
        gm[~fig] = cv2.GC_BGD
        gm[sh] = cv2.GC_PR_BGD
        core = cv2.erode(fig.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
        gm[core & ~low] = cv2.GC_FGD
        bgm, fgm = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
        cv2.grabCut(np.ascontiguousarray(rgb[y0:y1, x0:x1]), gm, None, bgm, fgm, 6, cv2.GC_INIT_WITH_MASK)
        gone = ((gm == cv2.GC_BGD) | (gm == cv2.GC_PR_BGD)) & fig & low
        out[y0:y1, x0:x1] |= gone
    return out


def nearest_color(f: np.ndarray, where: np.ndarray) -> np.ndarray:
    """Pour chaque pixel, la couleur du pixel de `where` le plus proche."""
    _, labels = cv2.distanceTransformWithLabels((~where).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    ys, xs = np.nonzero(where)
    lut = np.zeros((labels.max() + 1, 3), np.float32)
    lut[labels[ys, xs]] = f[ys, xs]
    return lut[labels]


def share_of(f: np.ndarray, fg: np.ndarray, model: np.ndarray) -> np.ndarray:
    """Part du personnage dans un pixel mêlé : projection de (pixel − fond) sur (personnage − fond)."""
    num = np.einsum('ijk,ijk->ij', f - model, fg - model)
    den = np.einsum('ijk,ijk->ij', fg - model, fg - model) + 1e-3
    return np.clip(num / den, 0, 1)


def alpha_from_soft_background(rgb: np.ndarray) -> np.ndarray:
    """Planche sur fond doux (dégradé ou crème) : fond relié au bord, trous de fond entre les pattes,
    ombres au sol retirés ; bord doux de la fourrure calculé contre la couleur locale du fond, couleur du
    bord reprise de l'intérieur (pas de liseré clair)."""
    f = rgb.astype(np.float32)
    b = cv2.GaussianBlur(rgb, (0, 0), 1.2)
    bg = flood_from_border(b, FLOOD_TOL)
    model = background_model(rgb, bg)
    # fond enfermé presque exact (même non lisse : coincé entre un sabot et une tête), par taches assez
    # grandes ; ajouté avant les ombres, pour que l'ombre posée dessus soit vue comme une ombre au sol
    bf = cv2.GaussianBlur(rgb, (0, 0), 1.2).astype(np.float32)
    near_model = np.linalg.norm(bf - model, axis=2) < MODEL_DIFF
    n, lab, st, _ = cv2.connectedComponentsWithStats((near_model & ~bg).astype(np.uint8), connectivity=8)
    # loin du fond visible (au cœur d'une tête), seule une tache lisse est du fond : un museau blanc
    # moustachu de la couleur du fond reste au personnage
    depth = cv2.distanceTransform((~bg).astype(np.uint8), cv2.DIST_L2, 5)
    lum = bf.mean(2)
    mu = cv2.blur(lum, (7, 7))
    sd = np.sqrt(np.maximum(cv2.blur(lum * lum, (7, 7)) - mu * mu, 0))
    big = np.zeros(n, bool)
    for i in range(1, n):
        if st[i, 4] >= 60:
            part = lab == i
            big[i] = depth[part].min() <= MODEL_DEPTH or np.median(sd[part]) < 4
    bg |= big[lab]
    bg |= ground_shadows(rgb, b, bg, model)
    model0 = model
    # trous enfermés presque de la couleur du fond (entre les pattes, sous le ventre) ; un ventre crème
    # ou une gorge claire s'écartent davantage du fond et restent
    fb = cv2.GaussianBlur(f, (0, 0), 1.2)
    near = np.linalg.norm(fb - cv2.GaussianBlur(nearest_color(f, bg), (0, 0), 6), axis=2) < HOLE_DIFF
    lum = fb.mean(2)
    mu = cv2.blur(lum, (7, 7))
    sdev = np.sqrt(np.maximum(cv2.blur(lum * lum, (7, 7)) - mu * mu, 0))
    smooth = sdev < 4  # fond lisse, pas de fourrure
    # teinte comparée au fond reconstitué, luminosité mise à part : une dent, une joue ou un creux
    # d'oreille clairs s'en écartent nettement (≥ 10), un vrai trou de fond non (≤ 5)
    diff = fb - model0
    shift = diff.mean(2)
    chroma = np.linalg.norm(diff - shift[..., None], axis=2)
    n, lab, st, _ = cv2.connectedComponentsWithStats((smooth & ~bg).astype(np.uint8), connectivity=4)
    for i in range(1, n):
        if st[i, 4] < 40:
            continue
        part = lab == i
        if np.median(chroma[part]) >= HOLE_CHROMA:
            continue
        if near[part].mean() > 0.8:
            bg |= part & near
        elif st[i, 4] >= 300:
            # fond enfermé éclairci (dans la boucle d'une queue, sous un ventre) : même teinte que le fond,
            # seulement plus clair, et parfaitement lisse
            if (np.median(chroma[part]) < CHROMA_DIFF and -10 < np.median(shift[part]) < LIGHT_SHIFT
                    and np.median(sdev[part]) < 1.5):
                bg |= part
    body = fill_small_holes((~bg).astype(np.uint8) * 255, 30) > 0
    body = cv2.morphologyEx(body.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
    # couleur locale du fond au ras du bord (trous entre les pattes et ombres compris) : celle du pixel de
    # fond franc le plus proche ; même principe pour la couleur intérieure du personnage
    sure_bg = cv2.distanceTransform((~body).astype(np.uint8), cv2.DIST_L2, 5) > 2
    model = cv2.GaussianBlur(nearest_color(f, sure_bg), (0, 0), 1.5)
    # bord doux : part du personnage = distance au fond / distance de la couleur intérieure au fond
    dist = cv2.distanceTransform(body.astype(np.uint8), cv2.DIST_L2, 5)
    inner = dist > EDGE_BAND
    fg = nearest_color(f, inner)
    a = share_of(f, fg, model)
    edge = body & ~inner
    alpha = np.where(inner, 1.0, np.where(edge, a, 0.0))
    # lueur de contre-jour (poils clairs mêlés au fond clair, plus large que le bord doux) : jusqu'à
    # GLOW_BAND px du fond, un pixel aussi clair que le fond n'en garde que la part du personnage
    lum, mlum = f.mean(2), model.mean(2)
    glow = inner & (dist <= GLOW_BAND) & (lum >= mlum - 8)
    if glow.any():
        deep = nearest_color(f, dist > GLOW_BAND)
        alpha = np.where(glow, np.minimum(alpha, share_of(f, deep, model)), alpha)
        inner = inner & ~glow
        fg = np.where(glow[..., None], deep, fg)
    alpha = np.where(alpha > 0.96, 1.0, np.where(alpha < 0.06, 0.0, alpha))
    # poussières détachées (reflets du fond isolés) retirées
    n, lab, st, _ = cv2.connectedComponentsWithStats((alpha > 0).astype(np.uint8), connectivity=8)
    for i in range(1, n):
        if st[i, 4] < 30:
            alpha[lab == i] = 0
    af = np.clip(alpha, 0.35, 1)[..., None]
    unmixed = np.clip(model + (f - model) / af, 0, 255)
    col = np.where(inner[..., None], f, np.where((alpha >= 0.5)[..., None], unmixed, fg))
    out = np.dstack([col, alpha * 255])
    out[alpha <= 0] = 0
    return np.clip(out + 0.5, 0, 255).astype(np.uint8)


def to_rgba(img: Image.Image) -> np.ndarray:
    if img.mode in ('RGBA', 'LA', 'P') and np.array(img.convert('RGBA'))[..., 3].min() < 10:
        return clean_transparent(np.array(img.convert('RGBA')))
    rgb = np.array(img.convert('RGB'))
    if is_green_background(rgb):
        return alpha_from_green(rgb)
    if is_soft_background(rgb):
        return alpha_from_soft_background(rgb)
    raise ValueError('fond ni vert vif, ni transparent, ni uni/dégradé lisse : refaire la planche sur fond vert uni (#00FF00)')


def is_label(w: int, h: int, area: int) -> bool:
    """Étiquette : rectangle arrondi plein, large et bas."""
    return w > 2.5 * h and area / float(w * h) > 0.8


def rows_of(items: list[tuple[int, float, float, int, int]]) -> list[list[int]]:
    """Regroupe les personnages en lignes : deux personnages sont sur la même ligne si leurs bas
    sont proches (ils ont les pieds sur la même ligne de sol)."""
    rows: list[list[tuple[int, float, float, int, int]]] = []
    for it in sorted(items, key=lambda t: t[4]):
        if rows and abs(it[4] - np.median([r[4] for r in rows[-1]])) < 0.25 * max(r[3] for r in rows[-1]):
            rows[-1].append(it)
        else:
            rows.append([it])
    return [[t[0] for t in sorted(r, key=lambda t: t[1])] for r in rows]


MIN_CORE = 6000
MAX_ERODE = 70  # érosion maximale (px) : deux oursons qui se touchent largement finissent par se séparer


SEAM_DEPTH = 80  # px sous le haut du noyau du dessous où la coupe peut passer


def stacked_seam(top: np.ndarray, bottom: np.ndarray, sub: np.ndarray, rgb: np.ndarray) -> np.ndarray | None:
    """Deux animaux l'un au-dessus de l'autre (sabots posés sur la tête de celui du dessous) : la coupe
    suit, de gauche à droite, le chemin le moins coûteux entre les deux, par le fond, l'ombre ou la lueur
    claire plutôt qu'à travers un sabot sombre, un nœud vif ou de la fourrure. Renvoie 1 au-dessus, 2 au-dessous."""
    # noyaux encore amincis : un sabot rattaché à l'autre animal par une lueur opaque n'en fait plus partie
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41))
    top, bottom = [(cv2.erode(c.astype(np.uint8), k) > 0) if (cv2.erode(c.astype(np.uint8), k) > 0).any() else c
                   for c in (top, bottom)]
    ys_t, ys_b = np.nonzero(top)[0], np.nonzero(bottom)[0]
    if not len(ys_t) or not len(ys_b):
        return None
    if ys_t.mean() > ys_b.mean():
        top, bottom, ys_t, ys_b = bottom, top, ys_b, ys_t
        swap = True
    else:
        swap = False
    # la coupe peut descendre sous le haut du noyau du dessous (une corne, un nœud y pointent), sans
    # jamais traverser un noyau
    y0, y1 = int(ys_t.max()), min(int(ys_b.min()) + SEAM_DEPTH, sub.shape[0] - 1)
    if int(ys_b.min()) - y0 < 6:
        return None
    f = rgb[y0:y1 + 1].astype(np.float32)
    sat = f.max(2) - f.min(2)
    lum = f.mean(2)
    cost = np.where(sub[y0:y1 + 1] > 0, 1.5 * sat + (255 - lum) + 1, 0.0)
    cost[(top | bottom)[y0:y1 + 1]] = 1e6
    h, w = cost.shape
    acc = cost.copy()
    back = np.zeros((h, w), np.int8)
    big = 1e12
    for x in range(1, w):
        prev = acc[:, x - 1]
        up = np.r_[big, prev[:-1]]
        down = np.r_[prev[1:], big]
        stack = np.stack([up, prev, down])
        k = stack.argmin(0)
        acc[:, x] += stack[k, np.arange(h)] + (k != 1) * 2.0
        back[:, x] = k.astype(np.int8) - 1
    path = np.zeros(w, np.int32)
    path[-1] = int(acc[:, -1].argmin())
    for x in range(w - 1, 0, -1):
        path[x - 1] = path[x] + back[path[x], x]
    rows = np.arange(sub.shape[0])[:, None]
    above = rows <= (path + y0)[None, :]
    ws = np.where(above, 1, 2)
    # la coupe ne doit pas laisser à un animal un morceau détaché de lui et collé à l'autre
    # (une oreille qui dépasse du côté du voisin) : ce morceau retourne à l'animal qu'il touche
    for _ in range(2):
        for side in (1, 2):
            part = ((ws == side) & (sub > 0)).astype(np.uint8)
            nc, lc, sc, _ = cv2.connectedComponentsWithStats(part, 8)
            if nc <= 2:
                continue
            main = 1 + int(np.argmax(sc[1:, 4]))
            other = (cv2.dilate(((ws == 3 - side) & (sub > 0)).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0)
            for j in range(1, nc):
                if j != main and (other & (lc == j)).any():
                    ws[lc == j] = 3 - side
    return 3 - ws if swap else ws


def separate_touching(mask: np.ndarray, needed: int, rgb: np.ndarray | None = None) -> np.ndarray:
    """Deux animaux qui se touchent en un point (nœud contre un pied, queue contre une oreille) :
    on érode la tache jusqu'à ce qu'elle se coupe en deux gros noyaux, puis chaque pixel revient au
    noyau le plus proche — la coupe passe par le point de contact. On sépare d'abord les taches qui se coupent le plus facilement."""
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    found = []
    for i in range(1, n):
        if stats[i][4] < 2 * MIN_CORE:
            continue
        x, y, w, h, _ = stats[i]
        sub = (labels[y:y + h, x:x + w] == i).astype(np.uint8)
        for r in range(1, MAX_ERODE):
            e = cv2.erode(sub, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1)))
            cn, cl, cs, _ = cv2.connectedComponentsWithStats(e, 8)
            cores = sorted((j for j in range(1, cn) if cs[j][4] >= MIN_CORE), key=lambda j: -cs[j][4])
            if len(cores) >= 2:
                found.append((r, i, (x, y, w, h), sub, cl, cores[:2]))
                break
    out = labels.astype(np.int32)
    nxt = n
    for r, i, (x, y, w, h), sub, cl, cores in sorted(found, key=lambda f: f[0])[:needed]:
        # partage des eaux : les deux noyaux montent ensemble, des parties épaisses vers les plus minces ;
        # ils se rejoignent au point le plus mince, le contact (corne contre sabot), et chaque patte reste
        # à son animal même quand l'autre (corne, nœud) est plus près à vol d'oiseau
        own = [(cl == cores[0]).astype(np.uint8), (cl == cores[1]).astype(np.uint8)]
        free = sub.copy()
        free[(own[0] | own[1]) > 0] = 0
        thick = cv2.distanceTransform(sub, cv2.DIST_L2, 5)
        k3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        for level in range(int(thick.max()), -1, -1):
            room = free & (thick >= level).astype(np.uint8)
            while room.any():
                moved = False
                for o in own:
                    new = cv2.dilate(o, k3) & room
                    if new.any():
                        o |= new
                        room &= 1 - new
                        free &= 1 - new
                        moved = True
                if not moved:
                    break
        d1 = cv2.distanceTransform(1 - own[0], cv2.DIST_L2, 5)
        d2 = cv2.distanceTransform(1 - own[1], cv2.DIST_L2, 5)
        ws = np.where(d2 < d1, 2, 1)
        if rgb is not None:
            cut = stacked_seam(cl == cores[0], cl == cores[1], sub, rgb[y:y + h, x:x + w])
            if cut is not None:
                ws = cut
        region = out[y:y + h, x:x + w]
        region[(sub > 0) & (ws == 2)] = nxt
        nxt += 1
    return out


def split(rgba: np.ndarray) -> list[np.ndarray]:
    """Les 10 personnages, dans l'ordre papa, maman, garçon 1→4, fille 1→4 (lecture ligne par ligne)."""
    mask = (rgba[..., 3] > 40).astype(np.uint8)
    n, labels, stats, cent = cv2.connectedComponentsWithStats(mask, 8)
    count = sum(1 for i in range(1, n) if stats[i][4] >= MIN_AREA and not is_label(stats[i][2], stats[i][3], stats[i][4]))
    if count < 10:
        sep = separate_touching(mask, 10 - count, rgba[..., :3])
        # trois animaux en chaîne (corne contre sabot, puis nœud contre sabot) : on recoupe tant qu'il en manque
        for _ in range(3):
            got = sum(1 for v in np.unique(sep) if v > 0 and (sep == v).sum() >= MIN_AREA)
            if got >= 10:
                break
            k3 = np.ones((3, 3), np.uint8)
            # couture = pixels voisins de deux animaux différents (le fond, 0, ne compte pas)
            lo = cv2.erode(np.where(sep > 0, sep, 1 << 20).astype(np.float32), k3)
            cut = (cv2.dilate(sep.astype(np.float32), k3) != lo) & (sep > 0)
            again = separate_touching((mask & ~cut).astype(np.uint8), 10 - got, rgba[..., :3])
            if len(np.unique(again)) <= len(np.unique(sep)):
                break
            sep = np.where(cut, 0, again)
        ids = [v for v in np.unique(sep) if v > 0]
        labels = np.zeros_like(sep)
        stats_l, cent_l = [[0, 0, 0, 0, 0]], [[0.0, 0.0]]
        for k, v in enumerate(ids, start=1):
            m = sep == v
            labels[m] = k
            ys, xs = np.nonzero(m)
            stats_l.append([xs.min(), ys.min(), xs.max() - xs.min() + 1, ys.max() - ys.min() + 1, len(xs)])
            cent_l.append([xs.mean(), ys.mean()])
        n, stats, cent = len(ids) + 1, np.array(stats_l), np.array(cent_l)
    cand = [i for i in range(1, n) if stats[i][4] >= MIN_AREA and not is_label(stats[i][2], stats[i][3], stats[i][4])]
    big = sorted(cand, key=lambda i: -stats[i][4])
    if len(big) < 10:
        raise ValueError(f'{len(big)} personnages trouvés au lieu de 10 (animaux qui se touchent ?)')
    big = big[:10]
    rows = rows_of([(i, float(cent[i][0]), float(cent[i][1]), int(stats[i][3]), int(stats[i][1] + stats[i][3])) for i in big])
    order = [i for r in rows for i in r]
    crops = []
    for i in order:
        x, y, w, h, _ = stats[i]
        x0, y0 = max(0, x - PAD), max(0, y - PAD)
        x1, y1 = min(rgba.shape[1], x + w + PAD), min(rgba.shape[0], y + h + PAD)
        # ce personnage et son bord doux, rien des voisins
        own = (cv2.dilate((labels == i).astype(np.uint8), np.ones((7, 7), np.uint8)) > 0) & ((labels == i) | (labels == 0))
        crop = rgba[y0:y1, x0:x1].copy()
        crop[~own[y0:y1, x0:x1]] = 0
        # miettes de quelques pixels laissées le long d'une coupe ou d'une ombre retirée
        nc, lc, sc, _ = cv2.connectedComponentsWithStats((crop[..., 3] > 0).astype(np.uint8), connectivity=8)
        crumbs = np.zeros(nc, bool)
        crumbs[1:] = sc[1:, 4] < 30
        crop[crumbs[lc]] = 0
        crops.append(crop)
    return crops


RETOUCHES = Path(__file__).with_name('retouches_planches.json')
RETOUCH_MARGIN = 40  # px autour d'une zone où GrabCut apprend les couleurs du fond et du personnage
PALE_SAT = 0.25      # zone « pale » : pixel peu coloré (saturation < 25 %) ...
PALE_VAL = 0.4       # ... et pas sombre (valeur > 40 %) : sol ou ombre douce, pas une touffe orange ni un sabot


def retouch(rgb: np.ndarray, rgba: np.ndarray, zones: list) -> np.ndarray:
    """Zones désignées à la main sur la planche (sol pris entre deux rangées, fond vu entre les pattes),
    hors desquelles rien ne change. Zone [x0, y0, x1, y1] : GrabCut y départage fond et personnage d'après
    les couleurs apprises autour. Zone {"zone": [...], "pale": true} : seuls les pixels pâles et presque
    gris y sont retirés (sol clair collé à une corne ou une oreille claire, que GrabCut garderait) ;
    avec "edge": n, seulement à moins de n px du vide (frange blanche d'un pelage sombre)
    Zone {"zone": [...], "clear": true} : tout y est retiré (voisin collé sous une patte)."""
    out = rgba.copy()
    H, W = rgba.shape[:2]
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.float32) / 255.0
    for z in zones:
        pale = isinstance(z, dict) and z.get('pale', False)
        x0, y0, x1, y1 = z['zone'] if isinstance(z, dict) else z
        if isinstance(z, dict) and z.get('clear', False):  # voisin ou sol collé sous une patte : tout est retiré
            out[y0:y1, x0:x1] = 0
            continue
        if pale:
            s = np.s_[y0:y1, x0:x1]
            gone = (out[s][..., 3] > 0) & (hsv[s][..., 1] < PALE_SAT) & (hsv[s][..., 2] > PALE_VAL)
            edge = z.get('edge') if isinstance(z, dict) else None
            if edge:  # seulement le bord : à moins de `edge` px du vide, le ventre ou la dent clairs au cœur restent
                dist = cv2.distanceTransform((out[..., 3] > 0).astype(np.uint8), cv2.DIST_L2, 3)
                gone &= dist[s] <= edge
            out[s][gone] = 0
            continue
        m = RETOUCH_MARGIN
        X0, Y0, X1, Y1 = max(0, x0 - m), max(0, y0 - m), min(W, x1 + m), min(H, y1 + m)
        a = out[Y0:Y1, X0:X1, 3] > 0
        inz = np.zeros(a.shape, bool)
        inz[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] = True
        if not (a & inz).any() or a.all() or not a.any():
            continue
        gm = np.where(a, cv2.GC_FGD, cv2.GC_BGD).astype(np.uint8)
        gm[a & inz] = cv2.GC_PR_FGD
        bgm, fgm = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
        cv2.grabCut(np.ascontiguousarray(rgb[Y0:Y1, X0:X1]), gm, None, bgm, fgm, 5, cv2.GC_INIT_WITH_MASK)
        gone = inz & a & ((gm == cv2.GC_BGD) | (gm == cv2.GC_PR_BGD))
        out[Y0:Y1, X0:X1][gone] = 0
    return out


def zones_for(src: Path) -> list:
    """Zones de retouche de cette planche (par nom de fichier) dans tools/retouches_planches.json."""
    if not RETOUCHES.exists():
        return []
    import json
    return json.loads(RETOUCHES.read_text(encoding='utf-8')).get(src.name, [])


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(__doc__)
        return 2
    src, out, species = Path(argv[0]), Path(argv[1]), argv[2]
    try:
        img = Image.open(src)
        rgba = to_rgba(img)
        zones = zones_for(src)
        if zones:
            rgba = retouch(np.array(img.convert('RGB')), rgba, zones)
            print(f'{len(zones)} zone(s) retouchée(s) d\'après {RETOUCHES.name}')
        crops = split(rgba)
    except ValueError as e:
        print(f'[refusé] {src.name} : {e}')
        return 1
    out.mkdir(parents=True, exist_ok=True)
    for name, crop in zip(names_for(species), crops):
        Image.fromarray(crop).save(out / f'{name}.png', optimize=True)
        print(f'{out / name}.png  {crop.shape[1]}x{crop.shape[0]}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
