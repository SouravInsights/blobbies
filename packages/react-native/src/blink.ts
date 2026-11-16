/**
 * The blink, defined once as data so every platform animates the *same* thing.
 *
 * These are the exact keyframes the web's CSS uses
 * (`packages/core/src/render.ts`, `buildBlinkStyle`):
 *
 *   single:  0%,92%,100% → scaleY(1);  95% → scaleY(.1)
 *   double:  0%,72%,100% → scaleY(1);  75% → scaleY(.1); 78% → scaleY(1); 81% → scaleY(.1)
 *
 * with the CSS `ease-in-out` curve between keyframes, an initial `delay`, and a
 * repeat every `interval`. Any platform that reimplements the blink must
 * reproduce these numbers, not invent its own.
 */

export type Keyframe = readonly [phase: number, scaleY: number];

export const SINGLE_BLINK: readonly Keyframe[] = [
  [0, 1],
  [0.92, 1],
  [0.95, 0.1],
  [1, 1],
];

export const DOUBLE_BLINK: readonly Keyframe[] = [
  [0, 1],
  [0.72, 1],
  [0.75, 0.1],
  [0.78, 1],
  [0.81, 0.1],
  [1, 1],
];

export function blinkKeyframes(double: boolean): readonly Keyframe[] {
  return double ? DOUBLE_BLINK : SINGLE_BLINK;
}

/** The first phase at which the dip begins — the keyframe before the first
 *  value that is no longer open. */
export function firstActivePhase(double: boolean): number {
  const frames = blinkKeyframes(double);
  for (let i = 0; i < frames.length; i++) {
    if ((frames[i] as Keyframe)[1] !== 1) {
      return i > 0 ? (frames[i - 1] as Keyframe)[0] : 0;
    }
  }
  return 1;
}

/** CSS `ease-in-out` = cubic-bezier(0.42, 0, 0.58, 1). */
export function easeInOut(x: number): number {
  const x1 = 0.42;
  const y1 = 0;
  const x2 = 0.58;
  const y2 = 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number): number => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number): number => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number): number => (3 * ax * t + 2 * bx) * t + cx;

  let t = x;
  for (let i = 0; i < 8; i++) {
    const d = sampleDX(t);
    if (Math.abs(d) < 1e-6) break;
    t -= (sampleX(t) - x) / d;
  }
  t = Math.min(1, Math.max(0, t));
  return sampleY(t);
}

/** The eye scale at a point in the cycle, `0 <= phase <= 1`. */
export function blinkScaleAtPhase(phase: number, double: boolean): number {
  const frames = blinkKeyframes(double);
  for (let i = 0; i < frames.length - 1; i++) {
    const [p0, v0] = frames[i] as Keyframe;
    const [p1, v1] = frames[i + 1] as Keyframe;
    if (phase <= p1) {
      const local = p1 === p0 ? 1 : (phase - p0) / (p1 - p0);
      return v0 + (v1 - v0) * easeInOut(local);
    }
  }
  return 1;
}
