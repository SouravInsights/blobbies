/**
 * Content for the page. The name lists are generated with a fixed stride so
 * the page is byte-identical on every load (no Math.random anywhere).
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

export function buildNames(count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST[(i * 7 + 3) % FIRST.length] as string;
    const last = LAST[(i * 11 + 5) % LAST.length] as string;
    // every 11th is a single name, so the two-letters-of-one-word case shows up
    out.push(i % 11 === 0 ? first : `${first} ${last}`);
  }
  return out;
}

export const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');

export const PALETTE_SIZE = 9;
export const BUILDS = 9 * 5 * 5 * 2 * 4; // palettes × eggs × mouths × blush × tilts
export const EYE_PAIRS = GLYPHS.length * GLYPHS.length;
export const TOTAL = BUILDS * EYE_PAIRS;

export const INSTALL = 'npm i blobbies @blobbies/react';
export const REPO = 'https://github.com/SouravInsights/blobbies';
export const NPM = 'https://www.npmjs.com/package/blobbies';

export const CORE_SNIPPET = `import { renderAvatarSvg } from 'blobbies'

renderAvatarSvg('Sourav Nanda')`;

export const DATA_URI_SNIPPET = `import { avatarDataUri } from 'blobbies'

img.src = avatarDataUri('Sourav Nanda')`;

export const REACT_SNIPPET = `import { Avatar } from '@blobbies/react'

<Avatar name="Sourav Nanda" size={40} />`;

export const MOTION_SNIPPET = `import { attachAvatarMotion } from 'blobbies/motion'

const stop = attachAvatarMotion(svgEl, {
  followRange: 6,
  smoothing: 0.15,
})

stop() // removes the listener`;
