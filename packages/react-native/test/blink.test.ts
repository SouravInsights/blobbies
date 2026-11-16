import { describe, expect, it } from 'vitest';
import { blinkScaleAtPhase, firstActivePhase } from '../src/blink.js';

/**
 * The blink must match the web's CSS keyframes exactly. If these numbers drift,
 * React Native stops being the same product as the web.
 */
describe('blink keyframes match the web CSS', () => {
  it('single: open until 92%, dips to 0.1 at 95%, back at 100%', () => {
    expect(blinkScaleAtPhase(0, false)).toBe(1);
    expect(blinkScaleAtPhase(0.5, false)).toBe(1);
    expect(blinkScaleAtPhase(0.92, false)).toBe(1);
    expect(blinkScaleAtPhase(0.95, false)).toBeCloseTo(0.1, 3);
    expect(blinkScaleAtPhase(1, false)).toBeCloseTo(1, 3);
  });

  it('double: dips at 75% and 81%, open again at 78%', () => {
    expect(blinkScaleAtPhase(0.75, true)).toBeCloseTo(0.1, 3);
    expect(blinkScaleAtPhase(0.78, true)).toBeCloseTo(1, 3);
    expect(blinkScaleAtPhase(0.81, true)).toBeCloseTo(0.1, 3);
  });

  it('starts the dip at the same phase the web does', () => {
    expect(firstActivePhase(false)).toBe(0.92);
    expect(firstActivePhase(true)).toBe(0.72);
  });
});
