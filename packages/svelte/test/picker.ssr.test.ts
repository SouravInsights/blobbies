import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import AvatarPicker from '../src/AvatarPicker.svelte';

/**
 * The server half of the picker.
 *
 * The map is built on the client — 35 cells rewritten every frame is not a job
 * for a renderer — but the panel around it must not disappear, or the picker
 * would arrive as a blank box. And the mood it reads out has to be the mood it
 * will open on, not an empty string that corrects itself a frame later.
 */
describe('AvatarPicker (Svelte, server-rendered)', () => {
  it('renders its chrome where there is no map', () => {
    const { body } = render(AvatarPicker, { props: { name: 'Sourav Nanda' } });

    expect(body).toContain('Choose an avatar');
    expect(body).toContain('data-part="surface-host"');
    expect(body).not.toContain('bb-picker-cell');
  });

  it('reads out the mood it will open on', () => {
    expect(render(AvatarPicker, { props: { name: 'Sourav Nanda' } }).body).toContain('Smirk');
  });

  it('reads out the mood it was given', () => {
    const { body } = render(AvatarPicker, {
      props: { name: 'Sourav Nanda', defaultValue: { expression: 'wink' } },
    });

    expect(body).toContain('Wink');
  });
});
