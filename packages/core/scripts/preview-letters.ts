import { LETTER_PATHS, renderLetter } from '../src/letters.js';
import { page, writePreview } from './preview-util.js';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
const SCALE = 1.1;
const X = (24 - 24 * SCALE) / 2;
const Y = (26 - 24 * SCALE) / 2;
const CX = X + 12 * SCALE;
const CY = Y + 12 * SCALE;

function cell(char: string, squash: boolean): string {
  const inner = renderLetter(char, { x: X, y: Y, scale: SCALE });
  const squashTransform = `translate(${CX} ${CY}) scale(1 0.1) translate(${-CX} ${-CY})`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 26" width="96" height="104">` +
    `<g${squash ? ` transform="${squashTransform}"` : ''}>` +
    inner +
    `</g></svg>`;
  return `<div class="cell">${svg}<small>${char}</small></div>`;
}

const normal = CHARS.map((c) => cell(c, false)).join('');
const blinked = CHARS.map((c) => cell(c, true)).join('');

const body = `
<h1>Blobbies — letters</h1>
<p class="sub">Flat-capped grotesque glyphs on a 24×24 grid. Missing paths: ${
  CHARS.filter((c) => !LETTER_PATHS[c]).join(', ') || 'none'
}</p>
<h2>Normal</h2>
<div class="grid" style="grid-template-columns: repeat(9, 1fr)">${normal}</div>
<h2>Squashed to scaleY(0.1) — the blink</h2>
<div class="grid" style="grid-template-columns: repeat(9, 1fr)">${blinked}</div>
`;

console.log(
  'wrote',
  writePreview(
    'letters.html',
    page(
      'Blobbies letters',
      body,
      'body{background:#f4f4f2;color:#111}h1,h2{color:#111}p.sub{color:#666}.cell small{color:#555}',
    ),
  ),
);
