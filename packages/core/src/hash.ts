/**
 * Deterministic hashing and seeded pseudo-random utilities.
 *
 * No `Math.random` is ever used anywhere in this package. Every visual
 * decision is derived from the input string through `cyrb53` + `mulberry32`.
 */

/** Unsigned 32-bit hash of a string. Stable across runs and platforms. */
export function hashString(input: string): number {
  return cyrb53(input, 0) >>> 0;
}

/**
 * cyrb53: a fast, well-distributed 53-bit string hash.
 * https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
 */
export function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** mulberry32 seeded PRNG. Returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convenience: create a seeded PRNG directly from a name string. */
export function createRng(input: string): () => number {
  return mulberry32(hashString(input));
}

/** Pick an array element using a seeded rng. */
export function pick<T>(rng: () => number, items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length) % items.length];
  // items is never empty in this codebase; guard keeps TS happy.
  return item as T;
}

/** Random float in [min, max) from a seeded rng. */
export function range(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}
