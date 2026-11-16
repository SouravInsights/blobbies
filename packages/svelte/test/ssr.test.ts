import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { renderAvatarBody } from 'blobbies';
import Avatar from '../src/Avatar.svelte';

/**
 * The server half. This is the reason to install this package rather than use
 * `<blobbies-avatar>`: a custom element renders nothing on the server, so a
 * web-component avatar appears only after hydration.
 */
describe('Avatar (Svelte, server-rendered)', () => {
  it('emits the real avatar, not a placeholder', () => {
    const { body } = render(Avatar, { props: { name: 'Ira' } });

    expect(body).toContain(renderAvatarBody('Ira').body);
    expect(body).toContain('<svg');
    expect(body).toContain('viewBox="0 0 100 100"');
  });

  it('makes the same decisions as the core', () => {
    const { body } = render(Avatar, {
      props: { name: 'Ira', expression: 'wink', size: 96 },
    });

    expect(body).toContain(
      renderAvatarBody('Ira', { expression: 'wink', size: 96 }).body,
    );
    expect(body).toContain('width="96"');
  });

  it('carries the accessible name', () => {
    const { body } = render(Avatar, { props: { name: 'Sourav Nanda' } });

    expect(body).toContain('aria-label="Sourav Nanda"');
  });

  it('namespaces each avatar, so blink styles cannot collide', () => {
    const a = renderAvatarBody('Ira').prefix;
    const b = renderAvatarBody('Ada').prefix;

    expect(a).not.toBe(b);
    expect(render(Avatar, { props: { name: 'Ira' } }).body).toContain(a);
  });

  it('is deterministic — same name, same markup', () => {
    expect(render(Avatar, { props: { name: 'Deterministic' } }).body).toBe(
      render(Avatar, { props: { name: 'Deterministic' } }).body,
    );
  });

  it('embeds the blink animation, which is what makes it work in an <img>', () => {
    const { body } = render(Avatar, { props: { name: 'Ira', animate: 'blink' } });

    expect(body).toContain(renderAvatarBody('Ira', { animate: 'blink' }).body);
    expect(body).toContain('@keyframes');
  });
});
