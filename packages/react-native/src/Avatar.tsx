import { useEffect, useMemo } from 'react';
import type { ReactElement } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Text } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { resolveAvatar, wantsBlink } from 'blobbies';
import type { AvatarOptions } from 'blobbies';
import { sceneToNodes } from './scene-to-nodes.js';
import type { RNNode } from './scene-to-nodes.js';

const AnimatedG = Animated.createAnimatedComponent(G);

export interface AvatarProps extends AvatarOptions {
  /** The person's name — the eyes every look shares. */
  name: string;
}

/**
 * The eyes are a fixed 24×24 box, so the blink scales about (12, 12) without
 * measuring anything. It runs as a worklet on the UI thread, so it keeps
 * blinking while JavaScript is busy.
 */
const BLINK_TRANSFORM = 'translate(12 12) scale(1 %s) translate(-12 -12)';

function renderNode(
  node: RNNode,
  key: string,
  blinkOn: boolean,
  blinkProps: ReturnType<typeof useAnimatedProps>,
): ReactElement {
  const children = node.children?.map((child, i) => renderNode(child, `${key}.${i}`, blinkOn, blinkProps));

  switch (node.type) {
    case 'G':
      if (blinkOn && node.name === 'bb-eye') {
        return (
          <AnimatedG key={key} {...node.props} animatedProps={blinkProps}>
            {children}
          </AnimatedG>
        );
      }
      return (
        <G key={key} {...node.props}>
          {children}
        </G>
      );
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
 * The avatar itself is drawn by `react-native-svg` from the shared scene, so it
 * is the same face as the web and Swift versions. A phone has no cursor, so
 * cursor-following is not ported; blink is, as a discreet UI-thread animation.
 */
export function Avatar({ name, ...options }: AvatarProps): ReactElement {
  const key = `${name}\u0000${JSON.stringify(options)}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resolved = useMemo(() => resolveAvatar(name, options), [key]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const nodes = useMemo(() => sceneToNodes(resolved.scene), [resolved]);
  const blinkOn = wantsBlink(options);

  const blink = useSharedValue(1);
  useEffect(() => {
    if (!blinkOn) return;
    const { interval, delay, double } = resolved.blink;
    const dip = withSequence(
      withTiming(1, { duration: interval * 0.92, easing: Easing.linear }),
      withTiming(0.1, { duration: interval * 0.04, easing: Easing.linear }),
      withTiming(1, { duration: interval * 0.04, easing: Easing.linear }),
    );
    blink.value = withDelay(delay, withRepeat(double ? withSequence(dip, dip) : dip, -1, false));
  }, [blink, blinkOn, resolved.blink.interval, resolved.blink.delay, resolved.blink.double]);

  const blinkProps = useAnimatedProps(() => ({
    transform: BLINK_TRANSFORM.replace('%s', String(blink.value)),
  }));

  const size = options.size ?? 48;
  return (
    <Svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      accessibilityRole="image"
      accessibilityLabel={name}
      {...(options.rounded ? {} : {})}
    >
      {nodes.map((node, i) => renderNode(node, `${resolved.prefix}.${i}`, blinkOn, blinkProps))}
    </Svg>
  );
}
