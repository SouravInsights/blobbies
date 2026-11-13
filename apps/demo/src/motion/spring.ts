/**
 * Springs, as CSS easings.
 *
 * A spring is not a curve you can name, so the trick is to sample it: run the
 * physics at 60 steps a second and hand the result to CSS `linear()`. The
 * browser then plays a real spring — with the right overshoot and the right
 * settle — on the compositor, with no JavaScript running per frame.
 *
 * `response` is SwiftUI's: roughly how long the spring takes to get going.
 * `damping` is its damping fraction: 1 is critically damped (no bounce), below
 * 1 overshoots, and the closer to 0 the more it rings.
 *
 *     spring(0.4, 0.66)   // a face moving aside: quick, a little bounce
 *     spring(0.8, 0.72)   // something large rising into place
 */

export interface Spring {
  /** Time to settle, in ms. */
  ms: number;
  /** A `linear()` easing sampled from the spring, or a stand-in curve. */
  ease: string;
}

/** `linear()` is in every current engine, but a page can still be older. */
const LINEAR =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('transition-timing-function', 'linear(0, 1)');

/** Below this, the spring is close enough to be called settled. */
const SETTLED = 0.002;

export function spring(response: number, damping: number): Spring {
  const w = (2 * Math.PI) / response;
  const z = damping;

  /** How far the spring still is from its target, `t` seconds in. */
  const residual = (t: number): number =>
    z < 1 ? Math.exp(-z * w * t) : Math.exp(-w * t) * (1 + w * t);

  /** Where the spring is, 0 at the start and 1 at its target. */
  const position = (t: number): number => {
    if (z < 1) {
      const wd = w * Math.sqrt(1 - z * z);
      return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
    }
    return 1 - residual(t);
  };

  // Settle time, found by walking forward until it is within a fifth of a percent.
  let seconds = response;
  while (seconds < 3 && residual(seconds) > SETTLED) seconds += 0.01;

  if (!LINEAR) {
    // No `linear()`: a cubic-bezier is the closest thing, and the duration is
    // shortened because a bezier has no tail to sit through.
    return {
      ms: Math.round(seconds * 800),
      ease: z < 1 ? 'cubic-bezier(.2, 1.3, .3, 1)' : 'cubic-bezier(.2, .8, .2, 1)',
    };
  }

  const steps = Math.ceil(seconds * 60);
  const points: number[] = [];
  for (let i = 0; i <= steps; i++) points.push(Number(position((i / steps) * seconds).toFixed(4)));

  return { ms: Math.round(seconds * 1000), ease: `linear(${points.join(',')})` };
}

/**
 * The springs this page uses, named for what they do rather than how they are
 * tuned. Written to `:root` as `--e-<name>` (the easing) and `--t-<name>` (the
 * duration), so any rule can say `transition: translate var(--t-rise) var(--e-rise)`.
 */
export const SPRINGS = {
  /** The one face coming up the middle of the hero. */
  rise: spring(0.8, 0.72),
  /** A face in a row moving aside for its neighbour. */
  part: spring(0.46, 0.66),
  /** A control lifting under the pointer. */
  lift: spring(0.35, 0.75),
  /** A panel or card arriving. */
  pop: spring(0.4, 0.9),
  /** A number or a label swapping. */
  snap: spring(0.3, 0.85),
  /** A ring or halo growing out from under something. */
  ring: spring(0.42, 0.66),
} as const;

export type SpringName = keyof typeof SPRINGS;

/** Writes every spring to the document as custom properties. Idempotent. */
export function installSprings(target: HTMLElement): void {
  for (const [name, value] of Object.entries(SPRINGS)) {
    target.style.setProperty(`--e-${name}`, value.ease);
    target.style.setProperty(`--t-${name}`, `${value.ms}ms`);
  }
}
