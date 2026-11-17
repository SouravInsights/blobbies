import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { AvatarPicker } from '../src/AvatarPicker.js';

/**
 * The Vue half of the picker.
 *
 * The behaviour itself belongs to `createPicker` and is tested in core, once,
 * for every binding. These tests are only about the chrome: that it mounts the
 * runtime's map, that it renders the controls, and that it emits the events a
 * Vue app expects.
 */

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

/** Mount into jsdom, the way a browser would. */
async function mount(props: Record<string, unknown>): Promise<{ host: HTMLElement; app: ReturnType<typeof createApp> }> {
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp({ render: () => h(AvatarPicker, props as never) });
  app.mount(host);
  // Vue flushes a ref change made in `onMounted` on a microtask, so the map and
  // the mood row are one tick behind the mount itself.
  await nextTick();
  return { host, app };
}

describe('AvatarPicker (Vue)', () => {
  it('mounts the runtime’s map', async () => {
    const { host } = await mount({ name: 'Sourav Nanda' });

    const surface = host.querySelector('.bb-picker-surface');
    expect(surface).toBeTruthy();
    expect(surface?.getAttribute('role')).toBe('group');
    // 5x3 visible, plus the one-cell buffer ring.
    expect(host.querySelectorAll('.bb-picker-cell')).toHaveLength(7 * 5);
  });

  it('renders the header, the mood and the actions', async () => {
    const { host } = await mount({ name: 'Sourav Nanda' });

    expect(host.textContent).toContain('Choose an avatar');
    expect(host.textContent).toContain('Smirk');
    expect(host.querySelector('[aria-label="Next expression"]')).toBeTruthy();
    expect(host.textContent).toContain('Save');
  });

  it('emits save with the current look', async () => {
    const onSave = vi.fn();
    const { host } = await mount({ name: 'Sourav Nanda', onSave });

    (host.querySelector('[data-part="save"]') as HTMLButtonElement).click();
    await Promise.resolve();

    expect(onSave).toHaveBeenCalledTimes(1);
    const value = onSave.mock.calls[0]?.[0];
    expect(typeof value?.color).toBe('string');
    expect(typeof value?.expression).toBe('string');
    expect(typeof value?.blush).toBe('boolean');
  });

  it('emits change when blush is toggled', async () => {
    const onChange = vi.fn();
    const { host } = await mount({ name: 'Sourav Nanda', onChange });

    (host.querySelector('[data-part="blush"]') as HTMLButtonElement).click();
    await Promise.resolve();

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]?.blush).toBe(false);
    expect(host.querySelector('[data-part="blush"]')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('shows cancel only when there is something to cancel', async () => {
    expect((await mount({ name: 'Sourav Nanda' })).host.querySelector('[data-part="cancel"]')).toBeNull();
    expect(
      (await mount({ name: 'Sourav Nanda', onCancel: () => {} })).host.querySelector('[data-part="cancel"]'),
    ).toBeTruthy();
  });

  it('starts from the look it was given', async () => {
    const { host } = await mount({
      name: 'Sourav Nanda',
      defaultValue: { color: '#123456', expression: 'wink', blush: false },
    });

    expect(host.querySelector('[data-part="blush"]')?.getAttribute('aria-pressed')).toBe('false');
    expect(host.textContent).toContain('Wink');
  });

  it('renders its chrome on the server, where there is no map', async () => {
    // The map is built on the client — 35 cells rewritten every frame is not a
    // job for a renderer — but the panel around it must not disappear, or the
    // picker would arrive as a blank box.
    const html = await renderToString(
      createSSRApp({ render: () => h(AvatarPicker, { name: 'Sourav Nanda' }) }),
    );

    expect(html).toContain('Choose an avatar');
    expect(html).toContain('Smirk');
    expect(html).toContain('data-part="surface-host"');
  });
});
