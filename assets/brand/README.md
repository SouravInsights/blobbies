# Blobbies — brand assets

The logo mark, exported as high-resolution PNGs for marketing use.

The mark is not a drawing of an avatar — it **is** an avatar, built from the
library's own geometry (the same egg path, the same clip disk, the same ink).
It just leaves out the initials, because at small sizes a letterform is a
smudge. Source of truth for the geometry is `apps/site/src/ui.tsx` (`MARK_BLOB`,
`MARK_FACE`) and `packages/core/src/palette.ts`.

## Colors

| Role     | Hex       |
| -------- | --------- |
| Backdrop | `#2f2f2f` |
| Blob     | `#FFD43B` |
| Ink      | `#1c1c1c` |

## Files

SVG is the master; PNGs are rasterised from it. All PNGs have a transparent
background outside the circle.

### `blobbies-mark-*` — edge-to-edge

The disk fills the frame. Use this for **app icons, favicons, avatars, and
profile pictures**, where the containing surface already provides padding and
clipping.

Sizes: 2048, 1024, 512, 256, 128, 64, 32 px.

### `blobbies-mark-padded-*` — 12% padding

The same mark with a safe margin baked in (`viewBox="-12 -12 124 124"`, so the
disk fills ~81% of the frame). Use this as the **default marketing asset** —
slide decks, blog headers, social posts, READMEs — anywhere the mark sits next
to text or needs breathing room and you don't want to hand-position it.

Sizes: 2048, 1024, 512, 256, 128 px.

### `blobbies-mark-black-*.jpg` — black tile (recommended for profile photos)

Pure black (`#000000`) behind the mark, with the disk inset to ~86% of the
frame (`viewBox="-8 -8 116 116"`).

The tile colour is deliberately **not** the disk's own backdrop (`#2f2f2f`) —
if the two match, the disk dissolves into the square and the mark stops reading
as a circle. Keeping them distinct means the disk stays legible as a circle on
the tile, and the inset margin keeps a platform's circle crop from slicing the
disk's edge.

**Use this one for Twitter/X, LinkedIn, Instagram, Slack and GitHub.** On a
dark UI the black tile blends into the chrome, so the profile shows a floating
dark circle; on a light UI it reads as a black circular badge.

### `blobbies-mark-light-*.jpg` — disk on the page's light surface

`#fbfaf7` (the site's light theme background) behind the mark, with the disk
inset to 97% of the frame. Same idea on a light tile.

Use this where the avatar sits on a light page and a black tile would be too
heavy — bios, directories, guest avatars, light-mode docs.

### JPEG sizes

All eight are `400`, `800`, `1024`, and `1500` px square, quality 92.

- **400×400** is Twitter/X's recommended profile size, and covers LinkedIn and
  Instagram. It is ~20 KB, far inside every platform's limit.
- **1500×1500** is for anywhere that wants headroom.

JPEG has no alpha, so these are flattened onto solid colour. Keep using the
**PNGs** wherever transparency is needed.

## Regenerating

Requires `rsvg-convert` (`brew install librsvg`). JPEG conversion uses `sips`,
which ships with macOS; this `rsvg-convert` build only emits PNG/PDF/PS/EPS/SVG.

```sh
cd assets/brand

# edge-to-edge
for s in 2048 1024 512 256 128 64 32; do
  rsvg-convert -w $s -h $s -b none blobbies-mark.svg -o blobbies-mark-${s}.png
done

# padded
for s in 2048 1024 512 256 128; do
  rsvg-convert -w $s -h $s -b none blobbies-mark-padded.svg -o blobbies-mark-padded-${s}.png
done

# JPEG profile assets (opaque PNG -> sips -> JPEG)
for s in 1500 1024 800 400; do
  rsvg-convert -w $s -h $s blobbies-mark-jpg-black.svg -o /tmp/bb-black-${s}.png
  rsvg-convert -w $s -h $s blobbies-mark-jpg-light.svg -o /tmp/bb-light-${s}.png
  sips -s format jpeg -s formatOptions 92 /tmp/bb-black-${s}.png --out blobbies-mark-black-${s}.jpg
  sips -s format jpeg -s formatOptions 92 /tmp/bb-light-${s}.png --out blobbies-mark-light-${s}.jpg
done
```

## Usage notes

- **Minimum size:** don't render the mark below 16px — the eyes and smile stop
  resolving. Below that, use a solid disk.
- **Clear space:** keep at least 12% of the mark's width free on every side
  (the padded exports already have this).
- **Don't** recolor the blob to a non-palette color, restroke the outline, add
  a drop shadow, or place the dark disk on a background with less than 3:1
  contrast against `#2f2f2f`.
- The mark is a **dark disk by design**. On dark backgrounds, either use the
  padded export with its own clear space, or ask for a light-backdrop variant
  rather than inverting the ink.
- **Never set the tile to `#2f2f2f`.** It is the disk's own colour, so the disk
  vanishes and the mark flattens into a square. Any coloured tile must contrast
  with `#2f2f2f`.
