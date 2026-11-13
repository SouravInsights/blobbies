import { describe, expect, it } from 'vitest';
import { renderAvatarSvg, resolveAvatar, avatarByteLength } from '../src/render.js';
import { backdropBounds, decideTraits, LAYOUT } from '../src/parts.js';
import { createRng } from '../src/hash.js';
import { PALETTE } from '../src/palette.js';

/**
 * The coloured layer is clipped to the dark disk, so it can never poke out of
 * the circle or be clipped flat by the viewBox. These tests lock that in.
 */
describe('geometry containment', () => {
  it('keeps the dark disk inside the viewBox', () => {
    const b = backdropBounds();
    expect(b.minX).toBeGreaterThanOrEqual(0);
    expect(b.minY).toBeGreaterThanOrEqual(0);
    expect(b.maxX).toBeLessThanOrEqual(100);
    expect(b.maxY).toBeLessThanOrEqual(100);
  });

  it('clips the coloured layer to the exact disk circle', () => {
    const svg = renderAvatarSvg('Sourav Nanda');
    const clip = svg.match(/<clipPath id="([^"]+)"><circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/);
    expect(clip).not.toBeNull();
    const [, id, cx, cy, r] = clip as RegExpMatchArray;
    expect(Number(cx)).toBe(LAYOUT.backdrop.cx);
    expect(Number(cy)).toBe(LAYOUT.backdrop.cy);
    expect(Number(r)).toBe(LAYOUT.backdrop.r);
    expect(svg).toContain(`class="bb-blob" clip-path="url(#${id})"`);
  });

  it('derives the clip id from the seed so avatars never collide', () => {
    const a = renderAvatarSvg('Sourav Nanda');
    const b = renderAvatarSvg('Ira');
    const idOf = (s: string) => s.match(/<clipPath id="([^"]+)"/)?.[1];
    expect(idOf(a)).toBeTruthy();
    expect(idOf(a)).not.toBe(idOf(b));
    // stable across calls
    expect(idOf(renderAvatarSvg('Sourav Nanda'))).toBe(idOf(a));
  });

  it('renders the same clip for every seed without error', () => {
    for (let i = 0; i < 500; i++) {
      expect(() => renderAvatarSvg(`person-${i}`)).not.toThrow();
      const traits = decideTraits({ rng: createRng(`person-${i}`), palette: PALETTE });
      expect(traits.shapeIndex).toBeGreaterThanOrEqual(0);
      expect(traits.shapeIndex).toBeLessThan(5);
    }
  });

  it('keeps static markup small', () => {
    expect(avatarByteLength(renderAvatarSvg('Sourav Nanda'))).toBeLessThan(2048);
    expect(avatarByteLength(renderAvatarSvg('Sourav Nanda', { animate: 'blink' }))).toBeLessThan(
      3072,
    );
    expect(resolveAvatar('Sourav Nanda').body).toContain('bb-blob');
  });
});
