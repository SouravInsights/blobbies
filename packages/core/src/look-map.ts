/**
 * The Look Map: the pure geometry behind the avatar picker.
 *
 * The grid is a window onto a map of looks — columns are colours, rows are
 * moods — and the map wraps in both directions, so it never ends. Dragging,
 * swiping or the arrow keys move the world under a fixed lens; the faces
 * nearest the lens are full size, and the ones moving away shrink and fade.
 *
 * Framework-free. The React picker consumes it today; a `<blobbies-picker>`
 * web component can reuse the *same* numbers, so the picker feels the same on
 * every web framework.
 */

export const COLUMNS = 5;
export const ROWS = 3;
export const CENTER_COLUMN = 2;
export const CENTER_ROW = 1;

/** Floor and ceiling for the measured cell and gap, so a phone still fits. */
export const MIN_GAP = 4;
export const MAX_GAP = 8;
export const MIN_CELL = 24;
export const MAX_CELL = 78;

/** The lens: reach, blur ceiling, and how far neighbours push away. */
export const LENS = 2.6;
export const MAX_BLUR = 3.2;
export const LENS_PUSH = 6;

/** Padding from the surface edge to the visible grid. */
export const GRID_PADDING = 8;

function wrap(n: number, size: number): number {
  return ((Math.trunc(n) % size) + size) % size;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Wrap an index into `0..size-1`, including negative indices. */
export function wrapIndex(n: number, size: number): number {
  return wrap(n, size);
}

export interface CellIndex {
  column: number;
  row: number;
}

export interface LookCell extends CellIndex {
  key: string;
  color: number;
  expression: number;
}

/**
 * Every cell in the drawn window, including the one-cell buffer ring that waits
 * just outside the visible grid so a pan never shows an empty edge.
 */
export function lookCells(
  originColumn: number,
  originRow: number,
  paletteSize: number,
  expressionCount: number,
): LookCell[] {
  const cells: LookCell[] = [];
  for (let row = -1; row <= ROWS; row++) {
    for (let column = -1; column <= COLUMNS; column++) {
      cells.push({
        key: `${column}:${row}`,
        column,
        row,
        color: wrap(originColumn + column, paletteSize),
        expression: wrap(originRow + row, expressionCount),
      });
    }
  }
  return cells;
}

/** Which slot the lens sits over, given the world offset within one pitch. */
export function lensCell(offsetX: number, offsetY: number, pitch: number): CellIndex {
  return {
    column: offsetX < pitch / 2 ? CENTER_COLUMN : CENTER_COLUMN - 1,
    row: offsetY < pitch / 2 ? CENTER_ROW : CENTER_ROW - 1,
  };
}

export interface LensOptions {
  /** The cell being positioned. */
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

export interface LensState {
  dx: number;
  dy: number;
  opacity: number;
  blur: number;
}

/**
 * A cell's lens response, from its *screen* distance to the lens, so the fade
 * is continuous rather than snapping cell by cell.
 */
export function lensEffect(options: LensOptions): LensState {
  const { cell, lens, pitch, size, offsetX, offsetY, push, spotlight } = options;
  const lensX = (lens.column + 0.5) * pitch + offsetX;
  const lensY = (lens.row + 0.5) * pitch + offsetY;
  const cellX = cell.column * pitch + offsetX + size / 2;
  const cellY = cell.row * pitch + offsetY + size / 2;
  const dxRaw = cellX - lensX;
  const dyRaw = cellY - lensY;
  const distance = Math.hypot(dxRaw, dyRaw) / pitch;
  const t = Math.min(1, distance / LENS);
  const fall = 1 - t * t;

  let dx = 0;
  let dy = 0;
  if (distance >= 1e-3) {
    const length = Math.hypot(dxRaw, dyRaw) || 1;
    const amount = push ? fall * LENS_PUSH : 0;
    dx = (dxRaw / length) * amount;
    dy = (dyRaw / length) * amount;
  }

  const opacity = distance < 1e-3 ? 1 : 0.7 + 0.3 * fall;
  const blur = spotlight && distance >= 1e-3 ? Math.min(MAX_BLUR, t * MAX_BLUR) : 0;
  return { dx, dy, opacity, blur };
}

export interface GridMetrics {
  /** Size of one cell, in pixels. */
  cell: number;
  /** Gap between cells, in pixels. */
  gap: number;
  /** Padding from the host edge to the surface, in pixels. */
  inset: number;
}

/**
 * Size the grid to the width it actually has. The cell and the gap are measured
 * from the host, not fixed: the whole grid has to fit the same box on a phone as
 * on a laptop, with a small floor so the initials stay legible.
 */
export function gridMetrics(availableWidth: number): GridMetrics {
  const inset = Math.min(16, Math.max(6, Math.round(availableWidth * 0.03)));
  const gap = clamp(Math.round(availableWidth * 0.02), MIN_GAP, MAX_GAP);
  const cell = clamp(
    Math.floor(
      (availableWidth - inset * 2 - GRID_PADDING * 2 - (COLUMNS - 1) * gap) / COLUMNS,
    ),
    MIN_CELL,
    MAX_CELL,
  );
  return { cell, gap, inset };
}
