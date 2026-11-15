import { BACKDROP_COLOR, BLUSH_COLOR, BLUSH_OPACITY, INK_COLOR } from './palette.js';
import { range } from './hash.js';
import { renderLetter, LETTER_BOX, INK_WIDTH, STROKE_WIDTH } from './letters.js';
import type { AvatarExpression, AvatarOptions, AvatarShape } from './types.js';

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
const SHAPE_GEOMETRY: ReadonlyArray<{ rx: number; ry: number; eb: number }> = [
  { rx: 39, ry: 39.6, eb: 0.3 }, // tall
  { rx: 43.5, ry: 38, eb: 0.28 }, // wide
  { rx: 44, ry: 37.7, eb: 0.27 }, // widest
  { rx: 40.2, ry: 38.8, eb: 0.3 }, // near-round
  { rx: 41.5, ry: 39, eb: 0.28 }, // mid
];

/** The egg shapes, by name — the values `shape` accepts. */
export const SHAPES: readonly AvatarShape[] = ['tall', 'wide', 'squat', 'round', 'mid'];

export function decideTraits({ rng, palette }: DecideInput): BlobTraits {
  const color = palette[Math.floor(rng() * palette.length) % palette.length] as string;
  const shapeIndex = Math.floor(rng() * SHAPE_GEOMETRY.length);
  const rotate = range(rng, -3, 3);
  const offsetX = range(rng, -1, 1);
  const offsetY = range(rng, -0.35, 0.35);
  const mouthIndex = Math.floor(rng() * EXPRESSION_DEFS.length);
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
  return SHAPE_GEOMETRY[traits.shapeIndex % SHAPE_GEOMETRY.length] as { rx: number; ry: number; eb: number };
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
  | { half: readonly [number, number]; tongue?: boolean } // filled half-ellipse (open smile)
  | { circle: readonly [number, number, number] }
  | { ellipse: readonly [number, number, number, number] } // dx, dy, rx, ry
  | { d: string; width: number; tongue?: boolean };

type BrowStyle =
  | 'none'
  | 'flat'
  | 'raised'
  | 'angry'
  | 'sad'
  | 'cocky'
  | 'confused'
  | 'determined'
  | 'worried'
  | 'annoyed';

interface Expression {
  /** Human name, for pickers and screen readers. */
  name: string;
  mouth: Mouth;
  brow: BrowStyle;
  /** Nudge the eyes off-centre, in viewBox units — a side-eye or a glance. */
  eye?: readonly [number, number];
  /** Close one eye — a wink, not a blink. */
  squint?: 'l' | 'r';
}

/**
 * An expression is a mouth **and** the brows that carry the feeling — a frown
 * on its own is just a frown, but a frown under angry brows is a mood. The set
 * moves from open and friendly through quiet attitude to the louder moods, so
 * a grid of them reads as a room of people rather than one face repeated.
 *
 * Eyes are letters and never change, so the brows and the mouth do the acting.
 */
/**
 * Interleaved on purpose: the map shows consecutive expressions as rows, so
 * any three neighbouring rows need to read as three different moods. Grouping
 * all the smiles together would make the map look like one face repeated.
 */
const EXPRESSION_DEFS: ReadonlyArray<Expression> = [
  { name: 'Smile', mouth: { d: 'M-6.5 1 Q0 4.5 6.5 1', width: 4 }, brow: 'none' },
  { name: 'Smirk', mouth: { d: 'M-7 2 Q0 4.5 7 -1.5', width: 4 }, brow: 'none' },
  { name: 'Sad', mouth: { d: 'M-7 4 Q0 -3 7 4', width: 4 }, brow: 'sad' },
  { name: 'Wink', mouth: { d: 'M-6.5 1 Q0 4.5 6.5 1', width: 4 }, brow: 'none', squint: 'r' },
  { name: 'Angry', mouth: { d: 'M-9 4 Q0 -5 9 4', width: 4 }, brow: 'angry' },
  { name: 'Cat', mouth: { d: 'M-9 2 Q-4.5 7 0 2 Q4.5 7 9 2', width: 3.6 }, brow: 'none' },
  { name: 'Shy', mouth: { d: 'M-6.5 1 Q0 4.5 6.5 1', width: 4 }, brow: 'none', eye: [0, 1.8] },
  { name: 'Annoyed', mouth: { d: 'M-8 2 H8', width: 4 }, brow: 'annoyed' },
  { name: 'Laugh', mouth: { half: [10.5, 7] }, brow: 'raised' },
  { name: 'Smug', mouth: { d: 'M-7 2 Q0 4.5 7 -1.5', width: 4 }, brow: 'cocky' },
  { name: 'Confused', mouth: { d: 'M-9 3 Q-4.5 0 0 3 T9 3', width: 3.6 }, brow: 'confused' },
  { name: 'Cheeky', mouth: { half: [10.5, 6.5], tongue: true }, brow: 'cocky' },
  { name: 'Surprised', mouth: { circle: [0, 2, 3.4] }, brow: 'raised' },
  { name: 'Coy', mouth: { d: 'M-7 2 Q0 4.5 7 -1.5', width: 4 }, brow: 'cocky', eye: [-2.6, 0.8] },
  { name: 'Determined', mouth: { d: 'M-8 2 H8', width: 4 }, brow: 'determined' },
  { name: 'Beam', mouth: { half: [11.5, 8] }, brow: 'none' },
  { name: 'Side-eye', mouth: { d: 'M-7 2 Q0 4.5 7 -1.5', width: 4 }, brow: 'flat', eye: [2.6, 0] },
  { name: 'Pout', mouth: { d: 'M-4 4 Q0 1 4 4', width: 4 }, brow: 'worried' },
  { name: 'Shocked', mouth: { ellipse: [0, 2, 2.8, 4.8] }, brow: 'raised' },
  { name: 'Unimpressed', mouth: { d: 'M-8 2 H8', width: 4 }, brow: 'cocky' },
  { name: 'Grin', mouth: { half: [9.5, 6] }, brow: 'none' },
  { name: 'Smoulder', mouth: { d: 'M-6.5 1 Q0 4.5 6.5 1', width: 4 }, brow: 'determined' },
];

/** The expressions, by name — the values `expression` accepts. */
export const EXPRESSIONS: readonly AvatarExpression[] = [
  'smile', 'smirk', 'sad', 'wink', 'angry', 'cat', 'shy', 'annoyed', 'laugh', 'smug',
  'confused', 'cheeky', 'surprised', 'coy', 'determined', 'beam', 'side-eye', 'pout',
  'shocked', 'unimpressed', 'grin', 'smoulder',
];

/** Names and counts, so a picker can label the choices it offers. */
export const EXPRESSION_NAMES: readonly string[] = EXPRESSION_DEFS.map((e) => e.name);
export const EXPRESSION_COUNT = EXPRESSION_DEFS.length;
export const SHAPE_COUNT = SHAPE_GEOMETRY.length;

export function renderMouth(index: number): string {
  const mouth = (EXPRESSION_DEFS[index % EXPRESSION_DEFS.length] as Expression).mouth;
  const { cx, cy } = LAYOUT.mouth;
  let body: string;
  if ('half' in mouth) {
    const [rx, ry] = mouth.half;
    body = `<path transform="translate(${cx} ${cy})" d="M${-rx} 0 A${rx} ${ry} 0 0 0 ${rx} 0 Z" fill="${INK_COLOR}"/>`;
    if (mouth.tongue) {
      // An open mouth with a tongue filling its lower half and poking out.
      body += `<path transform="translate(${cx} ${cy})" d="M-3.8 2.5 Q0 13 3.8 2.5 Z" fill="${BLUSH_COLOR}"/>`;
    }
  } else if ('circle' in mouth) {
    body = `<circle cx="${cx + mouth.circle[0]}" cy="${cy + mouth.circle[1]}" r="${mouth.circle[2]}" fill="${INK_COLOR}"/>`;
  } else if ('ellipse' in mouth) {
    const [dx, dy, rx, ry] = mouth.ellipse;
    body = `<ellipse cx="${cx + dx}" cy="${cy + dy}" rx="${rx}" ry="${ry}" fill="${INK_COLOR}"/>`;
  } else {
    body = `<path transform="translate(${cx} ${cy})" d="${mouth.d}" fill="none" stroke="${INK_COLOR}" stroke-width="${mouth.width}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (mouth.tongue) {
      body += `<path transform="translate(${cx} ${cy})" d="M-2.7 2 Q0 8.4 2.7 2 Z" fill="${BLUSH_COLOR}"/>`;
    }
  }
  return `<g class="bb-mouth">${body}</g>`;
}

/** Eye geometry, shared by the letters and the brows above them. */
function eyeLayout(letters: string, shift?: readonly [number, number]): {
  boxW: number;
  gap: number;
  left: number;
  top: number;
  single: boolean;
  centers: number[];
} {
  const { cx, cy, scale, visualGap } = LAYOUT.eyes;
  const boxW = LETTER_BOX.width * scale;
  const boxH = LETTER_BOX.height * scale;
  // Account for the empty padding around the ink so `visualGap` is the gap a
  // viewer actually sees between the two eyes.
  const padding = LETTER_BOX.width - (INK_WIDTH + STROKE_WIDTH);
  const gap = visualGap - padding * scale;
  const single = letters.length < 2;
  const total = single ? boxW : boxW * 2 + gap;
  const left = cx - total / 2 + (shift ? shift[0] : 0);
  const top = cy - boxH / 2 + (shift ? shift[1] : 0);
  const centers = single
    ? [left + boxW / 2]
    : [left + boxW / 2, left + boxW + gap + boxW / 2];
  return { boxW, gap, left, top, single, centers };
}

export function renderEyes(letters: string, index?: number): string {
  const expr =
    typeof index === 'number'
      ? (EXPRESSION_DEFS[index % EXPRESSION_DEFS.length] as Expression)
      : undefined;
  const { boxW, gap, left, top, single } = eyeLayout(letters, expr?.eye);
  const { scale } = LAYOUT.eyes;
  const boxH = LETTER_BOX.height * scale;

  const eyeAt = (char: string, x: number, side: 'l' | 'r'): string => {
    const cell = renderLetter(char, { x, y: top, scale });
    if (!expr || expr.squint !== side) {
      return cell;
    }
    // A wink is a static squint about this eye's own centre; the blink's own
    // scaleY lives on the inner `.bb-eye`, so the two compose cleanly.
    const cx = x + boxW / 2;
    const cy = top + boxH / 2;
    return (
      `<g transform="translate(${round(cx)} ${round(cy)}) scale(1 0.4) translate(${round(-cx)} ${round(-cy)})">` +
      `${cell}</g>`
    );
  };

  const cells: string[] = [];
  cells.push(eyeAt(letters[0] ?? '?', left, 'l'));
  if (!single) {
    cells.push(eyeAt(letters[1] as string, left + boxW + gap, 'r'));
  }
  return `<g class="bb-eyes">${cells.join('')}</g>`;
}

/** One brow above one eye. `side` decides which way it leans. */
function browPath(style: BrowStyle, ex: number, y: number, side: 'l' | 'r'): string {
  const h = 5;
  const inner = side === 'l' ? ex + h : ex - h;
  const outer = side === 'l' ? ex - h : ex + h;
  switch (style) {
    case 'flat':
      return `M${ex - h} ${y}L${ex + h} ${y}`;
    case 'raised':
      return `M${ex - h} ${y + 1}Q${ex} ${y - 3} ${ex + h} ${y + 1}`;
    case 'angry':
      return `M${outer} ${y - 2.2}L${inner} ${y + 2.2}`;
    case 'determined':
      return `M${outer} ${y - 1.2}L${inner} ${y + 1.2}`;
    case 'annoyed':
      return `M${outer} ${y - 0.2}L${inner} ${y + 1.5}`;
    case 'sad':
    case 'worried':
      return `M${outer} ${y + 2.2}L${inner} ${y - 2.2}`;
    case 'cocky':
      return side === 'r'
        ? `M${ex - h} ${y + 1}Q${ex} ${y - 3.6} ${ex + h} ${y + 1}`
        : `M${ex - h} ${y}L${ex + h} ${y}`;
    case 'confused':
      return side === 'l'
        ? `M${ex - h} ${y + 1}Q${ex} ${y - 3.6} ${ex + h} ${y + 1}`
        : `M${ex - h} ${y - 2.2}L${ex + h} ${y + 2.2}`;
    default:
      return '';
  }
}

export function renderBrows(index: number, letters: string): string {
  const style = (EXPRESSION_DEFS[index % EXPRESSION_DEFS.length] as Expression).brow;
  if (style === 'none') {
    return '';
  }
  const { top, centers } = eyeLayout(letters, (EXPRESSION_DEFS[index % EXPRESSION_DEFS.length] as Expression).eye);
  // A real forehead between the letters and the brows, or they read as accent
  // marks on top of the glyphs rather than eyebrows above them.
  const y = top - 6;
  const body = centers
    .map((ex, i) => browPath(style, ex, y, i === 0 ? 'l' : 'r'))
    .filter(Boolean)
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="${INK_COLOR}" stroke-width="3.4" stroke-linecap="round"/>`,
    )
    .join('');
  return body ? `<g class="bb-brows">${body}</g>` : '';
}

/**
 * Apply an explicit look over the traits a name seeded. Only the fields the
 * look sets change; everything else keeps its seeded value. This is the bridge
 * that lets a picker offer real choices without giving up the name's eyes.
 */
export function applyLook(base: BlobTraits, overrides: AvatarOptions): BlobTraits {
  const shape = overrides.shape != null ? SHAPES.indexOf(overrides.shape) : -1;
  const mouth = overrides.expression != null ? EXPRESSIONS.indexOf(overrides.expression) : -1;
  return {
    ...base,
    color: overrides.color ?? base.color,
    shapeIndex: shape >= 0 ? shape : base.shapeIndex,
    rotate:
      overrides.tilt != null ? Math.max(-8, Math.min(8, overrides.tilt)) : base.rotate,
    mouthIndex: mouth >= 0 ? mouth : base.mouthIndex,
    cheeks: overrides.blush != null ? overrides.blush : base.cheeks,
  };
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
