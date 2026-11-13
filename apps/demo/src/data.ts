/**
 * Static content for the field guide. Nothing here is generated at runtime
 * except the name lists, which are seeded so the page is identical every load.
 */

export const FIRST = [
  'Ada', 'Grace', 'Sourav', 'Ira', 'John', 'Jane', 'Linus', 'Maya', 'Nina', 'Omar',
  'Priya', 'Quinn', 'Rosa', 'Sam', 'Tara', 'Uma', 'Vera', 'Wes', 'Xiu', 'Yara',
  'Zoe', 'Ken', 'Lena', 'Milo', 'Nadia', 'Owen', 'Pia', 'Rex', 'Sofia', 'Theo',
];

export const LAST = [
  'Nanda', 'Hopper', 'Lovelace', 'Doe', 'Chen', 'Singh', 'Patel', 'Khan', 'Ali',
  'Garcia', 'Rossi', 'Muller', 'Novak', 'Silva', 'Haddad', 'Kim', 'Nakamura',
  'Okafor', 'Petrov', 'Dubois', 'Adeyemi', 'Kowalski', 'Ibrahim', 'Vargas',
];

/** Deterministic name list, so the colony is the same on every load. */
export function buildNames(count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST[(i * 7 + 3) % FIRST.length] as string;
    const last = LAST[(i * 11 + 5) % LAST.length] as string;
    // every 11th is a single name, to show the two-letters-of-one-word case
    out.push(i % 11 === 0 ? first : `${first} ${last}`);
  }
  return out;
}

export const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');

/** Real, computable facts. No adjectives. */
export const FACTS = {
  staticBytes: 1358,
  motionGzipBytes: 1964,
  palettes: 9,
  shapes: 5,
  mouths: 5,
  blush: 2,
  tilts: 4,
};

export const BUILDS = FACTS.palettes * FACTS.shapes * FACTS.mouths * FACTS.blush * FACTS.tilts;
export const EYE_PAIRS = GLYPHS.length * GLYPHS.length;
export const COMBINATIONS = BUILDS * EYE_PAIRS;

export const INSTALL = 'npm i blobbies @blobbies/react';

export const QUICK_START = `import { renderAvatarSvg } from 'blobbies'

renderAvatarSvg('Sourav Nanda')            // → <svg …>
renderAvatarSvg('Sourav Nanda', {
  animate: 'blink',                        // pure CSS, works in <img>
})`;

export const REACT_SNIPPET = `import { Avatar } from '@blobbies/react'

<Avatar
  name="Sourav Nanda"
  size={64}
  animate="all"   // blink + follow
  wink            // wink on click
/>`;

export const MOTION_SNIPPET = `import { attachAvatarMotion } from 'blobbies/motion'

const stop = attachAvatarMotion(svgEl, {
  followRange: 6,
  smoothing: 0.15,
  idleTimeout: 2500,
})

stop()  // removes the listener`;