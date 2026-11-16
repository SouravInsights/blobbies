import { describe, expect, it } from 'vitest';
import {
  COLUMNS,
  GRID_PADDING,
  LENS,
  LENS_PUSH,
  MAX_BLUR,
  ROWS,
  gridMetrics,
  lensCell,
  lensEffect,
  lookCells,
  wrapIndex,
} from '../src/picker.js';

/**
 * The Look Map is the shared picker contract. React consumes it today; a React
 * Native or SwiftUI picker must produce the same numbers, or the picker stops
 * feeling like the same product.
 */
describe('wrapIndex', () => {
  it('wraps negatives into range', () => {
    expect(wrapIndex(-1, 5)).toBe(4);
    expect(wrapIndex(-5, 5)).toBe(0);
    expect(wrapIndex(7, 5)).toBe(2);
  });
});

describe('lookCells', () => {
  it('draws the grid plus a one-cell buffer ring on every side', () => {
    expect(lookCells(0, 0, 5, 3)).toHaveLength((COLUMNS + 2) * (ROWS + 2));
  });

  it('maps colour and mood with wrapping', () => {
    const cells = lookCells(0, 0, 5, 3);
    const at = (column: number, row: number): { color: number; expression: number } => {
      const cell = cells.find((c) => c.column === column && c.row === row);
      if (!cell) throw new Error(`no cell ${column},${row}`);
      return cell;
    };
    expect(at(0, 0)).toMatchObject({ color: 0, expression: 0 });
    expect(at(-1, -1)).toMatchObject({ color: 4, expression: 2 });
    expect(at(5, 3)).toMatchObject({ color: 0, expression: 0 });
  });

  it('shifts with the world origin', () => {
    const centre = lookCells(1, 0, 5, 3).find((c) => c.column === 2 && c.row === 1);
    expect(centre?.color).toBe(3);
  });
});

describe('lensCell', () => {
  it('picks the centre slot, or its neighbour past the halfway point', () => {
    expect(lensCell(0, 0, 100)).toEqual({ column: 2, row: 1 });
    expect(lensCell(49, 49, 100)).toEqual({ column: 2, row: 1 });
    expect(lensCell(51, 51, 100)).toEqual({ column: 1, row: 0 });
  });
});

describe('lensEffect', () => {
  const base = {
    // size === pitch keeps the lens exactly on a cell centre, so the maths is
    // easy to reason about. Real pickers have a gap; that only scales these
    // numbers, it does not change their shape.
    pitch: 100,
    size: 100,
    offsetX: 0,
    offsetY: 0,
    push: true,
    spotlight: true,
  };

  it('leaves the focused cell fully open and still', () => {
    const effect = lensEffect({
      ...base,
      cell: { column: 2, row: 1 },
      lens: { column: 2, row: 1 },
    });
    expect(effect).toEqual({ dx: 0, dy: 0, opacity: 1, blur: 0 });
  });

  it('pushes neighbours away and dims them', () => {
    const effect = lensEffect({
      ...base,
      cell: { column: 3, row: 1 },
      lens: { column: 2, row: 1 },
    });
    expect(effect.dx).toBeGreaterThan(0);
    expect(effect.dy).toBe(0);
    expect(effect.dx).toBeLessThanOrEqual(LENS_PUSH);
    expect(effect.opacity).toBeLessThan(1);
    expect(effect.opacity).toBeGreaterThanOrEqual(0.7);
    expect(effect.blur).toBeGreaterThan(0);
    expect(effect.blur).toBeLessThanOrEqual(MAX_BLUR);
  });

  it('never pushes under reduced motion', () => {
    const effect = lensEffect({
      ...base,
      push: false,
      cell: { column: 3, row: 1 },
      lens: { column: 2, row: 1 },
    });
    expect(effect.dx).toBe(0);
    expect(effect.dy).toBe(0);
  });

  it('never blurs without the spotlight', () => {
    const effect = lensEffect({
      ...base,
      spotlight: false,
      cell: { column: 5, row: 3 },
      lens: { column: 2, row: 1 },
    });
    expect(effect.blur).toBe(0);
  });

  it('reaches zero push at the lens radius', () => {
    const effect = lensEffect({
      ...base,
      cell: { column: 2 + Math.round(LENS), row: 1 },
      lens: { column: 2, row: 1 },
    });
    expect(effect.dx).toBe(0);
    expect(effect.opacity).toBeGreaterThanOrEqual(0.7);
  });
});

describe('gridMetrics', () => {
  it('fits the whole grid inside the width it is given', () => {
    for (const width of [320, 375, 460, 768]) {
      const { cell, gap } = gridMetrics(width);
      const used =
        COLUMNS * cell + (COLUMNS - 1) * gap + GRID_PADDING * 2;
      expect(used).toBeLessThanOrEqual(width);
      expect(cell).toBeGreaterThanOrEqual(24);
    }
  });

  it('grows the cell with the width, up to the ceiling', () => {
    expect(gridMetrics(320).cell).toBeLessThan(gridMetrics(460).cell);
    expect(gridMetrics(2000).cell).toBe(78);
  });
});
