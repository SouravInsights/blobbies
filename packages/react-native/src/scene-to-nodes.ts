/**
 * Turn a core scene into a plain element description for `react-native-svg`.
 *
 * This is a pure function with no React Native import, so it is unit-testable
 * in plain Node — which matters, because React Native itself is not testable in
 * CI without a device or an emulator. The `<Avatar>` component is a thin
 * recursive renderer over this output.
 */
import { serializeTransform } from 'blobbies';
import type { SceneNode } from 'blobbies';

export type RNNodeType =
  | 'G'
  | 'Path'
  | 'Circle'
  | 'Ellipse'
  | 'Text'
  | 'Defs'
  | 'ClipPath';

export interface RNNode {
  type: RNNodeType;
  props: Record<string, any>;
  children?: RNNode[];
  /** Text content, for a `<Text>` node. */
  text?: string;
  /** The source layer name (`bb-eye`), used to target animation. */
  name?: string;
}

export function nodeToRN(node: SceneNode): RNNode {
  switch (node.kind) {
    case 'defs':
      return {
        type: 'Defs',
        props: {},
        children: [
          {
            type: 'ClipPath',
            props: { id: node.clip.id },
            children: [
              { type: 'Circle', props: { cx: node.clip.cx, cy: node.clip.cy, r: node.clip.r } },
            ],
          },
        ],
      };
    case 'group': {
      const props: Record<string, unknown> = {};
      if (node.transform) props.transform = serializeTransform(node.transform);
      if (node.clipId) props.clipPath = `url(#${node.clipId})`;
      const out: RNNode = { type: 'G', props, children: node.children.map(nodeToRN) };
      if (node.className) out.name = node.className;
      return out;
    }
    case 'circle':
      return {
        type: 'Circle',
        props: { cx: node.cx, cy: node.cy, r: node.r, fill: node.fill },
      };
    case 'ellipse': {
      const props: Record<string, unknown> = {
        cx: node.cx,
        cy: node.cy,
        rx: node.rx,
        ry: node.ry,
        fill: node.fill,
      };
      if (node.opacity !== undefined) props.opacity = node.opacity;
      return { type: 'Ellipse', props };
    }
    case 'path': {
      const props: Record<string, unknown> = { d: node.d };
      if (node.transform) props.transform = serializeTransform(node.transform);
      if (node.fill !== undefined) props.fill = node.fill;
      if (node.stroke !== undefined) props.stroke = node.stroke;
      if (node.strokeWidth !== undefined) props.strokeWidth = node.strokeWidth;
      if (node.linecap) props.strokeLinecap = node.linecap;
      if (node.linejoin) props.strokeLinejoin = node.linejoin;
      return { type: 'Path', props };
    }
    case 'text':
      return {
        type: 'Text',
        props: {
          x: node.x,
          y: node.y,
          textAnchor: node.anchor,
          fontFamily: node.fontFamily,
          fontSize: node.fontSize,
          fontWeight: String(node.fontWeight),
          fill: node.fill,
        },
        text: node.value,
      };
  }
}

export function sceneToNodes(nodes: readonly SceneNode[]): RNNode[] {
  return nodes.map(nodeToRN);
}
