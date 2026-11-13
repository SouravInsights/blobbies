import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { wantsFollow } from 'blobbies';
import { attachAvatarMotion } from 'blobbies/motion';
import type { MotionOptions } from 'blobbies';
import type { AvatarAnimate } from 'blobbies';

export interface UseAvatarMotionOptions extends MotionOptions {
  animate?: AvatarAnimate;
  /** Explicit override; defaults to true when `animate` includes follow. */
  follow?: boolean;
}

/**
 * Attach cursor-following motion to an SVG produced by Blobbies.
 *
 * The element keeps a single, stable options object which is mutated on every
 * render — so changing smoothing/idle/range never re-registers listeners, and
 * nothing re-renders on pointer move.
 */
export function useAvatarMotion(
  ref: RefObject<SVGSVGElement | null>,
  options: UseAvatarMotionOptions = {},
): void {
  const stable = useRef<UseAvatarMotionOptions>({ ...options });
  // Mutate the same object every render; the motion runtime reads it live.
  Object.assign(stable.current, options);

  const enabled = wantsFollow({ animate: options.animate, follow: options.follow });

  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return undefined;
    return attachAvatarMotion(element, stable.current);
  }, [enabled, options.followTarget, ref]);
}
