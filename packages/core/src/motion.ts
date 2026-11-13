import type { FollowTarget, MotionOptions } from './types.js';
import { mulberry32 } from './hash.js';

/**
 * Tier 2 — cursor following.
 *
 * Exactly one `pointermove` listener per distinct target (usually just
 * `window`) and one shared `requestAnimationFrame` loop service every attached
 * avatar. Position is written as CSS variables (`--look-x` / `--look-y`) on the
 * svg element; the DOM is never re-rendered.
 *
 * SSR-safe: nothing touches `window` / `document` at import time.
 */

interface Entry {
  el: SVGSVGElement;
  options: MotionOptions;
  target: EventTarget | null;
  x: number;
  y: number;
  tx: number;
  ty: number;
  visible: boolean;
  winkUntil: number;
  surprised: boolean;
  glancing: boolean;
  glanceUntil: number;
  rng: () => number;
}

const entries = new Set<Entry>();
const targetEntries = new Map<EventTarget, Set<Entry>>();
const observers = new WeakMap<Element, IntersectionObserver>();

let rafId = 0;
let pointerX = 0;
let pointerY = 0;
let lastMoveTime = 0;
let hasPointer = false;
let listening = false;
let seq = 1;

const MOTION_STYLE_ID = 'bb-motion-styles';

const MOTION_CSS =
  // Only the facial features move — the colored blob and dark disk stay put.
  `.bb-motion .bb-eyes,.bb-motion .bb-mouth{transform-box:fill-box;transform-origin:center}` +
  `.bb-motion .bb-eyes{transform:translate(var(--look-x,0px),var(--look-y,0px)) scale(var(--bb-scale,1))}` +
  `.bb-motion .bb-mouth{transform:translate(calc(var(--look-x,0px) * 0.7),calc(var(--look-y,0px) * 0.7)) scale(var(--bb-scale,1))}` +
  `.bb-motion.bb-surprised{--bb-scale:1.06}` +
  `.bb-motion.bb-winking .bb-eyes>g:last-child .bb-eye{animation:bb-wink-anim .34s ease-in-out !important}` +
  `@keyframes bb-wink-anim{0%,100%{transform:scaleY(1)}45%{transform:scaleY(.1)}}` +
  `@media (prefers-reduced-motion:reduce){.bb-motion .bb-eyes,.bb-motion .bb-mouth{transform:none}}`;

function injectStyle(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(MOTION_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = MOTION_STYLE_ID;
  style.textContent = MOTION_CSS;
  document.head.appendChild(style);
}

function reducedMotion(options: MotionOptions): boolean {
  if (options.respectReducedMotion === false) return false;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function resolveTarget(target: FollowTarget | undefined): EventTarget | null {
  if (!target || target === 'window') {
    return typeof window !== 'undefined' ? window : null;
  }
  if (typeof target === 'object' && 'current' in target) {
    return target.current ?? null;
  }
  return target as EventTarget;
}

function addToTarget(entry: Entry): void {
  if (!entry.target) return;
  let set = targetEntries.get(entry.target);
  if (!set) {
    set = new Set();
    targetEntries.set(entry.target, set);
    entry.target.addEventListener('pointermove', onPointerMove as EventListener, { passive: true });
    entry.target.addEventListener('pointerdown', onPointerMove as EventListener, { passive: true });
  }
  set.add(entry);
}

function removeFromTarget(entry: Entry): void {
  if (!entry.target) return;
  const set = targetEntries.get(entry.target);
  if (!set) return;
  set.delete(entry);
  if (set.size === 0) {
    entry.target.removeEventListener('pointermove', onPointerMove as EventListener);
    entry.target.removeEventListener('pointerdown', onPointerMove as EventListener);
    targetEntries.delete(entry.target);
  }
}

function onPointerMove(event: Event): void {
  const e = event as PointerEvent;
  pointerX = e.clientX;
  pointerY = e.clientY;
  lastMoveTime = now();
  hasPointer = true;
  wake();
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function wake(): void {
  if (rafId) return;
  if (typeof requestAnimationFrame !== 'function') return;
  rafId = requestAnimationFrame(tick);
}

function tick(): void {
  rafId = 0;

  if (typeof document !== 'undefined' && document.hidden) {
    // Paused while the tab is hidden; resume on visibilitychange.
    return;
  }

  const time = now();
  const idle = time - lastMoveTime;
  let active = false;

  for (const entry of entries) {
    const { options } = entry;
    if (options.paused) continue;

    const rect = entry.el.getBoundingClientRect();
    const scale = rect.width / 100;
    const maxRange = (options.followRange ?? 6) * scale;

    let targetX = 0;
    let targetY = 0;
    let surprised = false;

    if (entry.visible && hasPointer) {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = pointerX - cx;
      const dy = pointerY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      targetX = (dx / dist) * maxRange;
      targetY = (dy / dist) * maxRange;
      surprised = dist < rect.width * 0.4;
    }

    // Idle glance: periodically look somewhere random when the pointer has
    // been still for a while.
    if (options.glance && !surprised && idle > (options.idleTimeout ?? 2500)) {
      if (!entry.glancing && entry.rng() < 0.02) {
        entry.glancing = true;
        entry.glanceUntil = time + 700 + entry.rng() * 900;
        targetX = (entry.rng() * 2 - 1) * maxRange;
        targetY = (entry.rng() * 2 - 1) * maxRange;
      }
      if (entry.glancing) {
        if (time < entry.glanceUntil) {
          targetX = entry.tx;
          targetY = entry.ty;
        } else {
          entry.glancing = false;
        }
      }
    } else if (entry.glancing) {
      entry.glancing = false;
    }

    // Ease back to centre after the idle timeout.
    if (entry.visible && hasPointer && idle > (options.idleTimeout ?? 2500)) {
      targetX = 0;
      targetY = 0;
    }

    entry.tx = targetX;
    entry.ty = targetY;

    const smoothing = clamp(options.smoothing ?? 0.15, 0, 1);
    entry.x += (targetX - entry.x) * smoothing;
    entry.y += (targetY - entry.y) * smoothing;

    if (Math.abs(targetX - entry.x) > 0.05 || Math.abs(targetY - entry.y) > 0.05) {
      active = true;
    }

    entry.el.style.setProperty('--look-x', `${round(entry.x)}px`);
    entry.el.style.setProperty('--look-y', `${round(entry.y)}px`);

    if (surprised !== entry.surprised) {
      entry.surprised = surprised;
      entry.el.classList.toggle('bb-surprised', surprised);
    }
  }

  if (active) wake();
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function round(v: number): number {
  return Math.round(v * 100) / 100;
}

function ensureGlobalListeners(): void {
  if (listening || typeof document === 'undefined') return;
  listening = true;
  document.addEventListener('visibilitychange', wake);
}

function removeGlobalListenersIfIdle(): void {
  if (!listening || entries.size > 0 || typeof document === 'undefined') return;
  listening = false;
  document.removeEventListener('visibilitychange', wake);
  if (rafId && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

function onWink(event: Event): void {
  const el = event.currentTarget as SVGSVGElement;
  const entry = findEntry(el);
  // Read live so toggling `wink` at runtime takes effect without re-attaching.
  if (!entry || !entry.options.wink) return;
  entry.el.classList.add('bb-winking');
  const timer = setTimeout(() => entry.el.classList.remove('bb-winking'), 360);
  winkTimers.set(entry, timer);
}

const winkTimers = new WeakMap<Entry, ReturnType<typeof setTimeout>>();

function findEntry(el: SVGSVGElement): Entry | undefined {
  for (const entry of entries) if (entry.el === el) return entry;
  return undefined;
}

function observe(entry: Entry): void {
  if (typeof IntersectionObserver === 'undefined') {
    entry.visible = true;
    return;
  }
  const observer = new IntersectionObserver((records) => {
    const record = records[0];
    if (!record) return;
    entry.visible = record.isIntersecting;
    if (entry.visible) wake();
  });
  observer.observe(entry.el);
  observers.set(entry.el, observer);
}

/**
 * Attach cursor-following motion to an inline SVG produced by
 * `renderAvatarSvg` (or the React component). Returns a cleanup function.
 */
export function attachAvatarMotion(
  svgElement: SVGSVGElement | null,
  options: MotionOptions = {},
): () => void {
  if (!svgElement) return () => {};
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};
  if (reducedMotion(options)) return () => {};

  injectStyle();

  const entry: Entry = {
    el: svgElement,
    options,
    target: resolveTarget(options.followTarget),
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    visible: true,
    winkUntil: 0,
    surprised: false,
    glancing: false,
    glanceUntil: 0,
    rng: mulberry32(0x9e3779b9 ^ (seq++ * 2654435761)),
  };

  entries.add(entry);
  addToTarget(entry);
  observe(entry);
  ensureGlobalListeners();
  svgElement.addEventListener('click', onWink);

  svgElement.classList.add('bb-motion');

  let alive = true;
  return () => {
    if (!alive) return;
    alive = false;
    entries.delete(entry);
    removeFromTarget(entry);
    const observer = observers.get(entry.el);
    if (observer) {
      observer.disconnect();
      observers.delete(entry.el);
    }
    svgElement.removeEventListener('click', onWink);
    const timer = winkTimers.get(entry);
    if (timer) clearTimeout(timer);
    svgElement.classList.remove('bb-motion', 'bb-winking', 'bb-surprised');
    svgElement.style.removeProperty('--look-x');
    svgElement.style.removeProperty('--look-y');
    removeGlobalListenersIfIdle();
  };
}
