/**
 * The crowd, laid out.
 *
 * A grid says "here are fifty avatars". This says "here is a crowd": every
 * blob gets a depth, and depth decides how big it is, how far in front it sits,
 * how fast it drifts, how far it has to travel to arrive, and whether it is in
 * focus. The near ones and the far ones are soft; the middle band is sharp.
 * That is the whole difference between a plane and a space.
 *
 * Two things matter for it to look composed rather than scattered:
 *
 *   1. Spots are chosen by rejection sampling — each one takes the point
 *      farthest from every spot already placed. Even coverage, no clumps.
 *   2. Everything is derived from the blob's own name, so the crowd is a pure
 *      function of the name list. Same page, same crowd. No `Math.random`.
 */

import { createRng } from 'blobbies';

export interface Blob {
  /** The name this blob draws. */
  name: string;
  /** Centre, in px from the field's top-left. */
  x: number;
  y: number;
  /** 0 is the far distance, 1 is right in front of the camera. */
  depth: number;
  /** Rendered diameter, in px. */
  dia: number;
  /** The custom properties the CSS reads, already formatted. */
  vars: Record<string, string>;
}

export interface FieldBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface FieldOptions {
  /** The field's size, in px. */
  width: number;
  height: number;
  /** The names to draw. The first `count` are used. */
  names: readonly string[];
  /** How many blobs. Defaults to what the field can hold at this size. */
  count?: number;
  /** A box nothing may be placed inside — the hero's copy, measured. */
  avoid?: FieldBox;
  /** Restrict spots to a horizontal band, as a share of the width. */
  band?: readonly [number, number];
  /** Sizes scale with this. Defaults to the short edge, capped. */
  base?: number;
  /** Seed prefix, so the hero and the film can lay out differently. */
  seed?: string;
}

const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));

/** Base diameter: a share of the short edge, kept inside a sane range. */
export function baseSize(width: number, height: number): number {
  return clamp(Math.min(width, height) * 0.072, 46, 84);
}

/**
 * How many blobs fit without crowding: about a fifth of the field covered by
 * circles of the base size. A phone gets a handful, a desktop a few dozen — the
 * same crowd, at the same visual density.
 */
export function capacityFor(width: number, height: number, base = baseSize(width, height)): number {
  return clamp((width * height * 0.18) / ((base * base * Math.PI) / 4), 36, 180);
}

/**
 * How far out of focus a blob at this depth sits. Zero through the middle —
 * the band the eye reads as "the subject" — and rising at both ends.
 */
function softness(depth: number): number {
  if (depth < 0.25) return 2 + ((0.25 - depth) / 0.25) * 2.5;
  if (depth > 0.8) return 3 + ((depth - 0.8) / 0.2) * 3;
  return 0;
}

export function layoutField(options: FieldOptions): Blob[] {
  const { width: w, height: h, names, avoid, band, seed = 'crowd' } = options;
  const base = options.base ?? baseSize(w, h);
  const count = options.count ?? Math.round(clamp(capacityFor(w, h, base) * 0.42, 12, 60));
  const rng = createRng(`${seed}:${Math.round(w)}x${Math.round(h)}:${count}`);

  const rand = (a: number, b: number): number => a + rng() * (b - a);
  const spots: { x: number; y: number }[] = [];

  /**
   * The farthest of a handful of tries. `must` keeps trying until it finds real
   * room, for the few that have to land somewhere specific.
   */
  const spot = (r: number, x0: number, x1: number, must = false): { x: number; y: number } | null => {
    let best: { x: number; y: number } | null = null;
    let far = -1;
    for (let k = 0; k < (must ? 120 : 14); k++) {
      if (k >= 14 && far > r * 2.4) break;
      const x = rand(Math.max(r + 8, x0), Math.max(r + 8, Math.min(w - r - 8, x1)));
      const y = rand(h * 0.08 + r, Math.max(h * 0.08 + r, h * 0.96 - r));
      if (avoid && x > avoid.left - r && x < avoid.right + r && y > avoid.top - r && y < avoid.bottom + r) continue;
      const dist = spots.length
        ? Math.min(...spots.map((s) => Math.hypot(s.x - x, s.y - y)))
        : Number.MAX_SAFE_INTEGER;
      if (dist > far) {
        far = dist;
        best = { x, y };
      }
    }
    if (best) spots.push(best);
    return best;
  };

  const out: Blob[] = [];
  for (let i = 0; i < count; i++) {
    const name = names[i % names.length] as string;
    // A per-blob stream, so one name always draws the same blob in the same way.
    const r = createRng(`${seed}:${name}:${i}`);
    const depth = r();
    const dia = base * (0.55 + 0.75 * depth) * 1.1;
    const at = spot(dia / 2, band ? w * band[0] : 0, band ? w * band[1] : w);
    if (!at) continue;

    const persp = 0.6 + 0.65 * depth;
    const blur = dia * softness(depth) / 146;

    out.push({
      name,
      x: at.x,
      y: at.y,
      depth,
      dia,
      vars: {
        '--x': `${at.x.toFixed(1)}px`,
        '--y': `${at.y.toFixed(1)}px`,
        '--d': `${dia.toFixed(1)}px`,
        // The distance it has to travel: from below the fold up to its spot.
        '--from': `${Math.round(h - at.y + dia / 2 + rand(0, h * 0.1))}px`,
        '--tilt': `${rand(-0.35, 0.35).toFixed(2)}rad`,
        // Biased late, so the field fills in as a wave rather than a curtain.
        '--delay': `${(0.9 * rng() ** 1.6).toFixed(2)}s`,
        '--dur': `${((1.8 - 0.5 * depth) * 1.2).toFixed(2)}s`,
        '--bob': `${(rand(2.5, 6) * persp).toFixed(1)}px`,
        '--bobT': `${(rand(3.4, 5.2) / 2).toFixed(2)}s`,
        '--ph1': `${-rand(0, 5).toFixed(2)}s`,
        '--sway': `${(rand(2, 5) * persp).toFixed(1)}px`,
        '--swayT': `${(rand(4.5, 7) / 2).toFixed(2)}s`,
        '--ph2': `${-rand(0, 7).toFixed(2)}s`,
        '--turn': `${rand(0.04, 0.1).toFixed(3)}rad`,
        // How far it lifts away, and how late it starts, when the page moves on.
        '--lag': `${rand(0, 0.35).toFixed(2)}`,
        '--lift': `${Math.round(h * (0.6 + persp * 0.6))}`,
        '--blur': `${blur.toFixed(2)}px`,
        '--z': `${Math.round(depth * 100)}`,
        // How far this blob is from the middle of the field. The film uses it to
        // pull the whole crowd into one point; the hero never reads it.
        '--dx': `${(w / 2 - at.x).toFixed(1)}px`,
        '--dy': `${(h / 2 - at.y).toFixed(1)}px`,
      },
    });
  }
  return out;
}
