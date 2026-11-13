import { INK_COLOR } from './palette.js';

/**
 * Hand-authored glyphs for A–Z and 0–9.
 *
 * Grid: 24 wide × 24 tall, cap height ≈ 20 (y 2→22), letter width ≈ 16
 * (x 4→20). Strokes are drawn with **flat (butt) caps** and a lighter weight
 * (~0.22 × cap height) so the forms read like a heavy grotesque sans — matching
 * the reference — rather than a rounded marker pen.
 *
 * No fonts are used.
 */
export const LETTER_PATHS: Readonly<Record<string, string>> = {
  A: 'M4 22 L12 2 L20 22 M6.6 15.5 H17.4',
  B: 'M5 22 V2 M5 2 H13.5 A5 5 0 0 1 13.5 12 H5 M5 12 H15 A5 5 0 0 1 15 22 H5',
  C: 'M20 7.5 A9 9.7 0 1 0 20 16.5',
  D: 'M5 22 V2 M5 2 H12 A10 10 0 0 1 12 22 H5',
  E: 'M19 2 H5 V22 H19 M5 12 H16',
  F: 'M19 2 H5 V22 M5 12 H16',
  G: 'M20 7.5 A9 9.7 0 1 0 20 16.5 V12.5 H13',
  H: 'M5 2 V22 M19 2 V22 M5 12 H19',
  I: 'M12 2 V22',
  J: 'M18 2 V15.5 A6.5 6.5 0 0 1 5 15.5',
  K: 'M5 2 V22 M19 3 L9 12 L19.5 22',
  L: 'M5 2 V22 H19',
  M: 'M5 22 V2 L12 13 L19 2 V22',
  N: 'M5 22 V2 L19 22 V2',
  O: 'M12 2 A8 10 0 1 0 12 22 A8 10 0 1 0 12 2',
  P: 'M5 22 V2 H13 A5 5 0 0 1 13 12 H5',
  Q: 'M12 2 A8 10 0 1 0 12 22 A8 10 0 1 0 12 2 M14.5 16.5 L20 22.5',
  R: 'M5 22 V2 H13 A5 5 0 0 1 13 12 H5 M11.5 12 L19 22',
  S: 'M18.5 7 C18.5 1.5 5.5 1.5 5.5 7.5 C5.5 12.5 18.5 11 18.5 16.5 C18.5 22.5 5.5 22.5 5.5 17.5',
  T: 'M4 2 H20 M12 2 V22',
  U: 'M5 2 V16 A7 6 0 0 0 19 16 V2',
  V: 'M4 2 L12 22 L20 2',
  W: 'M3 2 L7.25 22 L12 7 L16.75 22 L21 2',
  X: 'M5 2 L19 22 M19 2 L5 22',
  Y: 'M5 2 L12 12 M19 2 L12 12 M12 12 V22',
  Z: 'M5 2 H19 L5 22 H19',

  '0': 'M12 2 A8 10 0 1 0 12 22 A8 10 0 1 0 12 2',
  '1': 'M8.5 6.5 L12 3 V22 M6.5 22 H17.5',
  '2': 'M5.5 7 C5.5 0.5 18.5 0.5 18.5 8 C18.5 13 5.5 16.5 5.5 22 H19',
  '3': 'M5.5 6.5 C5.5 1 18.5 1.5 18.5 7.5 C18.5 11 14 11.8 12 12 C15 12.2 19 13.5 19 17 C19 22.5 5.5 23 5.5 17.5',
  '4': 'M16.5 22 V2 L5 15.5 H19',
  '5': 'M18.5 2 H7 L6 11 C8.5 9.5 19 9 19 16.5 C19 22.5 5.5 23 5.5 17.5',
  '6': 'M18 5 C11 2.5 5.5 8 5.5 15 A6.5 6.5 0 1 0 18.5 15 A6.5 6.5 0 1 0 5.5 15',
  '7': 'M5 2 H19 L9 22',
  '8': 'M12 2 A5 4.8 0 1 1 12 11.5 A5 4.8 0 1 1 12 2 M12 11.5 A6 5.5 0 1 0 12 22 A6 5.5 0 1 0 12 11.5',
  '9': 'M18 14 C18 7 13 2.5 8.5 5 M6 11.5 A5.5 5.5 0 1 1 17 11.5 A5.5 5.5 0 1 1 6 11.5 M18 12.5 C18 19 15 22.5 8.5 22.5',
};

export const LETTER_BOX = { width: 24, height: 24 } as const;
/** Visual weight: ~0.22 × cap height, like a heavy grotesque. */
export const STROKE_WIDTH = 4.5;
/** Nominal centreline ink width inside the box (used to space the eyes). */
export const INK_WIDTH = 16;

/** True when the character has a hand-authored path. */
export function hasLetterPath(char: string): boolean {
  return Object.prototype.hasOwnProperty.call(LETTER_PATHS, char);
}

/**
 * Render a single eye glyph. Characters outside A–Z / 0–9 fall back to a bold
 * <text> element so non-Latin names still get a sensible avatar.
 */
export function renderLetter(
  char: string,
  opts: { x: number; y: number; scale: number },
): string {
  const { x, y, scale } = opts;
  const transform = `translate(${round(x)} ${round(y)}) scale(${round(scale, 4)})`;
  const body = hasLetterPath(char)
    ? `<path d="${LETTER_PATHS[char]}" fill="none" stroke="${INK_COLOR}" stroke-width="${STROKE_WIDTH}" stroke-linecap="butt" stroke-linejoin="round"/>`
    : `<text x="12" y="21" text-anchor="middle" font-family="ui-rounded, 'Nunito', 'Segoe UI', system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="${INK_COLOR}">${escapeXml(char)}</text>`;

  // Positioning transform sits on the outer group; the inner `.bb-eye` group is
  // left transform-free so the CSS blink can scale it about its own center
  // without fighting the positioning transform.
  return `<g transform="${transform}"><g class="bb-eye">${body}</g></g>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Trim float noise so generated markup stays tiny and stable. */
export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
