import { BACKDROP_COLOR, BLUSH_COLOR, BLUSH_OPACITY, INK_COLOR } from './palette.js';
import { range } from './hash.js';
import { renderLetter, LETTER_BOX, INK_WIDTH, STROKE_WIDTH } from './letters.js';

/** Layout constants for the 100×100 viewBox. */
export const LAYOUT = {
  // The dark disk is the outer, complete circle. The colored egg always stays
  // inside it, so nothing ever pokes out or gets clipped.
  backdrop: { cx: 50, cy: 50, r: 50 },
  // The colored blob is a soft egg inside the disk, bottom near the disk bottom.
  blob: { cx: 50, bottom: 99.4 },
  // The face lives inside the blob and stays put while the features animate.
  // Sized to match the references: ~22 tall, ~50 wide, centred at y ≈ 56.
  eyes: { cx: 49.5, cy: 56.2, scale: 1.1, visualGap: 5 },
  mouth: { cx: 50, cy: 78 },
  cheeks: [
    { cx: 24, cy: 70, rx: 6.5, ry: 4.8 },
    { cx: 76, cy: 70, rx: 6.5, ry: 4.8 },
  ],
} as const;

/** Seeded per-avatar decisions. Field order must stay stable forever. */
export interface BlobTraits {
  color: string;
  shapeIndex: number;
  rotate: number;
  offsetX: number;
  offsetY: number;
  mouthIndex: number;
  cheeks: boolean;
  backdropDir: number;
}

export interface DecideInput {
  rng: () => number;
  palette: readonly string[];
}

/**
 * Soft egg/blob shapes. All share the same egg curve that was fitted to the
 * reference profile (narrower dome on top, wider rounded bottom); they differ
 * in aspect ratio, like the references do.
 */
const SHAPES: ReadonlyArray<{ rx: number; ry: number; eb: number }> = [
  { rx: 39, ry: 39.6, eb: 0.3 }, // tall
  { rx: 43.5, ry: 38, eb: 0.28 }, // wide
  { rx: 44, ry: 37.7, eb: 0.27 }, // widest
  { rx: 40.2, ry: 38.8, eb: 0.3 }, // near-round
  { rx: 41.5, ry: 39, eb: 0.28 }, // mid
];

export function decideTraits({ rng, palette }: DecideInput): BlobTraits {
  const color = palette[Math.floor(rng() * palette.length) % palette.length] as string;
  const shapeIndex = Math.floor(rng() * SHAPES.length);
  const rotate = range(rng, -3, 3);
  const offsetX = range(rng, -1, 1);
  const offsetY = range(rng, -0.35, 0.35);
  const mouthIndex = Math.floor(rng() * MOUTHS.length);
  const cheeks = rng() < 0.5;
  const backdropDir = Math.floor(rng() * 4);
  return { color, shapeIndex, rotate, offsetX, offsetY, mouthIndex, cheeks, backdropDir };
}

/**
 * Four diagonal directions for the blob nudge (the disk itself stays centred,
 * like the references). Small enough to keep the blob inside the disk.
 */
const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [-1, -0.35],
  [1, -0.35],
  [-1, 0.35],
  [1, 0.35],
];

export function renderBackdrop(_dir: number): string {
  const { cx, cy, r } = LAYOUT.backdrop;
  return `<g class="bb-backdrop"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${BACKDROP_COLOR}"/></g>`;
}

/** Egg curve fitted to the reference coloured-layer width profile. */
function eggPath(rx: number, ry: number, eb: number): string {
  const wy = ry * eb; // widest point, below centre
  const top = -ry;
  const bot = ry;
  const ctlTop = wy + (top - wy) * 0.7;
  const ctlBot = wy + (bot - wy) * 0.55;
  const kxt = 0.5;
  const kxb = 0.55;
  return (
    `M${r(rx)} ${r(wy)}` +
    `C${r(rx)} ${r(ctlTop)} ${r(rx * kxt)} ${r(top)} 0 ${r(top)}` +
    `C${r(-rx * kxt)} ${r(top)} ${r(-rx)} ${r(ctlTop)} ${r(-rx)} ${r(wy)}` +
    `C${r(-rx)} ${r(ctlBot)} ${r(-rx * kxb)} ${r(bot)} 0 ${r(bot)}` +
    `C${r(rx * kxb)} ${r(bot)} ${r(rx)} ${r(ctlBot)} ${r(rx)} ${r(wy)}Z`
  );
}

function shapeOf(traits: BlobTraits): { rx: number; ry: number; eb: number } {
  return SHAPES[traits.shapeIndex % SHAPES.length] as { rx: number; ry: number; eb: number };
}

export function renderBlob(traits: BlobTraits, clipId?: string): string {
  const shape = shapeOf(traits);
  const [dx, dy] = DIRECTIONS[traits.backdropDir % DIRECTIONS.length] as readonly [
    number,
    number,
  ];
  const tx = round(LAYOUT.blob.cx + dx + traits.offsetX);
  const ty = round(LAYOUT.blob.bottom - shape.ry + dy + traits.offsetY);
  const rot = round(traits.rotate);
  const cheeks = traits.cheeks ? renderCheeks(ty) : '';
  const clip = clipId ? ` clip-path="url(#${clipId})"` : '';
  return (
    `<g class="bb-blob"${clip}><g transform="translate(${tx} ${ty}) rotate(${rot})">` +
    `<path d="${eggPath(shape.rx, shape.ry, shape.eb)}" fill="${traits.color}"/>` +
    cheeks +
    `</g></g>`
  );
}

/** The clip that keeps the coloured layer inside the dark disk. */
export function renderDiskClip(id: string): string {
  const { cx, cy, r } = LAYOUT.backdrop;
  return `<defs><clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>`;
}

function renderCheeks(blobCy: number): string {
  return LAYOUT.cheeks
    .map(
      (c) =>
        `<ellipse cx="${round(c.cx - LAYOUT.blob.cx)}" cy="${round(c.cy - blobCy)}" rx="${c.rx}" ry="${c.ry}" fill="${BLUSH_COLOR}" opacity="${BLUSH_OPACITY}"/>`,
    )
    .join('');
}

type Mouth =
  | { half: readonly [number, number] } // filled half-ellipse (open smile)
  | { circle: readonly [number, number, number] }
  | { d: string; width: number };

const MOUTHS: ReadonlyArray<Mouth> = [
  { half: [9.5, 6] }, // open smile (filled)
  { half: [11.5, 8] }, // big grin (filled)
  { circle: [0, 2, 3.4] }, // small "o"
  { d: 'M-8 1 Q1 8 8 -1', width: 4 }, // smirk
  { d: 'M-8 2 H8', width: 4 }, // flat
];

export function renderMouth(index: number): string {
  const mouth = MOUTHS[index % MOUTHS.length] as Mouth;
  const { cx, cy } = LAYOUT.mouth;
  let body: string;
  if ('half' in mouth) {
    const [rx, ry] = mouth.half;
    body = `<path transform="translate(${cx} ${cy})" d="M${-rx} 0 A${rx} ${ry} 0 0 0 ${rx} 0 Z" fill="${INK_COLOR}"/>`;
  } else if ('circle' in mouth) {
    body = `<circle cx="${cx + mouth.circle[0]}" cy="${cy + mouth.circle[1]}" r="${mouth.circle[2]}" fill="${INK_COLOR}"/>`;
  } else {
    body = `<path transform="translate(${cx} ${cy})" d="${mouth.d}" fill="none" stroke="${INK_COLOR}" stroke-width="${mouth.width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return `<g class="bb-mouth">${body}</g>`;
}

export function renderEyes(letters: string): string {
  const { cx, cy, scale, visualGap } = LAYOUT.eyes;
  const boxW = LETTER_BOX.width * scale;
  const boxH = LETTER_BOX.height * scale;
  // Account for the empty padding around the ink so `visualGap` is the gap a
  // viewer actually sees between the two eyes.
  const padding = LETTER_BOX.width - (INK_WIDTH + STROKE_WIDTH);
  const gap = visualGap - padding * scale;
  const single = letters.length < 2;
  const total = single ? boxW : boxW * 2 + gap;
  const left = cx - total / 2;
  const top = cy - boxH / 2;

  const cells: string[] = [];
  cells.push(renderLetter(letters[0] ?? '?', { x: left, y: top, scale }));
  if (!single) {
    cells.push(renderLetter(letters[1] as string, { x: left + boxW + gap, y: top, scale }));
  }
  return `<g class="bb-eyes">${cells.join('')}</g>`;
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** alias used by the bezier builder above */
const r = round;

/* ------------------------------------------------------------------ *
 * Geometry helpers (used by tests to guarantee nothing pokes out or  *
 * gets clipped by the viewBox).                                      *
 * ------------------------------------------------------------------ */

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Bounding box of the dark disk. */
export function backdropBounds(): Bounds {
  const { cx, cy, r: radius } = LAYOUT.backdrop;
  return { minX: cx - radius, maxX: cx + radius, minY: cy - radius, maxY: cy + radius };
}

/** Transform used to place the blob for the given traits. */
function blobTransform(traits: BlobTraits): { tx: number; ty: number; rot: number } {
  const shape = shapeOf(traits);
  const [dx, dy] = DIRECTIONS[traits.backdropDir % DIRECTIONS.length] as readonly [
    number,
    number,
  ];
  return {
    tx: LAYOUT.blob.cx + dx + traits.offsetX,
    ty: LAYOUT.blob.bottom - shape.ry + dy + traits.offsetY,
    rot: traits.rotate,
  };
}

/** Sample the blob outline (for containment checks). */
export function blobOutline(traits: BlobTraits, perSegment = 24): Array<[number, number]> {
  const shape = shapeOf(traits);
  const { tx, ty, rot } = blobTransform(traits);
  const a = (rot * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const { rx, ry, eb } = shape;
  const wy = ry * eb;
  const top = -ry;
  const bot = ry;
  const ctlTop = wy + (top - wy) * 0.7;
  const ctlBot = wy + (bot - wy) * 0.55;
  const kxt = 0.5;
  const kxb = 0.55;
  type Pt = [number, number];
  type Seg = [Pt, Pt, Pt, Pt];
  const segs: Seg[] = [
    [
      [rx, wy],
      [rx, ctlTop],
      [rx * kxt, top],
      [0, top],
    ],
    [
      [0, top],
      [-rx * kxt, top],
      [-rx, ctlTop],
      [-rx, wy],
    ],
    [
      [-rx, wy],
      [-rx, ctlBot],
      [-rx * kxb, bot],
      [0, bot],
    ],
    [
      [0, bot],
      [rx * kxb, bot],
      [rx, ctlBot],
      [rx, wy],
    ],
  ];
  const out: Array<[number, number]> = [];
  for (const seg of segs) {
    const p0 = seg[0];
    const p1 = seg[1];
    const p2 = seg[2];
    const p3 = seg[3];
    for (let i = 0; i < perSegment; i++) {
      const t = i / perSegment;
      const u = 1 - t;
      const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
      const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
      out.push([tx + x * cos - y * sin, ty + x * sin + y * cos]);
    }
  }
  return out;
}

export function blobBounds(traits: BlobTraits): Bounds {
  const pts = blobOutline(traits);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}
