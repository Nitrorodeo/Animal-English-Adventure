"""
Logos de la barre du haut (dessinés par le parent le 2026-11-25, dossier Animaux/Logo barre haut).

Pour chaque logo : on garde seulement la pastille ronde (les éclaboussures laissées par le détourage
autour sont effacées), on la recadre au carré, puis on l'enregistre en WebP léger dans
public/assets/ui/topbar-<nom>.webp.

Lancer : python tools/icons/build_topbar_icons.py
"""
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "Animaux" / "Logo barre haut"
OUT = ROOT / "public" / "assets" / "ui"

# fichier dessiné -> nom du bouton
LOGOS = {
    "-1.png": "friends",
    "-2.png": "gear",
    "-3.png": "bag",
    "-4.png": "map",
}
SIZE = 192  # assez net à 56 px sur un écran 3x
QUALITY = 86


def clean(im: Image.Image) -> Image.Image:
    """Efface tout ce qui n'est pas la pastille (petites taches détachées autour)."""
    a = im.getchannel("A")
    body = a.point(lambda v: 255 if v >= 128 else 0)
    # ouverture : les taches fines disparaissent, la pastille reste entière
    body = body.filter(ImageFilter.MinFilter(15)).filter(ImageFilter.MaxFilter(15))
    # on rend un peu de marge pour garder le bord doux d'origine
    keep = body.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(3))
    im = im.copy()
    im.putalpha(ImageChops.multiply(a, keep))
    return im


def square(im: Image.Image) -> Image.Image:
    box = im.getchannel("A").point(lambda v: 255 if v >= 24 else 0).getbbox()
    assert box, "logo vide"
    im = im.crop(box)
    side = max(im.size)
    out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    out.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    files = sorted(SRC.glob("*.png"))
    for suffix, name in LOGOS.items():
        src = next(f for f in files if f.name.endswith(suffix))
        im = square(clean(Image.open(src).convert("RGBA"))).resize((SIZE, SIZE), Image.LANCZOS)
        dst = OUT / f"topbar-{name}.webp"
        im.save(dst, "WEBP", quality=QUALITY, alpha_quality=90, method=6)
        print(f"{src.name} -> {dst.relative_to(ROOT)} ({dst.stat().st_size // 1024} Ko)")


if __name__ == "__main__":
    main()
