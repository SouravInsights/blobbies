import { avatarDataUri, renderAvatarSvg } from '../src/render.js';
import { page, writePreview } from './preview-util.js';

const NAME = 'Sourav Nanda';

// 1. Static data URI (no animation) — proves the pipeline works in <img>.
const staticUri = avatarDataUri(NAME);
// 2. Blink-only data URI — CSS animation embedded in the SVG, works in <img>.
const blinkUri = avatarDataUri(NAME, { animate: 'blink' });

const inline = renderAvatarSvg(NAME, { size: 128, animate: 'blink', rounded: true });

const body = `
<h1>Blobbies — blink in &lt;img&gt;</h1>
<p class="sub">The blink is pure CSS embedded in the SVG, so it works even inside an image tag.</p>
<h2>Static &lt;img src="data:image/svg+xml,..."&gt;</h2>
<div class="cell"><img width="128" height="128" alt="static" src="${staticUri}" /></div>
<h2>Blinking &lt;img src="data:..."&gt;</h2>
<div class="cell"><img width="128" height="128" alt="blinking" src="${blinkUri}" /></div>
<h2>Inline SVG (blink + ready for cursor follow)</h2>
<div class="cell">${inline}</div>
`;

console.log('wrote', writePreview('blink-img.html', page('Blobbies blink in img', body)));
