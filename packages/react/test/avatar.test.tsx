// @vitest-environment jsdom
import { StrictMode, useState } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Avatar } from '../src/Avatar.js';
import { useAvatarMotion } from '../src/useAvatarMotion.js';

let rafCb: FrameRequestCallback | null = null;

beforeEach(() => {
  rafCb = null;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafCb = cb;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {
    rafCb = null;
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function flush(): void {
  const cb = rafCb;
  rafCb = null;
  cb?.(0);
}

describe('<Avatar />', () => {
  it('renders an accessible inline svg', () => {
    const { container } = render(<Avatar name="Sourav Nanda" />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Sourav Nanda');
    expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
    expect(svg.querySelector('.bb-backdrop')).toBeTruthy();
    expect(svg.querySelector('.bb-blob')).toBeTruthy();
    expect(svg.querySelectorAll('.bb-eye')).toHaveLength(2);
    expect(svg.querySelector('.bb-mouth')).toBeTruthy();
  });

  it('is deterministic across renders and matches the core string renderer', async () => {
    const { container, rerender } = render(<Avatar name="Sourav Nanda" />);
    const first = (container.querySelector('svg') as SVGSVGElement).innerHTML;
    rerender(<Avatar name="Sourav Nanda" />);
    const second = (container.querySelector('svg') as SVGSVGElement).innerHTML;
    expect(second).toBe(first);

    const { renderAvatarBody } = await import('blobbies');
    // Normalise browser serialisation (closing tags) before comparing.
    const strip = (s: string) => s.replace(/\/>/g, '>').replace(/<\/[a-z]+>/g, '');
    expect(strip(first)).toBe(strip(renderAvatarBody('Sourav Nanda', {}).body));
  });

  it('honours size, rounded and className', () => {
    const { container } = render(
      <Avatar name="Ira" size={80} rounded className="mine" />,
    );
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.getAttribute('width')).toBe('80');
    expect(svg.classList.contains('mine')).toBe(true);
    expect(svg.style.borderRadius).toBe('50%');
  });

  it('does not attach motion unless follow is requested', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    render(<Avatar name="Ira" />);
    const moves = addSpy.mock.calls.filter(([t]) => t === 'pointermove');
    expect(moves).toHaveLength(0);
  });

  it('attaches motion for animate="follow" and cleans up on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { container, unmount } = render(<Avatar name="Ira" animate="follow" />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.classList.contains('bb-motion')).toBe(true);
    expect(addSpy.mock.calls.filter(([t]) => t === 'pointermove')).toHaveLength(1);

    unmount();
    expect(removeSpy.mock.calls.filter(([t]) => t === 'pointermove')).toHaveLength(1);
  });

  it('does not re-register listeners on unrelated re-renders', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const { rerender } = render(
      <Avatar name="Ira" animate="follow" smoothing={0.15} />,
    );
    expect(addSpy.mock.calls.filter(([t]) => t === 'pointermove')).toHaveLength(1);

    rerender(<Avatar name="Ira" animate="follow" smoothing={0.4} />);
    rerender(<Avatar name="Ira" animate="follow" smoothing={0.4} />);
    expect(addSpy.mock.calls.filter(([t]) => t === 'pointermove')).toHaveLength(1);
  });

  it('does not re-render on pointer move', () => {
    let renders = 0;
    function Counter() {
      renders++;
      return <Avatar name="Ira" animate="all" />;
    }
    render(<Counter />);
    const before = renders;

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 100, clientY: 100 }));
    act(() => flush());

    expect(renders).toBe(before);
  });

  it('is StrictMode safe (no duplicate listeners)', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(
      <StrictMode>
        <Avatar name="Ira" animate="follow" />
      </StrictMode>,
    );
    const adds = addSpy.mock.calls.filter(([t]) => t === 'pointermove').length;
    const removes = removeSpy.mock.calls.filter(([t]) => t === 'pointermove').length;
    // StrictMode mounts, unmounts and remounts; exactly one listener must be
    // live at any moment (adds always balanced by removes before re-adding).
    expect(adds - removes).toBe(1);
    unmount();
    expect(
      addSpy.mock.calls.filter(([t]) => t === 'pointermove').length -
        removeSpy.mock.calls.filter(([t]) => t === 'pointermove').length,
    ).toBe(0);
  });

  it('emits the blink style only when animated', () => {
    const { container, rerender } = render(<Avatar name="Ira" />);
    expect(container.querySelector('style')).toBeNull();
    rerender(<Avatar name="Ira" animate="blink" />);
    expect(container.querySelector('style')?.textContent).toContain('bb-eye');
  });
});

describe('useAvatarMotion', () => {
  it('attaches for people who bring their own svg', () => {
    function Own() {
      const ref = { current: null as SVGSVGElement | null };
      useAvatarMotion(ref, { animate: 'follow' });
      return <svg ref={ref} viewBox="0 0 100 100" />;
    }
    const { container, unmount } = render(<Own />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.classList.contains('bb-motion')).toBe(true);
    expect(() => unmount()).not.toThrow();
  });

  it('toggles on when paused changes without re-attaching', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');

    function Toggler({ paused }: { paused: boolean }) {
      const [ref] = useState(() => ({ current: null as SVGSVGElement | null }));
      useAvatarMotion(ref, { animate: 'follow', paused });
      return <svg ref={ref} viewBox="0 0 100 100" />;
    }

    const { rerender } = render(<Toggler paused={false} />);
    expect(addSpy.mock.calls.filter(([t]) => t === 'pointermove')).toHaveLength(1);
    rerender(<Toggler paused />);
    expect(addSpy.mock.calls.filter(([t]) => t === 'pointermove')).toHaveLength(1);
  });
});
