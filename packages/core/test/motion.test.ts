// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachAvatarMotion } from '../src/motion.js';
import { renderAvatarSvg } from '../src/render.js';

function mount(name = 'Sourav Nanda'): SVGSVGElement {
  const holder = document.createElement('div');
  holder.innerHTML = renderAvatarSvg(name, { animate: 'follow' });
  const svg = holder.querySelector('svg') as SVGSVGElement;
  document.body.appendChild(holder);
  return svg;
}

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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

function move(x = 10, y = 10): void {
  window.dispatchEvent(new MouseEvent('pointermove', { clientX: x, clientY: y }));
}

function flush(): void {
  const cb = rafCb;
  rafCb = null;
  cb?.(0);
}

describe('attachAvatarMotion', () => {
  it('returns a no-op for null / missing elements', () => {
    expect(typeof attachAvatarMotion(null)).toBe('function');
    expect(() => attachAvatarMotion(null)()).not.toThrow();
  });

  it('adds the shared motion class and writes CSS variables', () => {
    const svg = mount();
    const cleanup = attachAvatarMotion(svg);
    expect(svg.classList.contains('bb-motion')).toBe(true);

    move(200, 120);
    flush();
    expect(svg.style.getPropertyValue('--look-x')).not.toBe('');
    expect(svg.style.getPropertyValue('--look-y')).not.toBe('');
    cleanup();
  });

  it('uses a single shared pointermove listener for several avatars', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const a = mount('A');
    const b = mount('B');
    const ca = attachAvatarMotion(a);
    const cb = attachAvatarMotion(b);

    const pointerMoveAdds = addSpy.mock.calls.filter(([type]) => type === 'pointermove');
    expect(pointerMoveAdds).toHaveLength(1);
    ca();
    cb();
  });

  it('cleanup removes the listener and injected state', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const svg = mount();
    const cleanup = attachAvatarMotion(svg);
    cleanup();

    const pointerMoveRemoves = removeSpy.mock.calls.filter(([type]) => type === 'pointermove');
    expect(pointerMoveRemoves).toHaveLength(1);
    expect(svg.classList.contains('bb-motion')).toBe(false);
    expect(svg.style.getPropertyValue('--look-x')).toBe('');

    // Firing events after cleanup must be harmless.
    expect(() => move()).not.toThrow();
  });

  it('is idempotent to clean up twice', () => {
    const svg = mount();
    const cleanup = attachAvatarMotion(svg);
    cleanup();
    expect(() => cleanup()).not.toThrow();
  });

  it('does nothing when prefers-reduced-motion is set', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {} }),
    );
    const svg = mount();
    const cleanup = attachAvatarMotion(svg);
    expect(svg.classList.contains('bb-motion')).toBe(false);
    cleanup();
  });

  it('can be forced to ignore reduced motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {} }),
    );
    const svg = mount();
    const cleanup = attachAvatarMotion(svg, { respectReducedMotion: false });
    expect(svg.classList.contains('bb-motion')).toBe(true);
    cleanup();
  });
});
