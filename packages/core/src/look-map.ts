/**
 * The Look Map: the pure geometry behind the avatar picker.
 *
 * The grid is a window onto a map of looks — columns are colours, rows are
 * moods — and the map wraps in both directions, so it never ends. Dragging,
 * swiping or the arrow keys move the world under a fixed lens; the faces
 * nearest the lens are full size, and the ones moving away shrink and fade.
 *
 * This module is framework-free. The React picker consumes it today; a React
 * Native or SwiftUI picker must produce the *same* numbers, so the feel is the
 * same everywhere. Nothing here touches the DOM.
 */

export const COLS = 5;
export const ROWS = 3;
export const CENTER_I = 2;
export const CENTER_J = 1;

/** Floor/ceiling for the measured cell and gap, so a phone still fits. */
export const MIN_GAP = 4;
export const MAX_GAP = 8;
export const MIN_CELL = 24;
export const MAX_CELL = 78;

/** The lens: reach, blur ceiling, and how far neighbours push away. */
export const LENS = 2.6;
export const MAX_BLUR = 3.2;
export const PUSH = 6;

/** Padding from the surface edge to the visible grid. */
export const PAD = 8;

export function mod(n: number, m: number): number {
  return ((Math.trunc(n) % m) + m) % m;
}

export function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v));
}

export interface CellIndex {
  i: number;
  j: number;
}

export interface LookCell extends CellIndex {
  key: string;
  color: number;
  expression: number;
}

/**
 * Every cell in the drawn window, including the one-cell buffer ring that
 * waits just outside the visible grid so a pan never shows an empty edge.
 */
export function lookCells(
  originX: number,
  originY: number,
  paletteSize: number,
  expressionCount: number,
): LookCell[] {
  const out: LookCell[] = [];
  for (let j = -1; j <= ROWS; j++) {
    for (let i = -1; i <= COLS; i++) {
      out.push({
        key: `${i}:${j}`,
        i,
        j,
        color: mod(originX + i, paletteSize),
        expression: mod(originY + j, expressionCount),
      });
    }
  }
  return out;
}

/** Which slot the lens sits over, given the world offset within one pitch. */
export function centeredCell(offsetX: number, offsetY: number, pitch: number): CellIndex {
  return {
    i: offsetX < pitch / 2 ? CENTER_I : CENTER_I - 1,
    j: offsetY < pitch / 2 ? CENTER_J : CENTER_J - 1,
  };
}

export interface LensInput {
  /** The cell slot being positioned. */
  cell: CellIndex;
  /** The slot the lens sits over. */
  lens: CellIndex;
  pitch: number;
  size: number;
  offsetX: number;
  offsetY: number;
  /** Push neighbours away from the lens (off under reduced motion). */
  push: boolean;
  /** Blur the cells moving away from the lens. */
  spotlight: boolean;
}

export interface LensResult {
  dx: number;
  dy: number;
  opacity: number;
  blur: number;
}

/**
 * A cell's lens response, computed from its *screen* distance to the lens so
 * the fade is continuous rather than snapping cell by cell.
 */
export function lensEffect(input: LensInput): LensResult {
  const { cell, lens, pitch, size, offsetX, offsetY, push, spotlight } = input;
  const lx = (lens.i + 0.5) * pitch + offsetX;
  const ly = (lens.j + 0.5) * pitch + offsetY;
  const sx = cell.i * pitch + offsetX + size / 2;
  const sy = cell.j * pitch + offsetY + size / 2;
  const dxRaw = sx - lx;
  const dyRaw = sy - ly;
  const d = Math.hypot(dxRaw, dyRaw) / pitch;
  const t = Math.min(1, d / LENS);
  const fall = 1 - t * t;

  let dx = 0;
  let dy = 0;
  if (d >= 1e-3) {
    const len = Math.hypot(dxRaw, dyRaw) || 1;
    const amount = push ? fall * PUSH : 0;
    dx = (dxRaw / len) * amount;
    dy = (dyRaw / len) * amount;
  }

  const opacity = d < 1e-3 ? 1 : 0.7 + 0.3 * fall;
  const blur = spotlight && d >= 1e-3 ? Math.min(MAX_BLUR, t * MAX_BLUR) : 0;
  return { dx, dy, opacity, blur };
}
