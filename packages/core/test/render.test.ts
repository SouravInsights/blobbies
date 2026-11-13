import { describe, expect, it } from 'vitest';
import {
  avatarDataUri,
  renderAvatarSvg,
  resolveAvatar,
  wantsBlink,
  wantsFollow,
} from '../src/render.js';

const NAMES = [
  'Sourav Nanda',
  'Ira',
  'Ada Lovelace',
  'Grace Hopper',
  '田中太郎',
  '😀',
  '',
  '   ',
  'A',
  'Zed 9',
];

describe('renderAvatarSvg', () => {
  it('is deterministic', () => {
    for (const name of NAMES) {
      expect(renderAvatarSvg(name)).toBe(renderAvatarSvg(name));
    }
  });

  it('produces different avatars for different names', () => {
    const a = renderAvatarSvg('Sourav Nanda');
    const b = renderAvatarSvg('Ira Kumar');
    expect(a).not.toBe(b);
  });

  it('never crashes on odd input and falls back to ?', () => {
    for (const name of NAMES) {
      expect(() => renderAvatarSvg(name)).not.toThrow();
    }
    expect(renderAvatarSvg('')).toContain('>?<');
  });

  it('contains the required named layers', () => {
    const svg = renderAvatarSvg('Sourav Nanda');
    for (const cls of ['bb-backdrop', 'bb-blob', 'bb-eyes', 'bb-mouth', 'bb-eye']) {
      expect(svg).toContain(cls);
    }
  });

  it('is flat: no gradients, no filters, no shadows', () => {
    for (const name of NAMES) {
      const svg = renderAvatarSvg(name, { animate: 'all' });
      expect(svg.toLowerCase()).not.toContain('gradient');
      expect(svg.toLowerCase()).not.toContain('<filter');
      expect(svg.toLowerCase()).not.toContain('filter=');
    }
  });

  it('has no Math.random / unseeded randomness', () => {
    // Rendered output is byte-identical across calls, which is impossible with
    // Math.random. This guards the whole pipeline.
    const first = renderAvatarSvg('No Random Please');
    for (let i = 0; i < 20; i++) {
      expect(renderAvatarSvg('No Random Please')).toBe(first);
    }
  });

  it('keeps static avatars small', () => {
    for (const name of NAMES) {
      const bytes = new TextEncoder().encode(renderAvatarSvg(name)).length;
      expect(bytes).toBeLessThan(2048);
    }
  });

  it('escapes names in attributes and titles', () => {
    const svg = renderAvatarSvg('"><script>alert(1)</script>', { title: true });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('applies size, rounded and className', () => {
    const svg = renderAvatarSvg('Sourav Nanda', { size: 96, rounded: true, className: 'mine' });
    expect(svg).toContain('width="96"');
    expect(svg).toContain('height="96"');
    expect(svg).toContain('border-radius:50%');
    expect(svg).toContain('mine');
  });
});

describe('blink tier', () => {
  it('is off by default and on with animate', () => {
    expect(wantsBlink({})).toBe(false);
    expect(wantsBlink({ animate: true })).toBe(true);
    expect(wantsBlink({ animate: 'blink' })).toBe(true);
    expect(wantsBlink({ animate: 'follow' })).toBe(false);
    expect(wantsBlink({ animate: 'all' })).toBe(true);
    expect(wantsBlink({ animate: true, blink: false })).toBe(false);
    expect(wantsBlink({ blink: true })).toBe(true);
  });

  it('emits a scoped style block and respects reduced motion', () => {
    const svg = renderAvatarSvg('Sourav Nanda', { animate: 'blink' });
    expect(svg).toContain('<style>');
    expect(svg).toContain('prefers-reduced-motion:reduce');
    expect(svg).toMatch(/@keyframes bb-[a-z0-9]+-blink/);
  });

  it('derives blink timing deterministically from the seed', () => {
    const a = resolveAvatar('Sourav Nanda');
    const b = resolveAvatar('Sourav Nanda');
    expect(a.blink.interval).toBe(b.blink.interval);
    expect(a.blink.delay).toBe(b.blink.delay);
    expect(a.blink.double).toBe(b.blink.double);

    const [min, max] = resolveAvatar('Sourav Nanda', { blinkInterval: [1000, 2000] }).blink
      .interval >= 1000
      ? [1000, 2000]
      : [0, 0];
    const iv = resolveAvatar('Sourav Nanda', { blinkInterval: [1000, 2000] }).blink.interval;
    expect(iv).toBeGreaterThanOrEqual(min);
    expect(iv).toBeLessThanOrEqual(max);
  });

  it('scopes class names with a seed prefix so avatars do not clash', () => {
    const a = renderAvatarSvg('Sourav Nanda', { animate: 'blink' });
    const b = renderAvatarSvg('Ira', { animate: 'blink' });
    const prefix = (s: string) => s.match(/class="bb (bb-[a-z0-9]+)/)?.[1];
    expect(prefix(a)).toBeTruthy();
    expect(prefix(a)).not.toBe(prefix(b));
    expect(a).toContain(`.${prefix(a)} .bb-eye`);
  });
});

describe('follow tier', () => {
  it('is opt-in', () => {
    expect(wantsFollow({})).toBe(false);
    expect(wantsFollow({ animate: 'follow' })).toBe(true);
    expect(wantsFollow({ animate: 'all' })).toBe(true);
    expect(wantsFollow({ animate: 'blink' })).toBe(false);
    expect(wantsFollow({ follow: true })).toBe(true);
  });
});

describe('avatarDataUri', () => {
  it('produces a usable data uri', () => {
    const uri = avatarDataUri('Sourav Nanda', { animate: 'blink' });
    expect(uri.startsWith('data:image/svg+xml,')).toBe(true);
    const decoded = decodeURIComponent(uri.slice('data:image/svg+xml,'.length));
    expect(decoded).toContain('<svg');
    expect(decoded).toContain('bb-eye');
  });
});
