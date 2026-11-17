import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import AvatarPicker from '../src/AvatarPicker.svelte';
import CustomPicker from './CustomPicker.svelte';

/**
 * The Svelte half of the picker.
 *
 * The behaviour belongs to `createPicker` and is tested once in core, for every
 * binding. These are about the chrome: that it mounts the runtime's map, that
 * it renders the controls, and that it calls the callbacks a Svelte app passes.
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
  // Testing Library only self-cleans when vitest globals are on, and they are
  // not here — so without this, one test's panel is still on screen for the
  // next one and "Choose an avatar" matches twice.
  cleanup();
  vi.unstubAllGlobals();
});

describe('AvatarPicker (Svelte)', () => {
  it('mounts the runtime’s map', () => {
    const { container } = render(AvatarPicker, { props: { name: 'Sourav Nanda' } });

    const surface = container.querySelector('.bb-picker-surface');
    expect(surface).toBeTruthy();
    expect(surface?.getAttribute('role')).toBe('group');
    // 5x3 visible, plus the one-cell buffer ring.
    expect(container.querySelectorAll('.bb-picker-cell')).toHaveLength(7 * 5);
  });

  it('renders the header, the mood and the actions', () => {
    const { container, getByText } = render(AvatarPicker, {
      props: { name: 'Sourav Nanda' },
    });

    expect(getByText('Choose an avatar')).toBeTruthy();
    expect(getByText('Smirk')).toBeTruthy();
    expect(container.querySelector('[aria-label="Next expression"]')).toBeTruthy();
    expect(getByText('Save')).toBeTruthy();
  });

  it('calls onsave with the current look', async () => {
    const onsave = vi.fn();
    const { container } = render(AvatarPicker, { props: { name: 'Sourav Nanda', onsave } });

    await fireEvent.click(container.querySelector('[data-part="save"]') as HTMLElement);

    expect(onsave).toHaveBeenCalledTimes(1);
    const value = onsave.mock.calls[0]?.[0];
    expect(typeof value?.color).toBe('string');
    expect(typeof value?.expression).toBe('string');
    expect(typeof value?.blush).toBe('boolean');
  });

  it('calls onchange when blush is toggled', async () => {
    const onchange = vi.fn();
    const { container } = render(AvatarPicker, { props: { name: 'Sourav Nanda', onchange } });

    await fireEvent.click(container.querySelector('[data-part="blush"]') as HTMLElement);

    expect(onchange).toHaveBeenCalled();
    expect(onchange.mock.calls.at(-1)?.[0]?.blush).toBe(false);
    expect(container.querySelector('[data-part="blush"]')?.getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('shows cancel only when the parent is listening', () => {
    expect(
      render(AvatarPicker, { props: { name: 'Sourav Nanda' } }).container.querySelector(
        '[data-part="cancel"]',
      ),
    ).toBeNull();

    expect(
      render(AvatarPicker, { props: { name: 'Sourav Nanda', oncancel: () => {} } }).container.querySelector(
        '[data-part="cancel"]',
      ),
    ).toBeTruthy();
  });

  it('starts from the look it was given', () => {
    const { container, getByText } = render(AvatarPicker, {
      props: {
        name: 'Sourav Nanda',
        defaultValue: { color: '#123456', expression: 'wink', blush: false },
      },
    });

    expect(container.querySelector('[data-part="blush"]')?.getAttribute('aria-pressed')).toBe(
      'false',
    );
    expect(getByText('Wink')).toBeTruthy();
  });
});

describe('createAvatarPicker (Svelte)', () => {
  it('gives a custom layout the map and the state', async () => {
    const changes: unknown[] = [];
    const { container, getByText } = render(CustomPicker, {
      props: { onchange: (value: unknown) => changes.push(value) },
    });

    // The map it mounted is the same element the runtime builds.
    const surface = container.querySelector('.bb-picker-surface');
    expect(surface).toBeTruthy();
    expect(container.querySelectorAll('.bb-picker-cell')).toHaveLength(7 * 5);

    // And the state it reads is the runtime's, so a control built by hand
    // behaves exactly like the preset's.
    expect(getByText('Smirk')).toBeTruthy();
    await fireEvent.click(container.querySelector('[data-part="blush"]') as HTMLElement);
    expect(changes.length).toBeGreaterThan(0);

    await fireEvent.click(container.querySelector('[data-part="reset"]') as HTMLElement);
    expect(getByText('Smirk')).toBeTruthy();
  });
});
