import { describe, expect, it } from 'vitest';
import { createRng, cyrb53, hashString, mulberry32 } from '../src/hash.js';

describe('hash', () => {
  it('cyrb53 is stable and well distributed', () => {
    expect(cyrb53('hello')).toBe(cyrb53('hello'));
    expect(cyrb53('hello')).not.toBe(cyrb53('world'));
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(hashString(`name-${i}`));
    expect(seen.size).toBeGreaterThan(1995);
  });

  it('hashString returns an unsigned 32-bit integer', () => {
    const h = hashString('Sourav Nanda');
    expect(h).toBe(h >>> 0);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(2 ** 32);
  });

  it('mulberry32 is deterministic and in range', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('createRng reseeds from the name', () => {
    expect(createRng('x')()).toBe(createRng('x')());
    expect(createRng('x')()).not.toBe(createRng('y')());
  });
});
