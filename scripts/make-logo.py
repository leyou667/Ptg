"""Extrait le logo (fond transparent) depuis la capture fournie. Usage : python3 -I scripts/make-logo.py <source.jpg>"""
import sys
import numpy as np
from PIL import Image

src = sys.argv[1]
im = np.array(Image.open(src).convert("RGB")).astype(float)
band = im[450:1550]
paper = np.array([248, 246, 241.0])
NAVY = np.array([11, 31, 63.0])
CYAN = np.array([18, 196, 220.0])
# couleurs réellement présentes dans la capture
navy_s = np.array([5, 34, 63.0])
cyan_s = np.array([10, 200, 218.0])

def fit(fg):
    v = fg - paper
    d = band - paper
    t = np.clip((d @ v) / (v @ v), 0, 1)
    res = np.linalg.norm(d - t[..., None] * v, axis=2)
    return t, res

tn, rn = fit(navy_s)
tc, rc = fit(cyan_s)
use_navy = rn <= rc
alpha = np.where(use_navy, tn, tc)
alpha = np.where(alpha < 0.04, 0, alpha)
h, w = alpha.shape
def render(navy_col):
    out = np.zeros((h, w, 4), np.uint8)
    col = np.where(use_navy[..., None], navy_col, CYAN)
    out[..., :3] = col.astype(np.uint8)
    out[..., 3] = (alpha * 255).astype(np.uint8)
    return Image.fromarray(out, "RGBA")

ys, xs = np.where(alpha > 0.1)
box = (max(xs.min() - 6, 0), max(ys.min() - 6, 0), min(xs.max() + 7, w), min(ys.max() + 7, h))
for name, col in (("logo.png", NAVY), ("logo-dark.png", np.array([255, 255, 255.0]))):
    img = render(col).crop(box)
    img.save(f"public/images/{name}")
    print(name, img.size)
# étoile seule (indicateur de scroll) : bloc en haut à droite du logo
