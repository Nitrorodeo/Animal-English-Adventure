"""Découpe les 3 animaux marins de la carte du monde (fond adouci, transparent) en double résolution."""
import sys
from PIL import Image, ImageDraw, ImageFilter
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
W, H = im.size
def sprite(name, box, shapes, scale=2, blur=9):
    x0, y0, x1, y1 = [int(v * (W if i % 2 == 0 else H)) for i, v in enumerate(box)]
    c = im.crop((x0, y0, x1, y1)).resize(((x1 - x0) * scale, (y1 - y0) * scale), Image.LANCZOS)
    m = Image.new('L', c.size, 0)
    d = ImageDraw.Draw(m)
    for kind, pts in shapes:  # coordonnées en fraction du découpage
        p = [v * (c.size[0] if i % 2 == 0 else c.size[1]) for i, v in enumerate(pts)]
        (d.ellipse if kind == 'e' else d.polygon)(p, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(blur))
    c.putalpha(m)
    c.save(f'{out}/{name}.webp', quality=90)
    print(name, (x0, y0, x1, y1), c.size, 'box %:', [round(v * 100, 2) for v in box])
# baleine : corps + jet d'eau
sprite('whale', (0.605, 0.425, 0.75, 0.55), [('e', (0.06, 0.25, 0.98, 0.98)), ('e', (0.25, 0.04, 0.58, 0.45))])
# tortue
sprite('turtle', (0.66, 0.70, 0.76, 0.79), [('e', (0.06, 0.1, 0.88, 0.92))])
# dauphins : le grand (gauche, en diagonale) et le petit (droite)
sprite('dolphin_big', (0.245, 0.64, 0.345, 0.755), [('p', (0.1, 0.93, 0.34, 0.93, 0.86, 0.42, 0.9, 0.14, 0.66, 0.08, 0.1, 0.6))])
sprite('dolphin_little', (0.285, 0.67, 0.385, 0.76), [('p', (0.1, 0.9, 0.46, 0.92, 0.94, 0.68, 0.94, 0.3, 0.6, 0.12, 0.2, 0.42))])
