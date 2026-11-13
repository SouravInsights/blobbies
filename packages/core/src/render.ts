import { getInitials } from './initials.js';
import { createRng, hashString } from './hash.js';
import { PALETTE } from './palette.js';
import { decideTraits, renderBackdrop, renderBlob, renderDiskClip, renderEyes, renderMouth } from './parts.js';
import type { AvatarOptions } from './types.js';

export interface ResolvedAvatar {
  name: string;
  letters: string;
  prefix: string;
  body: string;
  blink: { enabled: boolean; interval: number; delay: number; double: boolean };
}

/** Byte size helper used by tests / previews. */
export function avatarByteLength(svg: string): number {
  return new TextEncoder().encode(svg).length;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Resolve every seeded decision for a name. Pure and deterministic.
 */
export function resolveAvatar(name: string, options: AvatarOptions = {}): ResolvedAvatar {
  const safeName = typeof name === 'string' && name.trim() !== '' ? name : '?';
  const letters = getInitials(safeName);
  const hash = hashString(safeName);
  const prefix = `bb-${hash.toString(36)}`;
  const rng = createRng(safeName);
  const palette = options.palette && options.palette.length > 0 ? options.palette : PALETTE;

  const traits = decideTraits({ rng, palette });

  const [minInterval, maxInterval] = options.blinkInterval ?? [2500, 6000];
  const interval = round(minInterval + rng() * Math.max(0, maxInterval - minInterval));
  const delay = round(rng() * interval);
  const double = rng() < 0.25;

  // Seed-derived id so multiple avatars on one page never collide.
  const clipId = `${prefix}-c`;
  const body =
    renderDiskClip(clipId) +
    renderBackdrop(traits.backdropDir) +
    renderBlob(traits, clipId) +
    renderEyes(letters) +
    renderMouth(traits.mouthIndex);

  return {
    name: safeName,
    letters,
    prefix,
    body,
    blink: { enabled: false, interval, delay, double },
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildBlinkStyle(
  prefix: string,
  interval: number,
  delay: number,
  double: boolean,
): string {
  const name = `${prefix}-blink`;
  const keyframes = double
    ? // ~1 in 4 blinks is a quick double blink
      `0%,72%,100%{transform:scaleY(1)}75%{transform:scaleY(.1)}78%{transform:scaleY(1)}81%{transform:scaleY(.1)}`
    : `0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}`;

  return (
    `<style>` +
    `.${prefix} .bb-eye{transform-box:fill-box;transform-origin:center;animation:${name} ${interval}ms ease-in-out ${delay}ms infinite}` +
    `@keyframes ${name}{${keyframes}}` +
    `@media (prefers-reduced-motion:reduce){.${prefix} .bb-eye{animation:none}}` +
    `</style>`
  );
}

/** Should the CSS blink be embedded? */
export function wantsBlink(options: AvatarOptions): boolean {
  if (options.blink === false) return false;
  if (options.blink === true) return true;
  const a = options.animate;
  return a === true || a === 'blink' || a === 'all';
}

/** Should JS cursor following be requested? */
export function wantsFollow(options: AvatarOptions): boolean {
  if (options.follow === false) return false;
  if (options.follow === true) return true;
  const a = options.animate;
  return a === 'follow' || a === 'all';
}

/**
 * Inner markup for the avatar (layers + optional scoped blink style).
 * Useful for framework wrappers that own the outer <svg> element.
 */
export function renderAvatarBody(name: string, options: AvatarOptions = {}): ResolvedAvatar {
  const resolved = resolveAvatar(name, options);
  const blinkOn = wantsBlink(options);
  const style = blinkOn
    ? buildBlinkStyle(
        resolved.prefix,
        resolved.blink.interval,
        resolved.blink.delay,
        resolved.blink.double,
      )
    : '';
  return {
    ...resolved,
    blink: { ...resolved.blink, enabled: blinkOn },
    body: resolved.body + style,
  };
}

function attr(name: string, value: string | number | undefined): string {
  return value === undefined ? '' : ` ${name}="${value}"`;
}

/** Full standalone SVG string. Works as an <img src="data:...">. */
export function renderAvatarSvg(name: string, options: AvatarOptions = {}): string {
  const resolved = renderAvatarBody(name, options);
  const size = options.size ?? 48;
  const classes = ['bb', resolved.prefix, options.className].filter(Boolean).join(' ');
  const style = options.rounded ? ' style="border-radius:50%"' : '';
  const title = options.title ? `<title>${escapeXml(resolved.name)}</title>` : '';

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${escapeXml(resolved.name)}"` +
    ` width="${escapeXml(String(size))}" height="${escapeXml(String(size))}" class="${classes}"${style}>` +
    title +
    resolved.body +
    `</svg>`
  );
}

/**
 * Encode an avatar as a data URI. Cursor following cannot work inside an
 * <img>, so only static and blink-only avatars are encoded.
 */
export function avatarDataUri(name: string, options: AvatarOptions = {}): string {
  const svg = renderAvatarSvg(name, options);
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
