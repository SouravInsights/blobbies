// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPRESSIONS, PALETTE } from 'blobbies';
import { AvatarPicker } from '../src/AvatarPicker.js';

/**
 * The picker's mobile contract: a finger that lands and lifts is a tap, a
 * finger that travels is a drag, and neither one is allowed to change its mind
 * because the map moved or the browser cancelled the gesture.
 */

let frames: FrameRequestCallback[] = [];

// jsdom has no PointerEvent, so Testing Library falls back to a plain Event and
// drops clientX/clientY. A MouseEvent-based stand-in gives the component real
// coordinates, pointer ids and pointer types.
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
  cleanup();
  vi.unstubAllGlobals();
});

// jsdom has no layout. A 5x3 grid of 24px cells and 4px gaps, inset 8px, so
// the surface is 152 x 96 and the cells sit where the pointer math expects.
function surfaceBox(el: Element): void {
  (el as HTMLElement).getBoundingClientRect = () =>
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
}

/** Run the leftover animation frames so a snap can settle. */
function flush(max = 30): void {
  act(() => {
    for (let n = 0; n < max && frames.length; n++) {
      const cb = frames.shift();
      if (cb) cb(performance.now());
    }
  });
}

const CELL_0_0 = { x: 20, y: 20 };
const CELL_2_1 = { x: 76, y: 48 };

describe('AvatarPicker on touch', () => {
  it('selects the cell under the finger even when the finger jitters below the slop', () => {
    const onChange = vi.fn();
    const { getByRole } = render(<AvatarPicker name="Sourav Nanda" onChange={onChange} />);
    const surface = getByRole('group');
    surfaceBox(surface);

    fireEvent.pointerDown(surface, {
      pointerId: 1,
      pointerType: 'touch',
      button: 0,
      clientX: CELL_0_0.x,
      clientY: CELL_0_0.y,
    });
    fireEvent.pointerMove(surface, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: CELL_0_0.x + 6,
      clientY: CELL_0_0.y,
    });
    // Six pixels of touch jitter is still a tap — it must not start a drag.
    expect(surface.getAttribute('data-dragging')).toBeNull();

    fireEvent.pointerUp(surface, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: CELL_0_0.x + 6,
      clientY: CELL_0_0.y,
    });

    expect(onChange).toHaveBeenCalled();
    const value = onChange.mock.calls.at(-1)?.[0];
    expect(value?.color).toBe(PALETTE[0]);
    expect(value?.expression).toBe(EXPRESSIONS[0]);
  });

  it('does not treat a real drag as a tap', () => {
    const onChange = vi.fn();
    const { getByRole } = render(<AvatarPicker name="Sourav Nanda" onChange={onChange} />);
    const surface = getByRole('group');
    surfaceBox(surface);

    fireEvent.pointerDown(surface, {
      pointerId: 2,
      pointerType: 'touch',
      button: 0,
      clientX: CELL_0_0.x,
      clientY: CELL_0_0.y,
    });
    fireEvent.pointerMove(surface, {
      pointerId: 2,
      pointerType: 'touch',
      clientX: CELL_0_0.x + 50,
      clientY: CELL_0_0.y,
    });
    expect(surface.getAttribute('data-dragging')).toBe('1');

    fireEvent.pointerUp(surface, {
      pointerId: 2,
      pointerType: 'touch',
      clientX: CELL_0_0.x + 50,
      clientY: CELL_0_0.y,
    });

    // The map panned one colour over. It did not choose the cell that happened
    // to be under the finger when it lifted.
    const value = onChange.mock.calls.at(-1)?.[0];
    expect(value?.color).toBe(PALETTE[1]);
    expect(value?.expression).toBe(EXPRESSIONS[1]);
  });

  it('ignores a tap in the padding instead of hitting an off-screen neighbour', () => {
    const onChange = vi.fn();
    const { getByRole } = render(<AvatarPicker name="Sourav Nanda" onChange={onChange} />);
    const surface = getByRole('group');
    surfaceBox(surface);

    fireEvent.pointerDown(surface, {
      pointerId: 3,
      pointerType: 'touch',
      button: 0,
      clientX: 3,
      clientY: 3,
    });
    fireEvent.pointerUp(surface, {
      pointerId: 3,
      pointerType: 'touch',
      clientX: 3,
      clientY: 3,
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not select when the pointer is cancelled', () => {
    const onChange = vi.fn();
    const { getByRole } = render(<AvatarPicker name="Sourav Nanda" onChange={onChange} />);
    const surface = getByRole('group');
    surfaceBox(surface);

    fireEvent.pointerDown(surface, {
      pointerId: 4,
      pointerType: 'touch',
      button: 0,
      clientX: CELL_0_0.x,
      clientY: CELL_0_0.y,
    });
    fireEvent.pointerCancel(surface, {
      pointerId: 4,
      pointerType: 'touch',
      clientX: CELL_0_0.x,
      clientY: CELL_0_0.y,
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('records what it chose at press, not what the map drifted to by release', () => {
    const onChange = vi.fn();
    const { getByRole } = render(<AvatarPicker name="Sourav Nanda" onChange={onChange} />);
    const surface = getByRole('group');
    surfaceBox(surface);

    // Press the cell at (0,0)...
    fireEvent.pointerDown(surface, {
      pointerId: 5,
      pointerType: 'touch',
      button: 0,
      clientX: CELL_0_0.x,
      clientY: CELL_0_0.y,
    });
    // ...let the map glide under the still finger before it lifts.
    fireEvent.pointerMove(surface, {
      pointerId: 5,
      pointerType: 'touch',
      clientX: CELL_0_0.x + 6,
      clientY: CELL_0_0.y,
    });
    fireEvent.pointerUp(surface, {
      pointerId: 5,
      pointerType: 'touch',
      clientX: CELL_0_0.x + 6,
      clientY: CELL_0_0.y,
    });

    // Still the cell from press, because a tap's target is decided at press.
    expect(onChange.mock.calls.at(-1)?.[0]?.color).toBe(PALETTE[0]);
  });

  it('shows the selection check on the tapped cell once it settles', () => {
    const { getByRole, container } = render(<AvatarPicker name="Sourav Nanda" />);
    const surface = getByRole('group');
    surfaceBox(surface);

    fireEvent.pointerDown(surface, {
      pointerId: 6,
      pointerType: 'touch',
      button: 0,
      clientX: CELL_0_0.x,
      clientY: CELL_0_0.y,
    });
    fireEvent.pointerUp(surface, {
      pointerId: 6,
      pointerType: 'touch',
      clientX: CELL_0_0.x,
      clientY: CELL_0_0.y,
    });
    flush();

    const check = container.querySelector('.bb-picker-check[data-on]');
    expect(check).toBeTruthy();
    const cell = check?.parentElement as HTMLElement;
    expect(cell.style.left).toBe('0px');
    expect(cell.style.top).toBe('0px');
  });

  it('keeps hover working for a mouse when no gesture is in progress', () => {
    const { getByRole, container } = render(<AvatarPicker name="Sourav Nanda" />);
    const surface = getByRole('group');
    surfaceBox(surface);

    fireEvent.pointerMove(surface, { pointerType: 'mouse', clientX: 20, clientY: 20 });

    // A mouse-move has no active pointer; the gesture guard must not swallow it.
    const cells = Array.from(container.querySelectorAll<HTMLElement>('.bb-picker-cell'));
    const topLeft = cells.find((el) => el.style.left === '0px' && el.style.top === '0px');
    expect(topLeft?.getAttribute('data-focus')).toBe('1');
  });

  it('selects the centre cell on a still tap with no movement at all', () => {
    const onChange = vi.fn();
    const { getByRole } = render(<AvatarPicker name="Sourav Nanda" onChange={onChange} />);
    const surface = getByRole('group');
    surfaceBox(surface);

    fireEvent.pointerDown(surface, {
      pointerId: 7,
      pointerType: 'touch',
      button: 0,
      clientX: CELL_2_1.x,
      clientY: CELL_2_1.y,
    });
    fireEvent.pointerUp(surface, {
      pointerId: 7,
      pointerType: 'touch',
      clientX: CELL_2_1.x,
      clientY: CELL_2_1.y,
    });

    // Centre is already the value, so onChange stays quiet; nothing moved.
    expect(onChange).not.toHaveBeenCalled();
  });
});
