import { renderAvatarSvg } from '../src/render.js';
import { page, writePreview } from './preview-util.js';

const FIRST = 'Ada Grace Sourav Ira John Jane Linus Maya Nina Omar Priya Quinn Rosa Sam Tara Uma Vera Wes Xiu Yara Zoe'.split(
  ' ',
);
const LAST = 'Nanda Hopper Lovelace Doe Chen Singh Patel Khan Ali Garcia Rossi Muller Novak Silva Haddad Kim'.split(
  ' ',
);

const NAMES: string[] = [];
for (let i = 0; i < 100; i++) {
  const first = FIRST[i % FIRST.length] as string;
  const last = LAST[(i * 7 + 3) % LAST.length] as string;
  NAMES.push(i % 11 === 0 ? first : `${first} ${last}`);
}

const SIZE = 88;

function cell(name: string): string {
  const svg = renderAvatarSvg(name, { size: SIZE, animate: 'blink' });
  return `<div class="cell">${svg}<small>${name}</small></div>`;
}

const dark = NAMES.map(cell).join('');
const light = NAMES.slice(0, 24).map(cell).join('');

const body = `
<h1>Blobbies — 100 avatars</h1>
<p class="sub">Deterministic from the name. Dark page background, blink enabled.</p>
<div class="grid" style="grid-template-columns: repeat(10, 1fr)">${dark}</div>
<h2>On a light background</h2>
<div class="light"><div class="grid" style="grid-template-columns: repeat(8, 1fr); --bb-light:1">${light}</div></div>
`;

console.log('wrote', writePreview('avatars.html', page('Blobbies avatars', body)));
