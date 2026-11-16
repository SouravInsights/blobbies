/**
 * Framework-agnostic gesture math for the Look Map.
 *
 * No React, no DOM. Every binding runs the same numbers, so a tap, a drag and a
 * missed tap behave identically everywhere.
 */
import type { CellIndex } from './look-map.js';

/** A position in client / surface pixels. */
export interface GesturePoint {
  x: number;
  y: number;
}

/**
 * Movement, in CSS pixels, that separates a tap from a drag.
 *
 * Touch and pen jitter far more than a mouse: a finger routinely moves a few
 * pixels while the user believes it is still. With too little slack every tap
 * becomes a drag and the map lurches when they only meant to choose a face.
 */
export function dragSlop(pointerType?: string): number {
  if (pointerType === 'mouse') return 3;
  if (pointerType === 'pen') return 6;
  return 10;
}

/** True once a press has travelled far enough, on any axis, to be a drag. */
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
 * padding returns `null`, because it is not over the grid at all.
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
