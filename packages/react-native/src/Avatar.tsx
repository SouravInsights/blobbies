import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Text } from 'react-native-svg';
import { resolveAvatar, wantsBlink } from 'blobbies';
import type { AvatarOptions } from 'blobbies';
import { sceneToNodes } from './scene-to-nodes.js';
import type { RNNode } from './scene-to-nodes.js';

export interface AvatarProps extends AvatarOptions {
  /** The person's name — the eyes every look shares. */
  name: string;
}

/** How long a blink takes, open → closed → open. */
const BLINK_MS = 140;

/** Scale the eyes vertically about their own centre (a fixed 24×24 box). */
function eyeTransform(scale: number): string | undefined {
  if (scale === 1) return undefined;
  return `translate(12 12) scale(1 ${scale}) translate(-12 -12)`;
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
 * The avatar is drawn by `react-native-svg` from the shared scene, so it is the
 * same face as the web and Swift versions.
 *
 * Blink is a short frame loop that re-renders the eye transform. That is
 * deliberate: the native SVG transform prop only accepts an already-computed
 * matrix, so driving an animated prop through Reanimated either does nothing or
 * crashes the native module. A blink fires every few seconds and lasts ~140ms,
 * so a plain loop is both reliable and cheap. Cursor following is not ported —
 * a phone has no cursor.
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
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const run = (): void => {
      const start = Date.now();
      const tick = (): void => {
        if (cancelled) return;
        const t = Math.min(1, (Date.now() - start) / BLINK_MS);
        // Open → closed over the first half, closed → open over the second.
        const value = t < 0.5 ? 1 - 0.9 * (t / 0.5) : 0.1 + 0.9 * ((t - 0.5) / 0.5);
        setScale(value);
        if (t < 1) frame = requestAnimationFrame(tick);
        else schedule();
      };
      frame = requestAnimationFrame(tick);
    };

    const schedule = (): void => {
      timer = setTimeout(run, resolved.blink.interval);
    };

    schedule();
    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
    };
  }, [blinkOn, resolved]);

  const size = options.size ?? 48;
  const transform = eyeTransform(scale);

  return (
    <Svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      accessibilityRole="image"
      accessibilityLabel={name}
    >
      {nodes.map((node, i) => renderNode(node, `${resolved.prefix}.${i}`, transform))}
    </Svg>
  );
}
