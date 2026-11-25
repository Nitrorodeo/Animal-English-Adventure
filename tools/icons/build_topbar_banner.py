"""
Bandeau de la barre du haut (dessin fourni par le parent le 2026-11-25, Animaux/Logo barre haut/bandeau.webp).

Le bandeau doit remplir toutes les largeurs d'écran sans déformer les feuilles et les nuages. On le coupe en :
- deux bouts (feuilles + nuages), affichés à leurs proportions, le bord intérieur fondu en transparence ;
- un milieu (soleil, courbes, étincelles), étiré pour remplir l'espace entre les deux bouts ;
- deux bouts sans feuilles (le bord arrondi seul) pour les écrans étroits, où les boutons ont besoin de toute la place.
Le blanc autour des bouts arrondis devient transparent.

Lancer : python tools/icons/build_topbar_banner.py
"""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "Animaux" / "Logo barre haut" / "bandeau.webp"
OUT = ROOT / "public" / "assets" / "ui"

TOP, BOTTOM = 273, 372  # bord du bandeau dans le dessin (l'ombre portée en dessous est refaite en CSS)
H = BOTTOM - TOP  # 99 px
CAP, FADE = 360, 40  # largeur d'un bout, dont le fondu intérieur
END, END_FADE = 60, 20  # bout sans feuilles (écrans étroits)
RIM = 9  # épaisseur du bord bleu (reflet compris), en pixels du dessin
CLEAR = 372  # au-delà, plus de nuage ni de feuille : milieu des écrans étroits
LEAVES = 190  # les boutons commencent après les feuilles (en pixels du dessin)
QUALITY = 88

# Proportions utilisées par styles.css (largeur / hauteur) : vérifiées par topbarIcons.test.ts
RATIOS = {"middle": 2 * (CAP - FADE) / H, "end_middle": 2 * (END - END_FADE) / H, "leaves": LEAVES / H}


def pill_mask(w: int, h: int) -> Image.Image:
    s = 4  # dessiné en grand puis réduit : bord lisse
    m = Image.new("L", (w * s, h * s), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * s - 1, h * s - 1), radius=h * s // 2, fill=255)
    return m.resize((w, h), Image.LANCZOS)


def fade(im: Image.Image, start: int, end: int) -> Image.Image:
    """Transparence progressive de x=start (opaque) à x=end (invisible) ; start > end pour un bout droit."""
    a = im.getchannel("A")
    px = a.load()
    for x in range(im.width):
        t = (x - start) / (end - start)
        k = 1.0 if t <= 0 else 0.0 if t >= 1 else 1 - t
        if k < 1:
            for y in range(im.height):
                px[x, y] = int(px[x, y] * k)
    im = im.copy()
    im.putalpha(a)
    return im


def plain_end(full: Image.Image, side: str) -> Image.Image:
    """Bout arrondi sans feuilles : le ciel du bord du milieu, prolongé, et le vrai bord bleu du dessin."""
    W, r = full.width, H / 2
    col_x = CLEAR if side == "left" else W - CLEAR - 1
    col = full.crop((col_x, 0, col_x + 1, H)).resize((END, H))
    src = full.crop((0, 0, END, H)) if side == "left" else full.crop((W - END, 0, W, H))
    out = col.copy()
    sp, op = src.load(), out.load()
    for y in range(H):
        for x in range(END):
            ex = x if side == "left" else END - 1 - x  # distance au bout
            if ex >= r:
                continue
            d = r - ((ex + 0.5 - r) ** 2 + (y + 0.5 - r) ** 2) ** 0.5  # profondeur dans le bandeau
            if d < RIM:
                op[x, y] = sp[x, y]  # le bord du dessin (juste avant les feuilles)
    out.putalpha(ImageChops.multiply(out.getchannel("A"), src.getchannel("A")))
    return fade(out, END - END_FADE, END) if side == "left" else fade(out, END_FADE, 0)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    full = Image.open(SRC).convert("RGBA").crop((0, TOP, 2000, BOTTOM))
    full.putalpha(pill_mask(full.width, full.height))
    W = full.width
    pieces = {
        "topbar-left.webp": fade(full.crop((0, 0, CAP, H)), CAP - FADE, CAP),
        "topbar-right.webp": fade(full.crop((W - CAP, 0, W, H)), FADE, 0),
        "topbar-middle.webp": full.crop((CAP - FADE, 0, W - CAP + FADE, H)),
        "topbar-middle-narrow.webp": full.crop((CLEAR, 0, W - CLEAR, H)),
        "topbar-end-left.webp": plain_end(full, "left"),
        "topbar-end-right.webp": plain_end(full, "right"),
    }
    for name, im in pieces.items():
        dst = OUT / name
        im.save(dst, "WEBP", quality=QUALITY, alpha_quality=90, method=6)
        print(f"{name} {im.size} {dst.stat().st_size // 1024} Ko")
    print("proportions :", {k: round(v, 4) for k, v in RATIOS.items()})


if __name__ == "__main__":
    main()
