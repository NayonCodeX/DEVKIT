#!/usr/bin/env python3
"""
Generate the new DEVKIT v1.0.3 launcher icon — explicit '<>' symbols.

Design brief (from user):
  "logo ta chenge koro <> emon diyo"
  → Use explicit angle-bracket symbols < and > (not just a chevron).

The icon shows three things:
  1. A bold "<" on the left
  2. A bold "/" in the middle (a slash — code-style)
  3. A bold ">" on the right
  Together they read "</>"  — the universal symbol for "code".

Behind the </> sits a soft "D" monogram (very low opacity) so the
brand name DEVKIT is still hinted at, without competing with the </>.

Background: deep navy (#0D0F1F) → purple (#9B7CFF) diagonal gradient
with a soft cyan radial highlight in the upper-left.

Outputs PNG launcher icons at every mipmap density plus a 512x512
play-store icon and adaptive-icon foreground + background layers.
"""
import os
import math
from PIL import Image, ImageDraw, ImageFilter

# Output directories
RES = "/home/z/my-project/devkit-android/app/src/main/res"
DENSITIES = {
    "mipmap-mdpi":    48,
    "mipmap-hdpi":    72,
    "mipmap-xhdpi":   96,
    "mipmap-xxhdpi":  144,
    "mipmap-xxxhdpi": 192,
}

# Brand colours
NAVY   = (13, 15, 31)      # #0D0F1F
PURPLE = (155, 124, 255)   # #9B7CFF
CYAN   = (77, 212, 255)    # #4DD4FF
WHITE  = (255, 255, 255)

# Master canvas size
MASTER = 1024


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def draw_background(size):
    """Diagonal navy→purple gradient with a soft cyan radial highlight."""
    img = Image.new("RGB", (size, size), NAVY)
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size)
            base = lerp(NAVY, PURPLE, t * 0.85)
            cx, cy = size * 0.35, size * 0.30
            dist = math.hypot(x - cx, y - cy)
            glow = max(0.0, 1.0 - dist / (size * 0.55))
            base = lerp(base, CYAN, glow * 0.18)
            px[x, y] = base
    return img


def draw_angle_bracket(d, cx, cy, char, size, color, sw):
    """
    Draw an angle bracket '<' or '>' as two thick lines forming a
    chevron. cx, cy = centre of the bracket.
    """
    h = size * 0.16   # half-height of the bracket
    w = size * 0.07   # horizontal depth of the bracket
    if char == "<":
        top    = (cx + w, cy - h)
        tip    = (cx - w, cy)
        bottom = (cx + w, cy + h)
    else:  # ">"
        top    = (cx - w, cy - h)
        tip    = (cx + w, cy)
        bottom = (cx - w, cy + h)

    def thick_line(p1, p2, width, fill):
        d.line([p1, p2], fill=fill, width=width, joint="curve")
        r = width // 2
        d.ellipse([p1[0]-r, p1[1]-r, p1[0]+r, p1[1]+r], fill=fill)
        d.ellipse([p2[0]-r, p2[1]-r, p2[0]+r, p2[1]+r], fill=fill)

    thick_line(top, tip, sw, color)
    thick_line(tip, bottom, sw, color)


def draw_slash(d, cx, cy, size, color, sw):
    """Draw a forward slash '/' as a thick diagonal line."""
    h = size * 0.12
    top    = (cx + size * 0.03, cy - h)
    bottom = (cx - size * 0.03, cy + h)
    d.line([top, bottom], fill=color, width=sw, joint="curve")
    r = sw // 2
    d.ellipse([top[0]-r, top[1]-r, top[0]+r, top[1]+r], fill=color)
    d.ellipse([bottom[0]-r, bottom[1]-r, bottom[0]+r, bottom[1]+r], fill=color)


def draw_foreground(size, bg):
    """Draw the </>  + faint D monogram on top of the background."""
    img = bg.convert("RGBA")
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    cx, cy = size / 2, size / 2

    # ---- Faint "D" monogram (background hint) ----
    mono_alpha = 32  # very faint
    d_top    = cy - size * 0.30
    d_bottom = cy + size * 0.30
    d_left   = cx - size * 0.16
    d_right  = cx + size * 0.20
    bar_w    = int(size * 0.07)
    monogram_color = WHITE + (mono_alpha,)

    d.rectangle(
        [d_left, d_top, d_left + bar_w, d_bottom],
        fill=monogram_color,
    )
    arc_box_left  = d_left
    arc_box_right = d_right + (d_right - d_left - bar_w) // 2 + bar_w
    arc_box_top    = d_top - bar_w // 2
    arc_box_bottom = d_bottom + bar_w // 2
    arc_box = [arc_box_left, arc_box_top, arc_box_right, arc_box_bottom]
    arc_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    arc_d = ImageDraw.Draw(arc_img)
    arc_d.arc(arc_box, start=270, end=90, fill=monogram_color, width=bar_w)
    arc_d.arc([arc_box[0]+1, arc_box[1]+1, arc_box[2]+1, arc_box[3]+1],
              start=270, end=90, fill=monogram_color, width=bar_w)
    arc_crop = arc_img.crop((d_left + bar_w, 0, size, size))
    overlay.paste(arc_crop, (int(d_left + bar_w), 0), arc_crop)

    # ---- The </>  symbol, centred ----
    sw = int(size * 0.055)   # stroke width scales with size
    bracket_color = CYAN + (255,)
    slash_color   = WHITE + (255,)

    spacing = size * 0.16
    left_cx  = cx - spacing
    slash_cx = cx
    right_cx = cx + spacing

    draw_angle_bracket(d, left_cx,  cy, "<", size, bracket_color, sw)
    draw_slash(d,           slash_cx, cy, size, slash_color,   sw)
    draw_angle_bracket(d, right_cx, cy, ">", size, bracket_color, sw)

    # ---- Soft outer glow on the cyan brackets ----
    glow = overlay.filter(ImageFilter.GaussianBlur(radius=size * 0.010))
    final = Image.alpha_composite(img, glow)
    final = Image.alpha_composite(final, overlay)

    return final


def make_round_mask(size):
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse([0, 0, size - 1, size - 1], fill=255)
    return mask


def main():
    os.makedirs(RES, exist_ok=True)

    # 1. Build the master 1024x1024 icon
    bg = draw_background(MASTER)
    master = draw_foreground(MASTER, bg)
    master_rgb = master.convert("RGB")

    # 2. Save density-specific launcher icons
    for density, px in DENSITIES.items():
        out_dir = os.path.join(RES, density)
        os.makedirs(out_dir, exist_ok=True)
        icon = master_rgb.resize((px, px), Image.LANCZOS)
        icon.save(os.path.join(out_dir, "ic_launcher.png"), "PNG")
        round_icon = master_rgb.resize((px, px), Image.LANCZOS)
        mask = make_round_mask(px)
        rounded = Image.new("RGB", (px, px), NAVY)
        rounded.paste(round_icon, (0, 0), mask)
        rounded.save(os.path.join(out_dir, "ic_launcher_round.png"), "PNG")
        print(f"  ✓ {density}: ic_launcher.png + ic_launcher_round.png ({px}x{px})")

    # 3. Save 512x512 play-store icon
    playstore = master_rgb.resize((512, 512), Image.LANCZOS)
    playstore_path = os.path.join(RES, "ic_launcher_playstore.png")
    playstore.save(playstore_path, "PNG")
    print(f"  ✓ ic_launcher_playstore.png (512x512)")

    # 4. Adaptive icon layers
    adaptive_size = 432
    fg_layer = master.resize((adaptive_size, adaptive_size), Image.LANCZOS)
    fg_layer.save(os.path.join(RES, "mipmap-xxxhdpi", "ic_launcher_foreground.png"), "PNG")
    bg_layer = draw_background(adaptive_size)
    bg_layer.save(os.path.join(RES, "mipmap-xxxhdpi", "ic_launcher_background.png"), "PNG")
    print(f"  ✓ Adaptive icon layers (foreground + background, {adaptive_size}x{adaptive_size})")
    print()
    print("All launcher icons generated successfully.")


if __name__ == "__main__":
    main()
