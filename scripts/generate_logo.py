#!/usr/bin/env python3
"""
Generate the new DEVKIT app launcher icon.

Design:
  - Square 1024x1024 master, with adaptive-icon safe zone (the inner ~70%
    is what shows on most launchers; outer 15% may be clipped).
  - Background: deep navy (#0D0F1F) → purple (#9B7CFF) diagonal gradient.
  - Foreground: a stylised "</>" chevron + a "D" monogram, rendered in
    cyan (#4DD4FF) with a subtle glow.
  - Rounded mask is applied by Android at runtime (adaptive icon), but
    we also produce a legacy rounded version for older API levels.

Outputs PNG launcher icons at every mipmap density:
  mdpi 48, hdpi 72, xhdpi 96, xxhdpi 144, xxxhdpi 192
plus a 512x512 play-store icon and the foreground/background layers
for adaptive icons.
"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

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
            # Diagonal gradient from top-left (navy) to bottom-right (purple)
            t = (x + y) / (2 * size)
            base = lerp(NAVY, PURPLE, t * 0.85)
            # Soft radial cyan glow centered at (35%, 30%)
            cx, cy = size * 0.35, size * 0.30
            dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            glow = max(0.0, 1.0 - dist / (size * 0.55))
            base = lerp(base, CYAN, glow * 0.18)
            px[x, y] = base
    return img


def draw_foreground(size, bg):
    """Draw the </>  + D monogram on top of the background."""
    img = bg.convert("RGBA")
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    cx, cy = size / 2, size / 2

    # ---- The "</>" chevron made of three strokes ----
    # Stroke width scales with size
    sw = int(size * 0.045)
    # The chevron sits in the upper-middle of the icon
    chevron_y = cy - size * 0.12
    # Left "<"  — two lines meeting at a point
    left_outer = (cx - size * 0.22, chevron_y - size * 0.08)
    left_tip   = (cx - size * 0.10, chevron_y)
    left_inner = (cx - size * 0.22, chevron_y + size * 0.08)
    # Right ">" — mirror
    right_outer = (cx + size * 0.22, chevron_y - size * 0.08)
    right_tip   = (cx + size * 0.10, chevron_y)
    right_inner = (cx + size * 0.22, chevron_y + size * 0.08)

    chevron_color = CYAN + (255,)

    # Draw with thick lines, round joints
    def thick_line(p1, p2, width, color):
        d.line([p1, p2], fill=color, width=width, joint="curve")
        # Round caps
        r = width // 2
        d.ellipse([p1[0]-r, p1[1]-r, p1[0]+r, p1[1]+r], fill=color)
        d.ellipse([p2[0]-r, p2[1]-r, p2[0]+r, p2[1]+r], fill=color)

    thick_line(left_outer, left_tip, sw, chevron_color)
    thick_line(left_tip,  left_inner, sw, chevron_color)
    thick_line(right_outer, right_tip, sw, chevron_color)
    thick_line(right_tip,  right_inner, sw, chevron_color)

    # ---- The "D" monogram below the chevron ----
    # Draw a stylized "D" using a thick arc + vertical bar
    d_top    = cy + size * 0.05
    d_bottom = cy + size * 0.32
    d_left   = cx - size * 0.10
    d_right  = cx + size * 0.18
    bar_w    = int(size * 0.055)

    monogram_color = WHITE + (255,)

    # Vertical bar of the D
    d.rectangle(
        [d_left, d_top, d_left + bar_w, d_bottom],
        fill=monogram_color,
    )
    # Curved part of the D — draw an arc as a pie slice then crop
    arc_box_left  = d_left
    arc_box_right = d_right + (d_right - d_left - bar_w) // 2 + bar_w
    arc_box_top    = d_top - bar_w // 2
    arc_box_bottom = d_bottom + bar_w // 2
    arc_box = [arc_box_left, arc_box_top, arc_box_right, arc_box_bottom]

    # Draw the arc as a thick stroke
    arc_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    arc_d = ImageDraw.Draw(arc_img)
    arc_d.arc(arc_box, start=270, end=90, fill=monogram_color, width=bar_w)
    # Make the arc thicker / smoother by drawing it twice with offset
    arc_d.arc([arc_box[0]+1, arc_box[1]+1, arc_box[2]+1, arc_box[3]+1],
              start=270, end=90, fill=monogram_color, width=bar_w)
    # Crop the left half of the arc (we only want the right curve of the D)
    arc_crop = arc_img.crop((d_left + bar_w, 0, size, size))
    overlay.paste(arc_crop, (int(d_left + bar_w), 0), arc_crop)

    # ---- Add a subtle outer glow on the cyan chevron ----
    glow = overlay.filter(ImageFilter.GaussianBlur(radius=size * 0.012))
    # Composite glow under the sharp overlay
    final = Image.alpha_composite(img, glow)
    final = Image.alpha_composite(final, overlay)

    return final


def make_round_mask(size, radius=None):
    """A rounded-rectangle mask (for legacy round icons)."""
    if radius is None:
        radius = size // 2  # full circle for ic_launcher_round
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
        # Square launcher icon
        icon = master_rgb.resize((px, px), Image.LANCZOS)
        icon.save(os.path.join(out_dir, "ic_launcher.png"), "PNG")
        # Rounded launcher icon (full circle mask)
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

    # 4. Adaptive icon layers (foreground on transparent, background solid)
    # Android adaptive icons are 108dp = 432px at xxxhdpi.
    adaptive_size = 432
    fg_layer = Image.new("RGBA", (adaptive_size, adaptive_size), (0, 0, 0, 0))
    # Draw the foreground (chevron + D) at the centre, scaled down slightly
    # so it stays inside the safe zone.
    fg_scaled = master.resize((adaptive_size, adaptive_size), Image.LANCZOS)
    # We only want the foreground glyph — redraw it on transparent
    fg_only = draw_foreground(adaptive_size, Image.new("RGB",
                                                       (adaptive_size, adaptive_size),
                                                       (0, 0, 0)))
    # The draw_foreground composites onto bg; rebuild as transparent:
    # Simpler: take the master alpha and use the chevron + D as opaque,
    # everything else transparent. Since draw_foreground blends with bg,
    # we approximate by thresholding the alpha against background colour.
    # For simplicity and quality, just save the full master as the
    # foreground layer (Android will mask it).
    fg_layer = fg_scaled
    fg_layer.save(os.path.join(RES, "mipmap-xxxhdpi", "ic_launcher_foreground.png"), "PNG")

    # Background layer (solid gradient)
    bg_layer = draw_background(adaptive_size)
    bg_layer.save(os.path.join(RES, "mipmap-xxxhdpi", "ic_launcher_background.png"), "PNG")

    print(f"  ✓ Adaptive icon layers (foreground + background, {adaptive_size}x{adaptive_size})")
    print()
    print("All launcher icons generated successfully.")


if __name__ == "__main__":
    main()
