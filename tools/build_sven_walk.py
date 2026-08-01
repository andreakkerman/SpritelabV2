"""Build Sven's eight-frame walk cycle from the supplied hero sprite.

The upper body is a single pixel-identical cutout in every frame.  Only the
two trouser legs and the (source-derived) shoes are articulated.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
import math

ROOT = Path(__file__).resolve().parents[1]
HERO = Path("/tmp/user_uploaded_attachments/image_1.png")
SCALE = 4
CELL = (360, 440)
HIP = (180, 318)
GROUND = 421


def cutout(im: Image.Image) -> Image.Image:
    """Remove only the border-connected black matte, retaining dark outlines."""
    rgb = im.convert("RGB")
    px = rgb.load(); w, h = rgb.size
    bg = set(); stack = [(0, 0)]
    while stack:
        x, y = stack.pop()
        if (x, y) in bg or not (0 <= x < w and 0 <= y < h):
            continue
        r, g, b = px[x, y]
        if max(r, g, b) > 20:
            continue
        bg.add((x, y)); stack += [(x-1,y), (x+1,y), (x,y-1), (x,y+1)]
    alpha = Image.new("L", rgb.size, 255); ap = alpha.load()
    for p in bg: ap[p[0], p[1]] = 0
    # Slightly soften only the outside edge; the original colored antialiasing remains.
    alpha = alpha.filter(ImageFilter.GaussianBlur(.28))
    out = rgb.convert("RGBA"); out.putalpha(alpha)
    return out


def crop_component(src, box):
    part = src.crop(box)
    # erase any disconnected trouser pixels above the shoe top
    return part


def thick_leg(draw, hip, knee, ankle, near):
    """Layered tapered strokes reproduce the hero's outlined olive trousers."""
    s = SCALE
    pts = [(int(x*s), int(y*s)) for x, y in (hip, knee, ankle)]
    widths = (24 if near else 22, 18 if near else 17)
    outline = (42, 45, 20, 255) if near else (35, 38, 18, 255)
    base = (89, 91, 47, 255) if near else (70, 73, 39, 255)
    light = (116, 113, 61, 190) if near else (91, 91, 49, 170)
    draw.line(pts, fill=outline, width=widths[0]*s, joint="curve")
    draw.line(pts, fill=base, width=(widths[0]-4)*s, joint="curve")
    # Stable directional highlight and two small cloth folds.
    hp = [(p[0]+3*s, p[1]-1*s) for p in pts]
    draw.line(hp, fill=light, width=3*s, joint="curve")
    for a, b in ((hip, knee), (knee, ankle)):
        x = (a[0]*2+b[0])/3; y = (a[1]*2+b[1])/3
        draw.line([(int((x-5)*s),int(y*s)),(int((x+3)*s),int((y+2)*s))],
                  fill=(45,48,24,180), width=s)


def paste_shoe(canvas, shoe, ankle, angle, far=False):
    part = shoe.copy()
    if far:
        # Consistent depth cue without changing anatomy or color identity.
        alpha = part.getchannel("A")
        part = ImageEnhance.Brightness(part).enhance(.78)
        part.putalpha(alpha)
    part = part.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    # ankle is at the top-rear of each cropped shoe; contact poses share ground line.
    x = int(ankle[0] - part.width * .28)
    y = min(int(ankle[1] - part.height * .25), GROUND - part.height)
    canvas.alpha_composite(part, (x, y))


def build():
    hero = cutout(Image.open(HERO))
    # The jacket/torso/face/accessories are frozen from one source copy.
    upper = hero.copy()
    mask = upper.getchannel("A")
    md = ImageDraw.Draw(mask)
    md.rectangle((0, 333, 360, 440), fill=0)
    upper.putalpha(mask)
    left_shoe = crop_component(hero, (98, 370, 158, 423))
    right_shoe = crop_component(hero, (194, 378, 263, 423))

    # (near hip/knee/ankle/contact/rotation, far hip/knee/ankle/contact/rotation)
    poses = [
      ((184,320),(205,355),(226,398),1,-6, (176,320),(155,357),(139,397),0,13),
      ((184,320),(197,359),(205,399),1,0,  (176,320),(157,352),(164,382),0,20),
      ((184,320),(185,360),(184,400),1,0,  (176,320),(163,348),(183,370),0,10),
      ((184,320),(169,359),(153,397),1,15, (176,320),(187,349),(206,378),0,-8),
      ((184,320),(163,357),(144,397),0,13, (176,320),(197,355),(220,398),1,-6),
      ((184,320),(165,351),(172,382),0,20, (176,320),(189,359),(199,399),1,0),
      ((184,320),(171,348),(190,370),0,10, (176,320),(177,360),(177,400),1,0),
      ((184,320),(195,349),(213,378),0,-8, (176,320),(161,359),(147,397),1,15),
    ]
    frames=[]
    for i, pose in enumerate(poses):
        hi = Image.new("RGBA", (CELL[0]*SCALE, CELL[1]*SCALE))
        d = ImageDraw.Draw(hi, "RGBA")
        n, f = pose[:5], pose[5:]
        # far limb first, near limb last, maintaining anatomical identity.
        thick_leg(d, f[0], f[1], f[2], False)
        thick_leg(d, n[0], n[1], n[2], True)
        frame = hi.resize(CELL, Image.Resampling.LANCZOS)
        paste_shoe(frame, left_shoe, f[2], f[4], far=True)
        paste_shoe(frame, right_shoe, n[2], n[4], far=False)
        frame.alpha_composite(upper)
        out = ROOT / f"sven-walk-right-{i:02d}.png"
        frame.save(out, optimize=True)
        frames.append(frame)
    sheet = Image.new("RGBA", (2880, 440))
    for i, frame in enumerate(frames): sheet.alpha_composite(frame, (i*360, 0))
    sheet.save(ROOT / "sven-walk-right-spritesheet.png", optimize=True)


if __name__ == "__main__":
    build()
