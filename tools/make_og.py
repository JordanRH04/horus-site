"""Generate the 1200x630 Open Graph share card -> ../assets/og.png

Renders the Horus H-hex mark (exact SVG path geometry) with the brand gradient
(violet #7c4dff -> blue #2f7bff -> cyan #22d3ee) on the dark background, plus the
tagline. Run after any brand/tagline change:

    ..\\..\\Horus\\.venv\\Scripts\\python.exe tools\\make_og.py

Needs Pillow + numpy (numpy ships with the Horus venv; Pillow auto-installs on
first run if missing).
"""
from __future__ import annotations

import os
import sys
import subprocess

try:
    import numpy as np
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "pillow", "numpy"], check=True)
    import numpy as np
    from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets", "og.png")

VIOLET, BLUE, CYAN = (124, 77, 255), (47, 123, 255), (34, 211, 238)

# --- background: near-black with soft brand glows for depth ------------------
yy, xx = np.mgrid[0:H, 0:W]
arr = np.zeros((H, W, 3), np.float32)
arr[:] = (7, 8, 15)


def glow(cx, cy, r, color, strength):
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    a = np.clip(1 - d / r, 0, 1) ** 2 * strength
    for i in range(3):
        arr[:, :, i] += a * color[i]


glow(150, 120, 540, VIOLET, 0.16)     # violet, top-left
glow(1070, 560, 560, CYAN, 0.13)      # cyan, bottom-right
glow(600, 315, 720, BLUE, 0.05)       # faint blue center
img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
draw = ImageDraw.Draw(img)

# --- brand gradient bitmap (diagonal violet -> blue -> cyan) -----------------
t = np.clip((xx / W + yy / H) / 2, 0, 1)
g = np.zeros((H, W, 3), np.float32)
lo = t < 0.5
tt = (t[lo] / 0.5)[:, None]
g[lo] = np.array(VIOLET) * (1 - tt) + np.array(BLUE) * tt
tt = ((t[~lo] - 0.5) / 0.5)[:, None]
g[~lo] = np.array(BLUE) * (1 - tt) + np.array(CYAN) * tt
grad = Image.fromarray(g.astype(np.uint8))

# --- logo: exact H-hex geometry from horus_logo.svg (viewBox 128) ------------
LOGO = 210
ox, oy = (W - LOGO) // 2, 66
s = LOGO / 128


def P(pts):
    return [(ox + px * s, oy + py * s) for px, py in pts]


HEX = [(64, 12), (110, 38), (110, 90), (64, 116), (18, 90), (18, 38)]
GLYPH = [(48, 34), (56, 34), (56, 56), (72, 56), (72, 34), (88, 34), (88, 86),
         (80, 94), (72, 94), (72, 72), (56, 72), (56, 94), (40, 94), (40, 42)]

draw.polygon(P(HEX), fill=(11, 12, 23))                     # dark badge interior

stroke = Image.new("L", (W, H), 0)
ImageDraw.Draw(stroke).line(P(HEX) + [P(HEX)[0]], fill=255,
                            width=max(4, int(6 * s)), joint="curve")
img.paste(grad, (0, 0), stroke)                             # gradient hex outline

glyph = Image.new("L", (W, H), 0)
ImageDraw.Draw(glyph).polygon(P(GLYPH), fill=255)
img.paste(grad, (0, 0), glyph)                              # gradient H glyph
draw = ImageDraw.Draw(img)
draw.line(P(GLYPH) + [P(GLYPH)[0]], fill=(7, 8, 15), width=2, joint="curve")


# --- text --------------------------------------------------------------------
def font(paths, size):
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()


BOLD = ["C:/Windows/Fonts/seguibl.ttf", "C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"]
REG = ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"]
big, sub, small = font(BOLD, 66), font(REG, 28), font(BOLD, 26)

# headline, centered, two-tone: white "Record once. " + gradient "Farm forever."
l1, l2 = "Record once. ", "Farm forever."
w1 = draw.textlength(l1, font=big)
w2 = draw.textlength(l2, font=big)
x0, y0 = (W - (w1 + w2)) / 2, 322
draw.text((x0, y0), l1, font=big, fill=(233, 234, 246))
tmask = Image.new("L", (W, H), 0)
ImageDraw.Draw(tmask).text((x0 + w1, y0), l2, font=big, fill=255)
img.paste(grad, (0, 0), tmask)
draw = ImageDraw.Draw(img)

sub_t = "The external vision macro for Anime Expeditions"
draw.text(((W - draw.textlength(sub_t, font=sub)) / 2, y0 + 96), sub_t, font=sub, fill=(139, 147, 189))

draw.text((70, 560), "horusmacro.com", font=small, fill=(199, 205, 240))
rt = "Free recorder  ·  $2.99/mo Premium"
draw.text((W - 70 - draw.textlength(rt, font=small), 560), rt, font=small, fill=(139, 147, 189))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
img.save(OUT)
print("wrote", os.path.abspath(OUT), img.size)
