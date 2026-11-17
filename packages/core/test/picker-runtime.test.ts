// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPRESSIONS, PALETTE } from '../src/index.js';
import { createPicker } from '../src/picker-runtime.js';
import type { PickerRuntime } from '../src/picker-runtime.js';

/**
 * The Look Map's behaviour, tested once, in the place all the bindings share.
 *
 * Every binding — React, Vue, Svelte, `<blobbies-picker>` — runs this same
 * runtime, so these are the tests that make "the picker behaves the same
 * everywhere" a fact rather than a hope. A binding's own tests only have to
 * cover its chrome.
 */

let frames: FrameRequestCallback[] = [];
let cleanups: (() => void)[] = [];

// jsdom has no PointerEvent: it falls back to a plain Event and drops the
// coordinates. A MouseEvent stand-in gives real coordinates, ids and types.
class PointerEventPolyfill extends MouseEvent {
  readonly pointerId: number;
  readonly pointerType: string;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
    this.pointerType = init.pointerType ?? 'mouse';
  }
}

beforeEach(() => {
  frames = [];
  cleanups = [];
  vi.stubGlobal('PointerEvent', PointerEventPolyfill);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  for (const stop of cleanups) stop();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

/**
 * jsdom has no layout, so `clientWidth` is 0 and `gridMetrics` floors to its
 * minimums: 24px cells, 4px gaps, 8px padding. A 5x3 visible grid is therefore
 * 152 x 96, and the cells sit exactly where the pointer maths expects.
 */
function mount(options: Parameters<typeof createPicker>[0]): {
  runtime: PickerRuntime;
  surface: HTMLElement;
} {
  const runtime = createPicker(options);
  if (!runtime) throw new Error('createPicker returned null under jsdom');
  const { surface } = runtime;
  document.body.append(surface);
  surface.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 152,
      bottom: 96,
      width: 152,
      height: 96,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
  runtime.measure();
  cleanups.push(() => runtime.destroy());
  return { runtime, surface };
}

/**
 * `MouseEvent` reads `clientX`/`clientY`, not `x`/`y`, so map them here rather
 * than at every call site — a pointer event that silently lands at (0,0) looks
 * exactly like a gesture bug.
 */
function send(
  surface: HTMLElement,
  type: string,
  init: PointerEventInit & { x?: number; y?: number },
): void {
  const { x, y, ...rest } = init;
  surface.dispatchEvent(
    new PointerEventPolyfill(type, {
      bubbles: true,
      ...rest,
      ...(x === undefined ? {} : { clientX: x }),
      ...(y === undefined ? {} : { clientY: y }),
    }),
  );
}

/** Run the leftover animation frames so a snap or a mood step can settle. */
function settle(max = 60): void {
  const began = performance.now();
  for (let n = 0; n < max && frames.length; n++) {
    const cb = frames.shift();
    // Each frame lands well past the 300ms mood step, so its ease completes
    // instead of restarting forever against a frozen clock.
    if (cb) cb(began + n * 400);
  }
}

const CELL_0_0 = { x: 20, y: 20 };
const CELL_2_1 = { x: 76, y: 48 };

describe('the picker runtime', () => {
  /* ------------------------------------------------------------- value */

  it('opens on the centre of the map', () => {
    const { runtime } = mount({ name: 'Sourav Nanda' });
    const value = runtime.getSnapshot().value;

    expect(value.color).toBe(PALETTE[2]);
    expect(value.expression).toBe(EXPRESSIONS[1]);
    expect(value.blush).toBe(true);
    expect(runtime.getSnapshot().changed).toBe(false);
  });

  it('opens on the look it was given', () => {
    const { runtime } = mount({
      name: 'Sourav Nanda',
      defaultValue: { color: PALETTE[5], expression: 'wink', blush: false },
    });
    const snapshot = runtime.getSnapshot();

    expect(snapshot.value.color).toBe(PALETTE[5]);
    expect(snapshot.value.expression).toBe('wink');
    expect(snapshot.value.blush).toBe(false);
    // A given look is not a change.
    expect(snapshot.changed).toBe(false);
  });

  it('does not report the look it opened on', () => {
    const onChange = vi.fn();
    mount({ name: 'Sourav Nanda', onChange });
    settle();

    expect(onChange).not.toHaveBeenCalled();
  });

  /* ----------------------------------------------------------- gestures */

  it('selects the cell under the finger, even when it jitters below the slop', () => {
    const onChange = vi.fn();
    const { runtime, surface } = mount({ name: 'Sourav Nanda', onChange });

    send(surface, 'pointerdown', { pointerId: 1, pointerType: 'touch', button: 0, ...CELL_0_0 });
    send(surface, 'pointermove', {
      pointerId: 1,
      pointerType: 'touch',
      clientX: CELL_0_0.x + 6,
      clientY: CELL_0_0.y,
    });
    // Six pixels of touch jitter is still a tap: it must not become a drag.
    expect(surface.getAttribute('data-dragging')).toBeNull();

    send(surface, 'pointerup', {
      pointerId: 1,
      pointerType: 'touch',
      clientX: CELL_0_0.x + 6,
      clientY: CELL_0_0.y,
    });
    settle();

    const value = runtime.getSnapshot().value;
    expect(value.color).toBe(PALETTE[0]);
    expect(value.expression).toBe(EXPRESSIONS[0]);
    expect(onChange).toHaveBeenCalled();
  });

  it('does not treat a real drag as a tap', () => {
    const { runtime, surface } = mount({ name: 'Sourav Nanda' });

    send(surface, 'pointerdown', { pointerId: 2, pointerType: 'touch', button: 0, ...CELL_0_0 });
    send(surface, 'pointermove', {
      pointerId: 2,
      pointerType: 'touch',
      clientX: CELL_0_0.x + 50,
      clientY: CELL_0_0.y,
    });
    expect(surface.getAttribute('data-dragging')).toBe('1');

    send(surface, 'pointerup', {
      pointerId: 2,
      pointerType: 'touch',
      clientX: CELL_0_0.x + 50,
      clientY: CELL_0_0.y,
    });

    // The map panned one colour over. It did not choose the cell that happened
    // to be under the finger when it lifted.
    const value = runtime.getSnapshot().value;
    expect(value.color).toBe(PALETTE[1]);
    expect(value.expression).toBe(EXPRESSIONS[1]);
  });

  it('carries the throw into a glide and settles', () => {
    const { runtime, surface } = mount({ name: 'Sourav Nanda' });

    send(surface, 'pointerdown', { pointerId: 9, pointerType: 'touch', button: 0, ...CELL_0_0 });
    send(surface, 'pointermove', {
      pointerId: 9,
      pointerType: 'touch',
      clientX: CELL_0_0.x + 50,
      clientY: CELL_0_0.y,
    });
    send(surface, 'pointerup', {
      pointerId: 9,
      pointerType: 'touch',
      clientX: CELL_0_0.x + 50,
      clientY: CELL_0_0.y,
    });

    // A throw keeps going, so the map lands past where the finger stopped.
    expect(runtime.getSnapshot().moving).toBe(true);
    settle();

    // And it comes to rest on a whole cell, not between two.
    const world = surface.querySelector<HTMLElement>('.bb-picker-world');
    expect(runtime.getSnapshot().moving).toBe(false);
    expect(world?.style.transform).toMatch(/translate3d\(0(?:\.0+)?px, 0(?:\.0+)?px, 0\)/);
  });

  it('ignores a tap in the padding instead of hitting an off-screen neighbour', () => {
    const onChange = vi.fn();
    const { runtime, surface } = mount({ name: 'Sourav Nanda', onChange });
    const before = runtime.getSnapshot().value.color;

    send(surface, 'pointerdown', { pointerId: 3, pointerType: 'touch', button: 0, clientX: 3, clientY: 3 });
    send(surface, 'pointerup', { pointerId: 3, pointerType: 'touch', clientX: 3, clientY: 3 });
    settle();

    expect(runtime.getSnapshot().value.color).toBe(before);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not select when the pointer is cancelled', () => {
    const { runtime, surface } = mount({ name: 'Sourav Nanda' });
    const before = runtime.getSnapshot().value.color;

    send(surface, 'pointerdown', { pointerId: 4, pointerType: 'touch', button: 0, ...CELL_0_0 });
    send(surface, 'pointercancel', { pointerId: 4, pointerType: 'touch', ...CELL_0_0 });
    settle();

    expect(runtime.getSnapshot().value.color).toBe(before);
  });

  it('records what it chose at press, not what the map drifted to by release', () => {
    const { runtime, surface } = mount({ name: 'Sourav Nanda' });

    send(surface, 'pointerdown', { pointerId: 5, pointerType: 'touch', button: 0, ...CELL_0_0 });
    send(surface, 'pointermove', {
      pointerId: 5,
      pointerType: 'touch',
      clientX: CELL_0_0.x + 6,
      clientY: CELL_0_0.y,
    });
    send(surface, 'pointerup', {
      pointerId: 5,
      pointerType: 'touch',
      clientX: CELL_0_0.x + 6,
      clientY: CELL_0_0.y,
    });
    settle();

    expect(runtime.getSnapshot().value.color).toBe(PALETTE[0]);
  });

  it('lets only the first pointer own the map', () => {
    const { runtime, surface } = mount({ name: 'Sourav Nanda' });

    send(surface, 'pointerdown', { pointerId: 6, pointerType: 'touch', button: 0, ...CELL_0_0 });
    send(surface, 'pointerdown', { pointerId: 7, pointerType: 'touch', button: 0, ...CELL_2_1 });
    // The second finger is ignored entirely, including its release.
    send(surface, 'pointerup', { pointerId: 7, pointerType: 'touch', ...CELL_2_1 });
    send(surface, 'pointerup', { pointerId: 6, pointerType: 'touch', ...CELL_0_0 });
    settle();

    expect(runtime.getSnapshot().value.color).toBe(PALETTE[0]);
  });

  it('shows the selection check on the tapped cell once it settles', () => {
    const { surface } = mount({ name: 'Sourav Nanda' });

    send(surface, 'pointerdown', { pointerId: 8, pointerType: 'touch', button: 0, ...CELL_0_0 });
    send(surface, 'pointerup', { pointerId: 8, pointerType: 'touch', ...CELL_0_0 });
    settle();

    const check = surface.querySelector('.bb-picker-check[data-on]');
    expect(check).toBeTruthy();
    const cell = check?.parentElement as HTMLElement;
    expect(cell.style.left).toBe('0px');
    expect(cell.style.top).toBe('0px');
  });

  it('keeps hover working for a mouse when no gesture is in progress', () => {
    const { surface } = mount({ name: 'Sourav Nanda' });

    send(surface, 'pointermove', { pointerType: 'mouse', clientX: 20, clientY: 20 });

    // A mouse-move has no active pointer; the gesture guard must not swallow it.
    const cells = Array.from(surface.querySelectorAll<HTMLElement>('.bb-picker-cell'));
    const topLeft = cells.find((el) => el.style.left === '0px' && el.style.top === '0px');
    expect(topLeft?.getAttribute('data-focus')).toBe('1');
  });

  /* ---------------------------------------------------------- the parts */

  it('walks the moods with the arrow keys and the mood buttons', () => {
    const { runtime, surface } = mount({ name: 'Sourav Nanda' });
    const first = runtime.getSnapshot().expressionName;

    runtime.nextExpression();
    settle();
    const second = runtime.getSnapshot().expressionName;
    expect(second).not.toBe(first);

    // Up and Down are the mood axis; they must not move the colours.
    const beforeColor = runtime.getSnapshot().value.color;
    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    settle();
    expect(runtime.getSnapshot().value.color).toBe(beforeColor);
  });

  it('moves the colours with the arrow keys', () => {
    const { runtime, surface } = mount({ name: 'Sourav Nanda' });
    const before = runtime.getSnapshot().value.color;

    surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    settle();

    expect(runtime.getSnapshot().value.color).not.toBe(before);
  });

  it('toggles blush, and reports it as a change', () => {
    const onChange = vi.fn();
    const { runtime } = mount({ name: 'Sourav Nanda', onChange });

    runtime.toggleBlush();
    expect(runtime.getSnapshot().value.blush).toBe(false);
    expect(runtime.getSnapshot().changed).toBe(true);
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]?.blush).toBe(false);
  });

  it('resets to the look it opened on', () => {
    const { runtime } = mount({ name: 'Sourav Nanda' });

    runtime.toggleBlush();
    runtime.nextExpression();
    settle();
    expect(runtime.getSnapshot().changed).toBe(true);

    runtime.reset();
    settle();

    const snapshot = runtime.getSnapshot();
    expect(snapshot.changed).toBe(false);
    expect(snapshot.value.blush).toBe(true);
    expect(snapshot.value.color).toBe(PALETTE[2]);
    expect(snapshot.value.expression).toBe(EXPRESSIONS[1]);
  });

  it('hands the current look to onSave', () => {
    const onSave = vi.fn();
    const { runtime } = mount({ name: 'Sourav Nanda', onSave });

    runtime.toggleBlush();
    runtime.save();

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0]?.[0]?.blush).toBe(false);
  });

  it('says whether it has anything to cancel', () => {
    expect(mount({ name: 'Sourav Nanda' }).runtime.hasCancel).toBe(false);
    expect(mount({ name: 'Sourav Nanda', onCancel: () => {} }).runtime.hasCancel).toBe(true);
  });

  it('notifies subscribers, and stops after they unsubscribe', () => {
    const { runtime } = mount({ name: 'Sourav Nanda' });
    const seen = vi.fn();

    const stop = runtime.subscribe(seen);
    runtime.toggleBlush();
    expect(seen).toHaveBeenCalled();

    stop();
    seen.mockClear();
    runtime.toggleBlush();
    expect(seen).not.toHaveBeenCalled();
  });

  /* ------------------------------------------------ the surface it builds */

  it('builds the viewport, the world and the buffer ring', () => {
    const { surface } = mount({ name: 'Sourav Nanda' });

    expect(surface.getAttribute('role')).toBe('group');
    expect(surface.querySelector('.bb-picker-world')).toBeTruthy();
    // 5x3 visible, plus a one-cell buffer ring on every side.
    expect(surface.querySelectorAll('.bb-picker-cell')).toHaveLength(7 * 5);
  });

  it('draws a real avatar in every cell', () => {
    const { surface } = mount({ name: 'Sourav Nanda' });
    const svgs = surface.querySelectorAll('.bb-picker-lift svg');

    expect(svgs.length).toBe(35);
    for (const svg of svgs) expect(svg.getAttribute('data-blobbies')).toBe('SN');
  });
});
