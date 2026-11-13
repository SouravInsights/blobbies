import { useMemo, useRef } from 'react';
import type { CSSProperties, SVGProps } from 'react';
import { renderAvatarBody } from 'blobbies';
import type { AvatarOptions } from 'blobbies';
import { useAvatarMotion } from './useAvatarMotion.js';

export interface AvatarProps
  extends AvatarOptions,
    Omit<SVGProps<SVGSVGElement>, 'name' | 'className' | 'color' | 'style'> {
  /** The name to derive the avatar from. */
  name: string;
  /** Extra inline styles for the root svg. */
  style?: CSSProperties;
}

/**
 * Inline SVG avatar. SSR-safe, accessible and deterministic.
 *
 * Cursor-follow only works on inline SVG (i.e. this component), never on an
 * `<img>`; the blink is pure CSS and works in both.
 */
export function Avatar(props: AvatarProps): JSX.Element {
  const {
    name,
    size,
    rounded,
    className,
    title,
    palette,
    animate,
    blink,
    blinkInterval,
    follow,
    followRange,
    followTarget,
    smoothing,
    idleTimeout,
    paused,
    respectReducedMotion,
    wink,
    glance,
    surprise,
    style,
    ...svgProps
  } = props;

  const options: AvatarOptions = {
    size,
    rounded,
    className,
    title,
    palette,
    animate,
    blink,
    blinkInterval,
    follow,
    followRange,
    followTarget,
    smoothing,
    idleTimeout,
    paused,
    respectReducedMotion,
    wink,
    glance,
    surprise,
  };

  // Only recompute the inner markup when body-affecting options change. This
  // keeps the embedded blink animation from being reset on unrelated renders.
  const bodyKey = JSON.stringify([
    name,
    animate,
    blink,
    blinkInterval,
    palette,
    title,
    rounded,
    size,
    className,
  ]);
  const resolved = useMemo(
    () => renderAvatarBody(name, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bodyKey],
  );

  const ref = useRef<SVGSVGElement>(null);
  useAvatarMotion(ref, {
    animate,
    follow,
    followRange,
    followTarget,
    smoothing,
    idleTimeout,
    paused,
    respectReducedMotion,
    wink,
    glance,
    surprise,
  });

  const classes = ['bb', resolved.prefix, className].filter(Boolean).join(' ');
  const mergedStyle: CSSProperties | undefined = rounded
    ? { borderRadius: '50%', ...style }
    : style;

  return (
    <svg
      {...svgProps}
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      role={svgProps.role ?? 'img'}
      aria-label={svgProps['aria-label'] ?? name}
      width={size ?? 48}
      height={size ?? 48}
      className={classes}
      style={mergedStyle}
      data-blobbies={resolved.letters}
      dangerouslySetInnerHTML={{ __html: resolved.body }}
    />
  );
}
