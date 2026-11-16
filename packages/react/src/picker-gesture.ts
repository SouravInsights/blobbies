/**
 * Framework-agnostic gesture math for the Blobbies look map.
 *
 * This module is deliberately free of React and the DOM. Every framework
 * binding — React today, Vue/Svelte/Solid later — runs the same numbers, so a
 * tap, a drag and a missed tap behave identically everywhere. If a swipe test
 * fails, it fails once here rather than in each port.
 *
 * The two rules that matter for touch:
 *   1. A press is not a drag until it has moved past a *device-aware* slop.
 *   2. What a tap selects is decided by the cell under the finger at press,
 *      never by where the map drifted to before the finger lifted.
 */

/** A position in client / surface pixels. */
export interface GesturePoint {
  x: number;
  y: number;
}

/** A cell on the wrapped look map. */
export interface CellIndex {
  i: number;
  j: number;
}

/**
 * Movement, in CSS pixels, that separates a tap from a drag.
 *
 * Touch and pen jitter far more than a mouse: a finger routinely moves a few
 * pixels while the user believes it is still. With too little slack every tap
 * becomes a drag and the map lurches when they only meant to choose a face.
 * Ten pixels is roughly half a fingertip on a phone and invisible under a
 * cursor.
 */
export function dragSlop(pointerType?: string): number {
  if (pointerType === 'mouse') return 3;
  if (pointerType === 'pen') return 6;
  return 10;
}

/**
 * True once a press has travelled far enough, on any axis, to be a drag.
 * Radial distance, not per-axis, so a diagonal flick counts the same as a
 * straight one.
 */
export function exceedsSlop(start: GesturePoint, current: GesturePoint, slop: number): boolean {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  return dx * dx + dy * dy > slop * slop;
}

export interface CellHitTest {
  /** Pointer position relative to the surface's top-left corner. */
  x: number;
  y: number;
  /** Gap between the surface edge and the visible grid. */
  pad: number;
  /** World offset, in pixels, within one pitch. */
  offsetX: number;
  offsetY: number;
  /** Distance between cell origins (cell size + gap). */
  pitch: number;
  /** Size of the visible grid, excluding the padding. */
  width: number;
  height: number;
}

/**
 * Which map cell sits under a point.
 *
 * The map wraps, so there is no clamping: a point in the buffer ring returns
 * the wrapped index and the caller adds the world origin. A point in the
 * padding returns `null`, because it is not over the grid at all — that null
 * is what stops a stray tap in the 8px inset from choosing an off-screen
 * neighbour and closing the picker on the wrong face.
 */
export function cellAtPoint(hit: CellHitTest): CellIndex | null {
  const x = hit.x - hit.pad;
  const y = hit.y - hit.pad;
  if (x < 0 || y < 0 || x >= hit.width || y >= hit.height) return null;
  return {
    i: Math.floor((x - hit.offsetX) / hit.pitch),
    j: Math.floor((y - hit.offsetY) / hit.pitch),
  };
}
