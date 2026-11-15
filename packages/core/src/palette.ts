/**
 * The Blobbies palette. Flat, bright and friendly.
 * Every color is verified to read well against the near-black eyes (`#1c1c1c`)
 * and the dark gray backdrop (`#2f2f2f`), on light and dark pages.
 */
export const COLORS = {
  yellow: '#FFD43B',
  green: '#5FD068',
  sky: '#6CC8FF',
  coral: '#FF7B7B',
  lavender: '#B79CFF',
  peach: '#FFB074',
  mint: '#5EE0C0',
  pink: '#FF8FC7',
  orange: '#FFA64D',
} as const;

/** The palette in its canonical order, for indices and pickers. */
export const PALETTE: readonly string[] = Object.values(COLORS);

/** A named colour from the built-in palette. */
export type AvatarColor = keyof typeof COLORS;

export const BACKDROP_COLOR = '#2f2f2f';
export const INK_COLOR = '#1c1c1c';
export const BLUSH_COLOR = '#ff6fa5';
export const BLUSH_OPACITY = 0.45;
