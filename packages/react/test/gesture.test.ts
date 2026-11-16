import { describe, expect, it } from 'vitest';
import { cellAtPoint, dragSlop, exceedsSlop } from 'blobbies';

describe('dragSlop', () => {
  it('gives touch more slack than a mouse', () => {
    expect(dragSlop('mouse')).toBeLessThan(dragSlop('touch'));
    expect(dragSlop('pen')).toBeGreaterThan(dragSlop('mouse'));
    expect(dragSlop('pen')).toBeLessThan(dragSlop('touch'));
  });

  it('defaults to touch slack when the pointer type is unknown', () => {
    expect(dragSlop(undefined)).toBe(dragSlop('touch'));
  });
});

describe('exceedsSlop', () => {
  const start = { x: 100, y: 100 };

  it('stays a tap inside the radius', () => {
    expect(exceedsSlop(start, { x: 106, y: 100 }, 10)).toBe(false);
    expect(exceedsSlop(start, { x: 100, y: 106 }, 10)).toBe(false);
  });

  it('becomes a drag outside the radius', () => {
    expect(exceedsSlop(start, { x: 111, y: 100 }, 10)).toBe(true);
    expect(exceedsSlop(start, { x: 100, y: 111 }, 10)).toBe(true);
  });

  it('measures diagonally, not per axis', () => {
    // 8,8 is 11.3 away — past a slop of 10 — even though neither axis passes it.
    expect(exceedsSlop(start, { x: 108, y: 108 }, 10)).toBe(true);
  });
});

describe('cellAtPoint', () => {
  // A 5x3 grid of 24px cells and 4px gaps, inset 8px, at rest.
  const base = {
    pad: 8,
    offsetX: 0,
    offsetY: 0,
    pitch: 28,
    width: 136, // 5 * 24 + 4 * 4
    height: 80, // 3 * 24 + 2 * 4
  };

  it('maps the centre of each cell', () => {
    expect(cellAtPoint({ ...base, x: 8 + 12, y: 8 + 12 })).toEqual({ i: 0, j: 0 });
    expect(cellAtPoint({ ...base, x: 8 + 2 * 28 + 12, y: 8 + 1 * 28 + 12 })).toEqual({
      i: 2,
      j: 1,
    });
    expect(cellAtPoint({ ...base, x: 8 + 4 * 28 + 12, y: 8 + 2 * 28 + 12 })).toEqual({
      i: 4,
      j: 2,
    });
  });

  it('rejects taps in the padding, so a stray tap never hits a buffer cell', () => {
    expect(cellAtPoint({ ...base, x: 4, y: 40 })).toBeNull();
    expect(cellAtPoint({ ...base, x: 150, y: 40 })).toBeNull();
    expect(cellAtPoint({ ...base, x: 40, y: 4 })).toBeNull();
    expect(cellAtPoint({ ...base, x: 40, y: 90 })).toBeNull();
  });

  it('follows the world offset during a pan', () => {
    // The world has shifted one full pitch left, so the same screen point now
    // sits over the next cell.
    expect(cellAtPoint({ ...base, offsetX: -28, x: 8 + 12, y: 8 + 12 })).toEqual({
      i: 1,
      j: 0,
    });
  });
});
