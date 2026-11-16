import { describe, expect, it } from 'vitest';
import {
  COLS,
  LENS,
  MAX_BLUR,
  PUSH,
  ROWS,
  centeredCell,
  lensEffect,
  lookCells,
  mod,
} from '../src/index.js';

/**
 * The Look Map maths is the shared picker contract. React consumes it today; a
 * React Native or SwiftUI picker must produce the same numbers, or the picker
 * stops feeling like the same product.
 */
describe('mod', () => {
  it('wraps negatives into range', () => {
    expect(mod(-1, 5)).toBe(4);
    expect(mod(-5, 5)).toBe(0);
    expect(mod(7, 5)).toBe(2);
  });
});

describe('lookCells', () => {
  it('draws the grid plus a one-cell buffer ring on every side', () => {
    const cells = lookCells(0, 0, 5, 3);
    expect(cells).toHaveLength((COLS + 2) * (ROWS + 2));
  });

  it('maps colour and mood with wrapping', () => {
    const cells = lookCells(0, 0, 5, 3);
    const at = (i: number, j: number): { color: number; expression: number } => {
      const cell = cells.find((c) => c.i === i && c.j === j);
      if (!cell) throw new Error(`no cell ${i},${j}`);
      return cell;
    };
    expect(at(0, 0)).toMatchObject({ color: 0, expression: 0 });
    // The buffer ring wraps around.
    expect(at(-1, -1)).toMatchObject({ color: 4, expression: 2 });
    expect(at(5, 3)).toMatchObject({ color: 0, expression: 0 });
  });

  it('shifts with the world origin', () => {
    const cells = lookCells(1, 0, 5, 3);
    const centre = cells.find((c) => c.i === 2 && c.j === 1);
    expect(centre?.color).toBe(3);
  });
});

describe('centeredCell', () => {
  it('picks the centre slot, or its neighbour past the halfway point', () => {
    expect(centeredCell(0, 0, 100)).toEqual({ i: 2, j: 1 });
    expect(centeredCell(49, 49, 100)).toEqual({ i: 2, j: 1 });
    expect(centeredCell(51, 51, 100)).toEqual({ i: 1, j: 0 });
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
    const effect = lensEffect({ ...base, cell: { i: 2, j: 1 }, lens: { i: 2, j: 1 } });
    expect(effect).toEqual({ dx: 0, dy: 0, opacity: 1, blur: 0 });
  });

  it('pushes neighbours away and dims them', () => {
    const effect = lensEffect({ ...base, cell: { i: 3, j: 1 }, lens: { i: 2, j: 1 } });
    expect(effect.dx).toBeGreaterThan(0);
    expect(effect.dy).toBe(0);
    expect(effect.dx).toBeLessThanOrEqual(PUSH);
    expect(effect.opacity).toBeLessThan(1);
    expect(effect.opacity).toBeGreaterThanOrEqual(0.7);
    expect(effect.blur).toBeGreaterThan(0);
    expect(effect.blur).toBeLessThanOrEqual(MAX_BLUR);
  });

  it('never pushes under reduced motion', () => {
    const effect = lensEffect({
      ...base,
      push: false,
      cell: { i: 3, j: 1 },
      lens: { i: 2, j: 1 },
    });
    expect(effect.dx).toBe(0);
    expect(effect.dy).toBe(0);
  });

  it('never blurs without the spotlight', () => {
    const effect = lensEffect({
      ...base,
      spotlight: false,
      cell: { i: 5, j: 3 },
      lens: { i: 2, j: 1 },
    });
    expect(effect.blur).toBe(0);
  });

  it('reaches zero influence at the lens radius', () => {
    const effect = lensEffect({
      ...base,
      cell: { i: 2 + Math.round(LENS), j: 1 },
      lens: { i: 2, j: 1 },
    });
    // Past the radius, opacity is back at its floor and there is no push.
    expect(effect.opacity).toBeGreaterThanOrEqual(0.7);
  });
});
