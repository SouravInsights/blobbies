import { describe, expect, it } from 'vitest';
import { resolveAvatar } from 'blobbies';
import { sceneToNodes } from '../src/scene-to-nodes.js';
import type { RNNode } from '../src/scene-to-nodes.js';

function walk(nodes: readonly RNNode[], visit: (node: RNNode) => void): void {
  for (const node of nodes) {
    visit(node);
    if (node.children) walk(node.children, visit);
  }
}

describe('sceneToNodes', () => {
  it('maps the scene to react-native-svg element types', () => {
    const nodes = sceneToNodes(resolveAvatar('Sourav Nanda').scene);
    const types = new Set<string>();
    walk(nodes, (node) => types.add(node.type));
    expect(types).toContain('Defs');
    expect(types).toContain('ClipPath');
    expect(types).toContain('G');
    expect(types).toContain('Path');
    expect(types).toContain('Circle');
  });

  it('keeps the animatable layer names', () => {
    const names = new Set<string>();
    walk(sceneToNodes(resolveAvatar('Ira').scene), (node) => {
      if (node.name) names.add(node.name);
    });
    for (const layer of ['bb-backdrop', 'bb-blob', 'bb-eyes', 'bb-eye', 'bb-mouth']) {
      expect(names).toContain(layer);
    }
  });

  it('never leaks the layer name as an SVG prop', () => {
    walk(sceneToNodes(resolveAvatar('Ira').scene), (node) => {
      expect(node.props.name).toBeUndefined();
    });
  });

  it('carries the path data through unchanged', () => {
    const paths: string[] = [];
    walk(sceneToNodes(resolveAvatar('Ada Lovelace').scene), (node) => {
      if (node.type === 'Path') paths.push(node.props.d as string);
    });
    expect(paths.length).toBeGreaterThan(3);
    expect(paths.every((d) => typeof d === 'string' && d.length > 0)).toBe(true);
  });

  it('maps the blink layer to a group, not a raw string', () => {
    const groups: RNNode[] = [];
    walk(sceneToNodes(resolveAvatar('Ira').scene), (node) => {
      if (node.name === 'bb-eye') groups.push(node);
    });
    expect(groups.length).toBe(2);
    expect(groups.every((g) => g.type === 'G')).toBe(true);
  });
});
