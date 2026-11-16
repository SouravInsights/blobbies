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

/** OS reduce-motion, the React Native equivalent of `prefers-reduced-motion`. */
function useReduceMotion(respect: boolean): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (!respect) {
      setReduce(false);
      return undefined;
    }
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduce(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, [respect]);
  return reduce;
}

/**
 * Play the shared keyframes and return the current eye scale.
 *
 * The timings are the web's, exactly: an initial `delay`, then every `interval`
 * a dip that starts at `firstActivePhase`. Frames only run during the dip, so
 * the long open stretch costs nothing.
 */
function useBlinkScale(
  enabled: boolean,
  interval: number,
  delay: number,
  double: boolean,
): number {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (!enabled) {
      setScale(1);
      return undefined;
    }
    const start = firstActivePhase(double);
    const flatMs = start * interval;
    const activeMs = Math.max(16, interval - flatMs);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    let cancelled = false;

    const runDip = (): void => {
      const began = Date.now();
      const tick = (): void => {
        if (cancelled) return;
        const t = Math.min(1, (Date.now() - began) / activeMs);
        setScale(blinkScaleAtPhase(start + t * (1 - start), double));
        if (t < 1) frame = requestAnimationFrame(tick);
        else cycle();
      };
      frame = requestAnimationFrame(tick);
    };

    const cycle = (): void => {
      setScale(1);
      timer = setTimeout(runDip, flatMs);
    };

    // CSS `animation-delay`: the first cycle waits, then repeats.
    timer = setTimeout(cycle, delay);
    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
    };
  }, [enabled, interval, delay, double]);
  return scale;
}

function renderNode(
  node: RNNode,
  key: string,
  blinkTransform: string | undefined,
): ReactElement {
  const children = node.children?.map((child, i) =>
    renderNode(child, `${key}.${i}`, blinkTransform),
  );

  switch (node.type) {
    case 'G': {
      const transform =
        node.name === 'bb-eye' && blinkTransform ? blinkTransform : node.props.transform;
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
 * Same prop API, same decisions, same motion as the web component: the face
 * comes from the shared scene, and the blink plays the web's exact keyframes.
 * The one thing that cannot be identical is cursor following — a phone has no
 * cursor — so that is left to a future touch/tilt version.
 */
export function Avatar({ name, ...options }: AvatarProps): ReactElement {
  const key = `${name}\u0000${JSON.stringify(options)}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resolved = useMemo(() => resolveAvatar(name, options), [key]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const nodes = useMemo(() => sceneToNodes(resolved.scene), [resolved]);

  const reduceMotion = useReduceMotion(options.respectReducedMotion !== false);
  const blinkOn = wantsBlink(options) && !reduceMotion;
  const scale = useBlinkScale(
    blinkOn,
    resolved.blink.interval,
    resolved.blink.delay,
    resolved.blink.double,
  );

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
      {nodes.map((node, i) =>
        renderNode(node, `${resolved.prefix}.${i}`, eyeTransform(scale)),
      )}
    </Svg>
  );
}
