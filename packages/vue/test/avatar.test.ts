import { describe, expect, it } from 'vitest';
import { createApp, h } from 'vue';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { renderAvatarBody, renderAvatarSvg } from 'blobbies';
import { Avatar } from '../src/index.js';

/** Render through Vue's SSR path, the way a server would. */
function ssr(props: Record<string, unknown>): Promise<string> {
  return renderToString(
    createSSRApp({ render: () => h(Avatar, props as never) }),
  );
}

/** Mount into jsdom, the way a browser would. */
function mount(props: Record<string, unknown>): HTMLElement {
  const host = document.createElement('div');
  createApp({ render: () => h(Avatar, props as never) }).mount(host);
  return host;
}

/**
 * jsdom re-serialises self-closing SVG tags (`<circle/>` -> `<circle></circle>`),
 * so a raw string comparison would fail on formatting alone. Round-tripping both
 * sides through the same parser compares the markup, not the serializer.
 */
function normalize(body: string): string {
  const scratch = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  scratch.innerHTML = body;
  return scratch.innerHTML;
}

describe('Avatar (Vue)', () => {
  it('server-renders the real avatar, not a placeholder', async () => {
    const html = await ssr({ name: 'Ira' });

    // The body the core produces is in the server output — so the avatar is
    // in the first paint instead of appearing after hydration.
    expect(html).toContain(renderAvatarBody('Ira').body);
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 100 100"');
  });

  it('server-renders the same decisions as the core', async () => {
    const html = await ssr({ name: 'Ira', expression: 'wink', size: 96 });
    const expected = renderAvatarBody('Ira', { expression: 'wink', size: 96 });

    expect(html).toContain(expected.body);
    expect(html).toContain('width="96"');
  });

  it('carries the accessible name', async () => {
    expect(await ssr({ name: 'Sourav Nanda' })).toContain('aria-label="Sourav Nanda"');
  });

  it('renders in the DOM', () => {
    const host = mount({ name: 'Ira', size: 64 });
    const svg = host.querySelector('svg');

    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('64');
    expect(svg?.getAttribute('height')).toBe('64');
    expect(normalize(svg?.innerHTML ?? '')).toBe(
      normalize(renderAvatarBody('Ira', { size: 64 }).body),
    );
  });

  it('gives each avatar its own prefix, so blink styles cannot collide', async () => {
    const a = renderAvatarBody('Ira').prefix;
    const b = renderAvatarBody('Ada').prefix;

    expect(a).not.toBe(b);
    expect(await ssr({ name: 'Ira' })).toContain(a);
  });

  it('is deterministic — same name, same markup', async () => {
    expect(await ssr({ name: 'Deterministic' })).toBe(
      await ssr({ name: 'Deterministic' }),
    );
  });

  it('rounds when asked', () => {
    const host = mount({ name: 'Ira', rounded: true });
    const svg = host.querySelector('svg') as SVGSVGElement;

    expect(svg.style.borderRadius).toBe('50%');
  });

  it('merges a consumer class rather than dropping it', () => {
    const host = mount({ name: 'Ira', class: 'mine' });
    const svg = host.querySelector('svg');
    // `svg.className` is an SVGAnimatedString, not a string — read the attribute.
    const classes = svg?.getAttribute('class') ?? '';

    expect(classes).toContain('mine');
    expect(classes).toContain('bb');
  });

  it('draws the body the core would draw, byte for byte', async () => {
    // The component owns its own <svg>, so the meaningful parity check is the
    // inner markup: it must be exactly what the core emitted.
    const html = await ssr({ name: 'Ira', animate: 'blink' });

    expect(html).toContain(renderAvatarBody('Ira', { animate: 'blink' }).body);
    // The blink CSS is embedded, which is what makes it work in an <img> too.
    expect(renderAvatarSvg('Ira', { animate: 'blink' })).toContain('@keyframes');
  });
});
