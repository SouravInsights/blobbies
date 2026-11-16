/**
 * The scene: a renderer-agnostic draw tree.
 *
 * The core used to build an SVG string directly. That is perfect for the web
 * and useless for React Native and SwiftUI, which need *structure* — a group
 * they can animate, a shape they can map to their own primitives. So the
 * drawing is now a small tree of nodes, and the SVG string is one serialiser
 * over it.
 *
 * The shape data is deliberately close to SVG: a path carries its `d` string
 * and a group carries its transform ops. react-native-svg accepts both
 * directly; SwiftUI parses the `d` once. The alternative — inventing a new path
 * grammar — would mean rewriting all 36 hand-tuned glyphs, which is not worth
 * the risk. What matters is that the *structure* (which shape is the blob,
 * which group is the eyes) is explicit and shared.
 */

/** A transform op. The serialiser joins them into one SVG transform string. */
export type TransformOp =
  | { kind: 'translate'; x: number; y: number }
  | { kind: 'rotate'; deg: number }
  | { kind: 'scale'; x: number; y?: number };

export interface ClipDef {
  id: string;
  cx: number;
  cy: number;
  r: number;
}

export type SceneNode =
  | { kind: 'defs'; clip: ClipDef }
  | {
      kind: 'group';
      className?: string;
      transform?: TransformOp[];
      clipId?: string;
      children: SceneNode[];
    }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill: string }
  | {
      kind: 'ellipse';
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      fill: string;
      opacity?: number;
    }
  | {
      kind: 'path';
      d: string;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      linecap?: string;
      linejoin?: string;
      transform?: TransformOp[];
    }
  | {
      kind: 'text';
      x: number;
      y: number;
      anchor: string;
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      fill: string;
      value: string;
    };

/** `String(number)`, exactly as the old template literals did. */
function num(value: number): string {
  return String(value);
}

function transformString(ops: readonly TransformOp[]): string {
  return ops
    .map((op) => {
      if (op.kind === 'translate') return `translate(${num(op.x)} ${num(op.y)})`;
      if (op.kind === 'rotate') return `rotate(${num(op.deg)})`;
      return op.y === undefined ? `scale(${num(op.x)})` : `scale(${num(op.x)} ${num(op.y)})`;
    })
    .join(' ');
}

/** Serialise transform ops to the SVG transform string. */
export function serializeTransform(ops: readonly TransformOp[]): string {
  return transformString(ops);
}

/** Serialise one node. Attribute order matches the original output exactly. */
export function serializeNode(node: SceneNode): string {
  switch (node.kind) {
    case 'defs':
      return `<defs><clipPath id="${node.clip.id}"><circle cx="${num(node.clip.cx)}" cy="${num(node.clip.cy)}" r="${num(node.clip.r)}"/></clipPath></defs>`;
    case 'group': {
      let attrs = '';
      if (node.className) attrs += ` class="${node.className}"`;
      if (node.clipId) attrs += ` clip-path="url(#${node.clipId})"`;
      if (node.transform) attrs += ` transform="${transformString(node.transform)}"`;
      return `<g${attrs}>${node.children.map(serializeNode).join('')}</g>`;
    }
    case 'circle':
      return `<circle cx="${num(node.cx)}" cy="${num(node.cy)}" r="${num(node.r)}" fill="${node.fill}"/>`;
    case 'ellipse': {
      const opacity = node.opacity === undefined ? '' : ` opacity="${num(node.opacity)}"`;
      return `<ellipse cx="${num(node.cx)}" cy="${num(node.cy)}" rx="${num(node.rx)}" ry="${num(node.ry)}" fill="${node.fill}"${opacity}/>`;
    }
    case 'path': {
      let attrs = '';
      if (node.transform) attrs += ` transform="${transformString(node.transform)}"`;
      attrs += ` d="${node.d}"`;
      if (node.fill !== undefined) attrs += ` fill="${node.fill}"`;
      if (node.stroke !== undefined) attrs += ` stroke="${node.stroke}"`;
      if (node.strokeWidth !== undefined) attrs += ` stroke-width="${num(node.strokeWidth)}"`;
      if (node.linecap) attrs += ` stroke-linecap="${node.linecap}"`;
      if (node.linejoin) attrs += ` stroke-linejoin="${node.linejoin}"`;
      return `<path${attrs}/>`;
    }
    case 'text':
      return `<text x="${num(node.x)}" y="${num(node.y)}" text-anchor="${node.anchor}" font-family="${node.fontFamily}" font-size="${num(node.fontSize)}" font-weight="${num(node.fontWeight)}" fill="${node.fill}">${node.value}</text>`;
  }
}

export function serializeScene(nodes: readonly SceneNode[]): string {
  return nodes.map(serializeNode).join('');
}
