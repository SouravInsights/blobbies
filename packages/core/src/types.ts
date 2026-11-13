/**
 * Public option types for Blobbies.
 *
 * All option fields are optional; sensible deterministic defaults are derived
 * from the input name.
 */

export type AvatarAnimate = boolean | 'blink' | 'follow' | 'all';

/** A DOM element or a React-style ref object pointing at one. */
export type FollowTarget =
  | 'window'
  | HTMLElement
  | { readonly current: HTMLElement | null };

export interface AvatarOptions {
  /** Rendered width/height in px (or any CSS length). Default: 48. */
  size?: number | string;
  /** Apply a circular border radius to the rendered svg. Default: false. */
  rounded?: boolean;
  /** Extra class name placed on the root <svg>. */
  className?: string;
  /** Render an accessible <title> element. Default: false. */
  title?: boolean;
  /** Custom palette of flat colors. Defaults to the built-in palette. */
  palette?: readonly string[];

  /**
   * Convenience switch:
   *  - false (default)      → completely static markup
   *  - true | 'all'         → blink (CSS) + follow (JS, inline only)
   *  - 'blink'              → blink only
   *  - 'follow'             → follow only
   */
  animate?: AvatarAnimate;

  /** Enable the CSS blink. Default: true when `animate` includes it. */
  blink?: boolean;
  /** Blink interval range in ms. Default: [2500, 6000]. */
  blinkInterval?: readonly [number, number];

  /** Enable cursor following (inline SVG only). Default: true when animated. */
  follow?: boolean;
  /** Max eye travel in viewBox units. Default: 6. */
  followRange?: number;
  /** Element to listen for pointer movement on. Default: 'window'. */
  followTarget?: FollowTarget;
  /** Lerp smoothing 0..1. Default: 0.15. */
  smoothing?: number;
  /** Idle ms before easing back to center. Default: 2500. */
  idleTimeout?: number;
  /** Pause all motion. Default: false. */
  paused?: boolean;
  /** Respect `prefers-reduced-motion`. Default: true. */
  respectReducedMotion?: boolean;

  /** Extra: wink on click. Default: false. */
  wink?: boolean;
  /** Extra: random glance while idle. Default: false. */
  glance?: boolean;
  /** Extra: surprised look when the pointer gets very close. Default: false. */
  surprise?: boolean;
}

/** Options accepted by `attachAvatarMotion` (a subset of AvatarOptions). */
export interface MotionOptions {
  followRange?: number;
  followTarget?: FollowTarget;
  smoothing?: number;
  idleTimeout?: number;
  paused?: boolean;
  respectReducedMotion?: boolean;
  wink?: boolean;
  glance?: boolean;
  surprise?: boolean;
}
