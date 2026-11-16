import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { AccessibilityInfo } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Text } from 'react-native-svg';
import { resolveAvatar, wantsBlink } from 'blobbies';
import type { AvatarOptions } from 'blobbies';
import { blinkScaleAtPhase, firstActivePhase } from './blink.js';
import { sceneToNodes } from './scene-to-nodes.js';
import type { RNNode } from './scene-to-nodes.js';

export interface AvatarProps extends AvatarOptions {
  /** The person's name — the eyes every look shares. */
  name: string;
}

/** Scale the eyes vertically about their own centre (a fixed 24×24 box). */
function eyeTransform(scale: number): string | undefined {
  if (scale === 1) return undefined;
  return `translate(12 12) scale(1 ${scale}) translate(-12 -12)`;
}

function renderNode(
  node: RNNode,
  key: string,
  eyeBlink: string | undefined,
): ReactElement {
  const children = node.children?.map((child, i) =>
    renderNode(child, `${key}.${i}`, eyeBlink),
  );

  switch (node.type) {
    case 'G': {
      const transform =
        node.name === 'bb-eye' && eyeBlink ? eyeBlink : node.props.transform;
      return (
        <G key={key} {...node.props} transform={transform}>
          {children}
        </G>
      );
    }
    case 'Path':
      return <Path key={key} {...node.props} />;
    case 'Circle':
      return <Circle key={key} {...node.props} />;
    case 'Ellipse':
      return <Ellipse key={key} {...node.props} />;
    case 'Text':
      return (
        <Text key={key} {...node.props}>
          {node.text}
        </Text>
      );
    case 'Defs':
      return <Defs key={key}>{children}</Defs>;
    case 'ClipPath':
      return (
        <ClipPath key={key} {...node.props}>
          {children}
        </ClipPath>
      );
  }
}

/**
 * A Blobbies avatar for React Native.
 *
 * Same prop API, same decisions, same motion as the web: the face comes from
 * the shared scene, and the blink plays the web's exact keyframes. The one thing
 * that cannot be identical is cursor following — a phone has no cursor.
 */
export function Avatar({ name, ...options }: AvatarProps): ReactElement {
  const key = `${name}\u0000${JSON.stringify(options)}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resolved = useMemo(() => resolveAvatar(name, options), [key]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const nodes = useMemo(() => sceneToNodes(resolved.scene), [resolved]);
  const blinkOn = wantsBlink(options);

  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!blinkOn) {
      setScale(1);
      return undefined;
    }

    const { interval, delay, double } = resolved.blink;
    const startPhase = firstActivePhase(double);
    const flatMs = startPhase * interval;
    const activeMs = Math.max(16, interval - flatMs);

    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    let cancelled = false;
    let running = false;

    // One dip: from `startPhase` to the end of the interval, then repeat after
    // the flat stretch. This is the web's keyframe cycle, in time.
    const dip = (): void => {
      if (cancelled || !running) return;
      const began = Date.now();
      const tick = (): void => {
        if (cancelled || !running) return;
        const t = Math.min(1, (Date.now() - began) / activeMs);
        setScale(blinkScaleAtPhase(startPhase + t * (1 - startPhase), double));
        if (t < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          setScale(1);
          timer = setTimeout(dip, flatMs);
        }
      };
      frame = requestAnimationFrame(tick);
    };

    const stop = (): void => {
      running = false;
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
      setScale(1);
    };

    const start = (): void => {
      if (cancelled || running) return;
      running = true;
      timer = setTimeout(dip, delay + flatMs);
    };

    // The native `prefers-reduced-motion`, live. Guarded, because a missing or
    // throwing API must never be able to unmount the app.
    const onReduceChange = (reduce: boolean): void => {
      if (cancelled) return;
      if (reduce) stop();
      else start();
    };

    let subscription: { remove?: () => void } | undefined;
    try {
      const info: typeof AccessibilityInfo | undefined = AccessibilityInfo;
      if (
        options.respectReducedMotion !== false &&
        info &&
        typeof info.isReduceMotionEnabled === 'function'
      ) {
        void info.isReduceMotionEnabled().then(onReduceChange, () => start());
        subscription = info.addEventListener?.('reduceMotionChanged', onReduceChange);
      } else {
        start();
      }
    } catch {
      start();
    }

    return () => {
      cancelled = true;
      running = false;
      if (frame) cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
      subscription?.remove?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blinkOn, resolved, options.respectReducedMotion]);

  const size = options.size ?? 48;
  const radius =
    options.rounded && typeof size === 'number' ? { borderRadius: size / 2 } : undefined;

  return (
    <Svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={radius}
      accessibilityRole="image"
      accessibilityLabel={name}
    >
      {nodes.map((node, i) => renderNode(node, `${resolved.prefix}.${i}`, eyeTransform(scale)))}
    </Svg>
  );
}
