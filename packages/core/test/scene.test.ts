import { describe, expect, it } from 'vitest';
import { renderAvatarBody, resolveAvatar, serializeScene } from '../src/index.js';
import type { SceneNode } from '../src/index.js';

/**
 * The scene is the shared draw tree. React Native and SwiftUI walk it, so its
 * shape is a contract: named groups for the animatable parts, and a serialiser
 * that reproduces the SVG exactly.
 */
function classNames(nodes: readonly SceneNode[]): string[] {
  const out: string[] = [];
  const walk = (node: SceneNode): void => {
    if (node.kind === 'group') {
      if (node.className) out.push(node.className);
      node.children.forEach(walk);
    }
  };
  nodes.forEach(walk);
  return out;
}

describe('scene', () => {
  it('serialises back to the body exactly', () => {
    for (const name of ['Sourav Nanda', 'Ira', '田中太郎', '😀', '']) {
      const resolved = resolveAvatar(name);
      expect(serializeScene(resolved.scene)).toBe(resolved.body);
    }
  });

  it('names the layers a native renderer animates', () => {
    const classes = classNames(resolveAvatar('Sourav Nanda').scene);
    for (const layer of ['bb-backdrop', 'bb-blob', 'bb-eyes', 'bb-mouth', 'bb-eye']) {
      expect(classes).toContain(layer);
    }
  });

  it('keeps the drawn parts as structured nodes, not a string', () => {
    const scene = resolveAvatar('Ira').scene;
    expect(scene.some((node) => node.kind === 'defs')).toBe(true);
    const paths = JSON.stringify(scene).match(/"kind":"path"/g) ?? [];
    expect(paths.length).toBeGreaterThan(0);
  });

  it('includes the blink style only when blinking is on', () => {
    expect(renderAvatarBody('Ira', { animate: 'blink' }).body).toContain('<style>');
    expect(renderAvatarBody('Ira').body).not.toContain('<style>');
  });
});
