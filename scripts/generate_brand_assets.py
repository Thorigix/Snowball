#!/usr/bin/env python3
"""Snowball brand assets — polished, professional, attention-grabbing.

Design direction:
- Soft mesh-gradient (deep navy → teal → indigo) for warmth + depth
- Big glossy hero snowball with refined specular highlight and rim light
- Smaller trailing snowballs imply momentum/group growth
- Solana-style sweeping arc + sparkles for energy
- Clean, generic copy on the banner (no audience framing)
"""

from __future__ import annotations

import math
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "brand")

# ─── Palette ─────────────────────────────────────────────────────────
INK = (10, 14, 20)
INK_2 = (16, 22, 32)
NAVY = (22, 32, 48)
TEAL = (91, 181, 162)
TEAL_BRIGHT = (130, 220, 200)
CYAN = (110, 200, 220)
INDIGO = (123, 140, 222)
INDIGO_BRIGHT = (165, 180, 245)
VIOLET = (170, 130, 230)
SNOW_HI = (252, 254, 255)
SNOW_MID = (228, 238, 244)
SNOW_LO = (190, 208, 220)
SNOW_SHADE = (140, 160, 178)
TEXT = (240, 244, 250)
TEXT_DIM = (180, 190, 205)


# ─── Font helpers ────────────────────────────────────────────────────
def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates_bold = [
        "/System/Library/Fonts/Avenir Next.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Futura.ttc",
        "/Library/Fonts/Arial Bold.ttf",
    ]
    candidates_reg = [
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Avenir Next.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in (candidates_bold if bold else candidates_reg):
        try:
            f = ImageFont.truetype(path, size)
            if bold and hasattr(f, "set_variation_by_name"):
                try:
                    f.set_variation_by_name("Bold")
                except Exception:
                    pass
            return f
        except Exception:
            continue
    return ImageFont.load_default()


# ─── Gradient builders ───────────────────────────────────────────────
def _radial_blob(canvas: Image.Image, cx: float, cy: float, r: float,
                 color: tuple[int, int, int], alpha: int = 180) -> None:
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*color, alpha))
    layer = layer.filter(ImageFilter.GaussianBlur(r * 0.55))
    canvas.alpha_composite(layer)


def _mesh_background(size: tuple[int, int], blobs: list[tuple]) -> Image.Image:
    """Builds a soft mesh-gradient background.

    blobs: list of (cx_frac, cy_frac, r_frac, color, alpha)
    """
    w, h = size
    bg = Image.new("RGBA", size, (*INK, 255))
    # vertical wash from INK to NAVY
    px = bg.load()
    for y in range(h):
        t = y / max(1, h - 1)
        col = (
            int(INK[0] + (NAVY[0] - INK[0]) * t),
            int(INK[1] + (NAVY[1] - INK[1]) * t),
            int(INK[2] + (NAVY[2] - INK[2]) * t),
            255,
        )
        for x in range(w):
            px[x, y] = col
    for cxf, cyf, rf, color, alpha in blobs:
        _radial_blob(bg, cxf * w, cyf * h, rf * max(w, h), color, alpha)
    return bg


# ─── Snowball renderer ───────────────────────────────────────────────
def _snowball(diameter: int, tint_warm: bool = False) -> Image.Image:
    """Glossy, well-lit snowball: rim light, specular, contact shadow."""
    pad = int(diameter * 0.42)
    s = diameter + pad * 2
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    cx = pad + diameter / 2
    cy = pad + diameter / 2
    r = diameter / 2

    # Drop shadow
    shadow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse(
        [pad - 8, pad + diameter * 0.82, pad + diameter + 8, pad + diameter * 1.10],
        fill=(0, 0, 0, 150),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(diameter * 0.07))
    img.alpha_composite(shadow)

    # Body — radial gradient body (light from top-left)
    body = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    bp = body.load()
    light_x = pad + diameter * 0.32
    light_y = pad + diameter * 0.28
    for y in range(s):
        for x in range(s):
            dx = x + 0.5 - cx
            dy = y + 0.5 - cy
            d = math.hypot(dx, dy)
            if d <= r + 1:
                t = math.hypot(x - light_x, y - light_y) / (diameter * 1.05)
                t = max(0.0, min(1.0, t))
                # mix highlight → mid → shade
                if t < 0.5:
                    k = t / 0.5
                    col = tuple(int(SNOW_HI[i] + (SNOW_MID[i] - SNOW_HI[i]) * k) for i in range(3))
                else:
                    k = (t - 0.5) / 0.5
                    col = tuple(int(SNOW_MID[i] + (SNOW_LO[i] - SNOW_MID[i]) * k) for i in range(3))
                edge = max(0.0, min(1.0, (r - d) * 1.5 + 0.5))
                bp[x, y] = (col[0], col[1], col[2], int(255 * edge))
    img.alpha_composite(body)

    # Cool rim light (bottom-right) — subtle teal/indigo bounce
    rim = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    rp = rim.load()
    bounce_x = pad + diameter * 0.78
    bounce_y = pad + diameter * 0.78
    bounce_color = INDIGO_BRIGHT if not tint_warm else TEAL_BRIGHT
    for y in range(s):
        for x in range(s):
            dx = x + 0.5 - cx
            dy = y + 0.5 - cy
            d = math.hypot(dx, dy)
            if r * 0.78 <= d <= r:
                bd = math.hypot(x - bounce_x, y - bounce_y)
                strength = max(0.0, 1.0 - bd / (diameter * 0.5))
                strength *= 0.55
                if strength > 0:
                    rp[x, y] = (*bounce_color, int(255 * strength))
    rim = rim.filter(ImageFilter.GaussianBlur(diameter * 0.025))
    img.alpha_composite(rim)

    # Specular highlight
    hl = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hl)
    hd.ellipse(
        [pad + diameter * 0.20, pad + diameter * 0.16,
         pad + diameter * 0.46, pad + diameter * 0.36],
        fill=(255, 255, 255, 220),
    )
    hl = hl.filter(ImageFilter.GaussianBlur(diameter * 0.035))
    img.alpha_composite(hl)

    # Tiny secondary highlight
    hl2 = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    h2d = ImageDraw.Draw(hl2)
    h2d.ellipse(
        [pad + diameter * 0.42, pad + diameter * 0.30,
         pad + diameter * 0.50, pad + diameter * 0.36],
        fill=(255, 255, 255, 200),
    )
    hl2 = hl2.filter(ImageFilter.GaussianBlur(diameter * 0.012))
    img.alpha_composite(hl2)

    return img


# ─── Helper shapes ───────────────────────────────────────────────────
def _rounded_rect_image(size: tuple[int, int], radius: int,
                        fill: tuple[int, int, int, int]) -> Image.Image:
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=fill)
    return img


def _paste_centered(target: Image.Image, sprite: Image.Image, cx: int, cy: int) -> None:
    sw, sh = sprite.size
    target.alpha_composite(sprite, (int(cx - sw / 2), int(cy - sh / 2)))


def _arc(canvas: Image.Image, cx: float, cy: float, r: float,
         start_deg: float, end_deg: float, width: int,
         color_a: tuple[int, int, int], color_b: tuple[int, int, int],
         alpha_curve=lambda t: 1.0) -> None:
    """Color-shifting tapered arc (start color → end color)."""
    steps = 120
    for i in range(steps):
        t0 = i / steps
        t1 = (i + 1) / steps
        a0 = math.radians(start_deg + (end_deg - start_deg) * t0)
        a1 = math.radians(start_deg + (end_deg - start_deg) * t1)
        taper = math.sin(math.pi * (t0 + t1) / 2)
        w = max(1, int(width * (0.25 + 0.75 * taper)))
        tm = (t0 + t1) / 2
        col = tuple(int(color_a[k] + (color_b[k] - color_a[k]) * tm) for k in range(3))
        alpha = int(255 * alpha_curve(tm))
        seg = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(seg)
        x0 = cx + math.cos(a0) * r
        y0 = cy + math.sin(a0) * r
        x1 = cx + math.cos(a1) * r
        y1 = cy + math.sin(a1) * r
        sd.line([x0, y0, x1, y1], fill=(*col, alpha), width=w)
        canvas.alpha_composite(seg)


def _sparkle(canvas: Image.Image, cx: float, cy: float, size: float,
             color: tuple[int, int, int], alpha: int = 230) -> None:
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    w = max(2, int(size * 0.20))
    d.line([cx - size, cy, cx + size, cy], fill=(*color, alpha), width=w)
    d.line([cx, cy - size, cx, cy + size], fill=(*color, alpha), width=w)
    d.line([cx - size * 0.55, cy - size * 0.55, cx + size * 0.55, cy + size * 0.55],
           fill=(*color, int(alpha * 0.65)), width=max(1, w - 1))
    d.line([cx - size * 0.55, cy + size * 0.55, cx + size * 0.55, cy - size * 0.55],
           fill=(*color, int(alpha * 0.65)), width=max(1, w - 1))
    # bright core
    core = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    cd = ImageDraw.Draw(core)
    cd.ellipse([cx - size * 0.22, cy - size * 0.22, cx + size * 0.22, cy + size * 0.22],
               fill=(255, 255, 255, alpha))
    core = core.filter(ImageFilter.GaussianBlur(size * 0.08))
    layer.alpha_composite(core)
    layer = layer.filter(ImageFilter.GaussianBlur(0.7))
    canvas.alpha_composite(layer)


def _dots_trail(canvas: Image.Image, points: list[tuple[float, float, float]],
                color: tuple[int, int, int]) -> None:
    """Soft falling dots / particle trail. points: list of (x, y, radius)."""
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i, (x, y, r) in enumerate(points):
        a = int(220 * (1 - i / max(1, len(points) - 1)))
        d.ellipse([x - r, y - r, x + r, y + r], fill=(*color, max(40, a)))
    layer = layer.filter(ImageFilter.GaussianBlur(2))
    canvas.alpha_composite(layer)


# ─── Logo ────────────────────────────────────────────────────────────
def make_logo() -> None:
    SIZE = 2048
    OUT = 1024
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

    # Outer rounded square (deep ink)
    outer = _rounded_rect_image((SIZE - 80, SIZE - 80), int(SIZE * 0.22), (*INK, 255))
    canvas.alpha_composite(outer, (40, 40))

    # Inner mesh-gradient panel
    inner_w = SIZE - 200
    panel = _mesh_background(
        (inner_w, inner_w),
        blobs=[
            (0.20, 0.18, 0.55, INDIGO, 150),
            (0.85, 0.30, 0.45, VIOLET, 110),
            (0.70, 0.85, 0.55, TEAL, 160),
            (0.30, 0.85, 0.40, CYAN, 90),
        ],
    )
    # mask to rounded
    mask = Image.new("L", (inner_w, inner_w), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, inner_w - 1, inner_w - 1],
                         radius=int(SIZE * 0.18), fill=255)
    panel_rgba = Image.new("RGBA", (inner_w, inner_w), (0, 0, 0, 0))
    panel_rgba.paste(panel, (0, 0), mask)
    canvas.alpha_composite(panel_rgba, (100, 100))

    # Big halo behind the hero ball
    halo = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    hd.ellipse([SIZE * 0.18, SIZE * 0.22, SIZE * 0.85, SIZE * 0.88],
               fill=(255, 255, 255, 50))
    halo = halo.filter(ImageFilter.GaussianBlur(170))
    canvas.alpha_composite(halo)

    # Solana-style sweeping arc (teal → indigo)
    arc_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    _arc(arc_layer, SIZE * 0.50, SIZE * 0.55, SIZE * 0.34,
         -170, -10, int(SIZE * 0.05), TEAL_BRIGHT, INDIGO_BRIGHT,
         alpha_curve=lambda t: 0.95 * math.sin(math.pi * t))
    _arc(arc_layer, SIZE * 0.50, SIZE * 0.55, SIZE * 0.42,
         -160, -25, int(SIZE * 0.022), CYAN, VIOLET,
         alpha_curve=lambda t: 0.55 * math.sin(math.pi * t))
    canvas.alpha_composite(arc_layer)

    # Particle trail leading into the hero ball
    trail_pts = []
    for i in range(14):
        t = i / 13
        x = SIZE * (0.18 + 0.32 * t)
        y = SIZE * (0.78 - 0.22 * t * t)
        r = SIZE * (0.005 + 0.018 * t)
        trail_pts.append((x, y, r))
    _dots_trail(canvas, trail_pts, (255, 255, 255))

    # Hero composition: 1 big ball + 2 trailing
    hero = _snowball(int(SIZE * 0.42))
    trail_a = _snowball(int(SIZE * 0.22))
    trail_b = _snowball(int(SIZE * 0.16))

    _paste_centered(canvas, trail_b, int(SIZE * 0.26), int(SIZE * 0.74))
    _paste_centered(canvas, trail_a, int(SIZE * 0.36), int(SIZE * 0.66))
    _paste_centered(canvas, hero, int(SIZE * 0.56), int(SIZE * 0.54))

    # Sparkles
    _sparkle(canvas, SIZE * 0.78, SIZE * 0.30, SIZE * 0.05, TEAL_BRIGHT, alpha=240)
    _sparkle(canvas, SIZE * 0.86, SIZE * 0.46, SIZE * 0.025, INDIGO_BRIGHT, alpha=210)
    _sparkle(canvas, SIZE * 0.18, SIZE * 0.30, SIZE * 0.022, INDIGO_BRIGHT, alpha=200)

    # Soft inner border for depth
    bord = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bord)
    bd.rounded_rectangle([100, 100, SIZE - 100, SIZE - 100],
                         radius=int(SIZE * 0.18),
                         outline=(255, 255, 255, 22), width=4)
    canvas.alpha_composite(bord)

    # Bottom-edge inner shadow for grounding (alpha gradient, no mask hacks)
    shade = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sp = shade.load()
    for y in range(int(SIZE * 0.78), SIZE - 100):
        t = (y - SIZE * 0.78) / (SIZE * 0.22)
        t = max(0.0, min(1.0, t))
        a = int(110 * t * t)
        for x in range(100, SIZE - 100):
            sp[x, y] = (0, 0, 0, a)
    canvas.alpha_composite(shade)

    out = canvas.resize((OUT, OUT), Image.LANCZOS)
    out.save(os.path.join(OUT_DIR, "snowball-logo.png"), "PNG", optimize=True)


# ─── Banner ──────────────────────────────────────────────────────────
def make_banner() -> None:
    # 4:1 aspect — meets the "3:1 or 4:1 wide" requirement
    W, H = 4800, 1200
    OUT_W, OUT_H = 2400, 600
    canvas = _mesh_background(
        (W, H),
        blobs=[
            (0.05, 0.20, 0.45, INDIGO, 140),
            (0.55, 0.10, 0.40, VIOLET, 110),
            (0.85, 0.55, 0.55, TEAL, 170),
            (0.95, 0.95, 0.40, CYAN, 110),
            (0.30, 0.85, 0.45, INDIGO_BRIGHT, 90),
        ],
    ).convert("RGBA")

    # Subtle horizontal grid lines (very faint, gives "structure" feel)
    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    for y in range(0, H, 120):
        gd.line([(0, y), (W, y)], fill=(255, 255, 255, 8), width=2)
    for x in range(0, W, 120):
        gd.line([(x, 0), (x, H)], fill=(255, 255, 255, 6), width=2)
    canvas.alpha_composite(grid)

    # Right-side big halo behind the snowballs
    rh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rhd = ImageDraw.Draw(rh)
    rhd.ellipse([W * 0.55, -H * 0.2, W * 1.1, H * 1.2],
                fill=(255, 255, 255, 35))
    rh = rh.filter(ImageFilter.GaussianBlur(180))
    canvas.alpha_composite(rh)

    # Sweeping arc
    arc = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    _arc(arc, W * 0.78, H * 0.62, H * 0.46,
         -170, -10, int(H * 0.055), TEAL_BRIGHT, INDIGO_BRIGHT,
         alpha_curve=lambda t: 0.95 * math.sin(math.pi * t))
    _arc(arc, W * 0.78, H * 0.62, H * 0.55,
         -160, -25, int(H * 0.024), CYAN, VIOLET,
         alpha_curve=lambda t: 0.55 * math.sin(math.pi * t))
    canvas.alpha_composite(arc)

    # Particle trail entering from upper-left toward the hero ball
    trail_pts = []
    for i in range(20):
        t = i / 19
        x = W * (0.45 + 0.30 * t)
        y = H * (0.20 + 0.30 * t * t)
        r = H * (0.005 + 0.020 * t)
        trail_pts.append((x, y, r))
    _dots_trail(canvas, trail_pts, (255, 255, 255))

    # Hero snowballs (right side)
    hero = _snowball(int(H * 0.52))
    mid = _snowball(int(H * 0.34))
    small = _snowball(int(H * 0.26))

    _paste_centered(canvas, small, int(W * 0.66), int(H * 0.78))
    _paste_centered(canvas, mid, int(W * 0.92), int(H * 0.70))
    _paste_centered(canvas, hero, int(W * 0.79), int(H * 0.55))

    # Sparkles around the cluster
    _sparkle(canvas, W * 0.86, H * 0.20, H * 0.05, TEAL_BRIGHT, alpha=240)
    _sparkle(canvas, W * 0.96, H * 0.40, H * 0.030, TEAL_BRIGHT, alpha=200)
    _sparkle(canvas, W * 0.70, H * 0.30, H * 0.024, INDIGO_BRIGHT, alpha=210)
    _sparkle(canvas, W * 0.62, H * 0.85, H * 0.020, INDIGO_BRIGHT, alpha=180)

    # Text block (left)
    title_font = _font(int(H * 0.22), bold=True)
    sub_font = _font(int(H * 0.062))
    pill_font = _font(int(H * 0.038), bold=True)

    text_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    td = ImageDraw.Draw(text_layer)

    # Live pill (top of text block)
    pill = "● LIVE ON SOLANA"
    bbox = td.textbbox((0, 0), pill, font=pill_font)
    pw = bbox[2] - bbox[0] + int(H * 0.06)
    ph = int(H * 0.085)
    px0 = int(W * 0.06)
    py0 = int(H * 0.22)
    td.rounded_rectangle(
        [px0, py0, px0 + pw, py0 + ph],
        radius=int(ph / 2),
        fill=(*TEAL, 50),
        outline=(*TEAL_BRIGHT, 200),
        width=3,
    )
    pill_text_y = py0 + (ph - (bbox[3] - bbox[1])) / 2 - bbox[1]
    td.text((px0 + int(H * 0.03), pill_text_y),
            pill, font=pill_font, fill=TEAL_BRIGHT)

    # Title
    td.text((int(W * 0.06), int(H * 0.36)), "Snowball",
            font=title_font, fill=TEXT)

    # Subtitle (two lines, generic copy — no audience framing)
    td.text((int(W * 0.062), int(H * 0.62)),
            "Group checkout, secured by Solana escrow.",
            font=sub_font, fill=TEXT)
    td.text((int(W * 0.062), int(H * 0.72)),
            "Funds locked by code — released on delivery.",
            font=sub_font, fill=TEXT_DIM)

    canvas.alpha_composite(text_layer)

    # Subtle bottom fade
    fade = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fp = fade.load()
    for y in range(int(H * 0.80), H):
        t = (y - H * 0.80) / (H - H * 0.80)
        a = int(110 * t * t)
        for x in range(W):
            fp[x, y] = (0, 0, 0, a)
    canvas.alpha_composite(fade)

    out = canvas.convert("RGB").resize((OUT_W, OUT_H), Image.LANCZOS)
    out.save(os.path.join(OUT_DIR, "snowball-banner.png"), "PNG", optimize=True)


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    make_logo()
    make_banner()
    print("Wrote:", os.path.join(OUT_DIR, "snowball-logo.png"))
    print("Wrote:", os.path.join(OUT_DIR, "snowball-banner.png"))


if __name__ == "__main__":
    main()
