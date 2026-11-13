import { describe, expect, it } from 'vitest';

/**
 * Runs in the plain node environment (no jsdom). Importing the library must not
 * touch `window` / `document`, otherwise this file would throw at import time.
 */
describe('SSR safety', () => {
  it('imports core without a DOM', async () => {
    const mod = await import('../src/index.js');
    expect(typeof mod.renderAvatarSvg).toBe('function');
    expect(typeof mod.getInitials).toBe('function');
    expect(mod.renderAvatarSvg('Sourav Nanda')).toContain('<svg');
  });

  it('imports the motion entry without a DOM', async () => {
    const mod = await import('../src/motion.js');
    expect(typeof mod.attachAvatarMotion).toBe('function');
    // Attaching in a non-DOM environment is a safe no-op.
    expect(() => mod.attachAvatarMotion(null)()).not.toThrow();
  });
});
