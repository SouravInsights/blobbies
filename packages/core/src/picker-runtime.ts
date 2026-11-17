/**
 * The Look Map runtime — the picker's behaviour, with no framework in it.
 *
 * Everything the picker *does* lives here: the wrap-around map, the gesture
 * machine (press → drag → glide → snap), the lens, the measurement, the value
 * and the reporting. A binding's job shrinks to chrome: render the header, the
 * mood row and the buttons, read the snapshot, call the methods.
 *
 * That is the same shape as motion, which ships as `attachAvatarMotion(el)` and
 * is called by React, by `<blobbies-avatar>`, and by anything else that has an
 * element. One implementation of the behaviour means one place for it to be
 * right, and no way for two bindings to drift.
 *
 * The surface is built here rather than by the binding because it is fixed —
 * a viewport, a world and 35 cells — and because it is re-written every frame
 * during a pan. Handing that to a framework's reconciler would be slower and
 * would buy nothing: nothing about those 35 cells is declarative.
 */
import { EXPRESSIONS, EXPRESSION_COUNT, EXPRESSION_NAMES } from './parts.js';
import { PALETTE } from './palette.js';
import { renderAvatarBody } from './render.js';
import { attachAvatarMotion } from './motion.js';
import type { AvatarExpression, AvatarOptions } from './types.js';
import {
  CENTER_COLUMN,
  CENTER_ROW,
  COLUMNS,
  GRID_PADDING,
  MAX_GAP,
  ROWS,
  gridMetrics,
  lensCell,
  lensEffect,
  lookCells,
  wrapIndex,
} from './look-map.js';
import { cellAtPoint, dragSlop, exceedsSlop } from './picker-gesture.js';
import type { CellIndex } from './look-map.js';

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** A stable key for a look, for "did this actually change?" comparisons. */
function valueKey(value: AvatarOptions): string {
  return `${value.color}.${value.expression}.${value.blush}`;
}

export interface PickerOptions {
  /** The person's name — the eyes every look shares. */
  name: string;
  /** The look to open on. Changing it after creation does not reset the map. */
  defaultValue?: AvatarOptions;
  /** The colours the map offers. Defaults to the built-in palette. */
  palette?: readonly string[];
  /** Run the depth-of-field spotlight while hovering. Default: true. */
  spotlight?: boolean;
  /** Called with the current look whenever it changes, never on creation. */
  onChange?: (value: AvatarOptions) => void;
  onSave?: (value: AvatarOptions) => void;
  onCancel?: () => void;
  /** Injected so the runtime is testable, and so a host can force it. */
  reducedMotion?: boolean;
}

export interface PickerSnapshot {
  name: string;
  value: AvatarOptions;
  changed: boolean;
  blush: boolean;
  /** The mood under the lens, which is what the mood row reads out. */
  expressionName: string;
  spotlight: boolean;
  palette: readonly string[];
  dragging: boolean;
  moving: boolean;
}

export interface PickerRuntime {
  /** The map. Put it wherever the layout wants it, then call `measure()`. */
  readonly surface: HTMLElement;
  getSnapshot(): PickerSnapshot;
  subscribe(listener: () => void): () => void;
  nextExpression(): void;
  previousExpression(): void;
  toggleBlush(): void;
  toggleSpotlight(): void;
  reset(): void;
  save(): void;
  cancel(): void;
  readonly hasCancel: boolean;
  /** Measure the box the surface lives in. Call after mounting it. */
  measure(): void;
  destroy(): void;
}

/** The avatar inside a cell. A string, because 35 of them are not declarative. */
function cellSvg(
  name: string,
  color: string,
  expression: AvatarExpression,
  blush: boolean,
  size: number,
): string {
  const resolved = renderAvatarBody(name, {
    color,
    expression,
    blush,
    size,
    animate: 'blink',
    blinkInterval: [4000, 10000],
  });
  const label = escapeAttr(name);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" ` +
    `aria-label="${label}" width="${size}" height="${size}" ` +
    `class="bb ${resolved.prefix}" data-blobbies="${escapeAttr(resolved.letters)}">` +
    `${resolved.body}</svg>`
  );
}

const CHECK_PATH = '<path d="M2.5 6.2 4.8 8.5 9.5 3.5"/>';

function surfaceHtml(): string {
  const cells: string[] = [];
  for (let row = -1; row <= ROWS; row++) {
    for (let column = -1; column <= COLUMNS; column++) {
      cells.push(
        `<div class="bb-picker-cell" data-key="${column}:${row}" aria-hidden="true">` +
          `<span class="bb-picker-lift"></span>` +
          `<span class="bb-picker-ring" aria-hidden="true"></span>` +
          `<span class="bb-picker-check" aria-hidden="true">` +
          `<svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" ` +
          `stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${CHECK_PATH}</svg>` +
          `</span></div>`,
      );
    }
  }
  return (
    `<div class="bb-picker-surface" role="group" tabindex="0" ` +
    `aria-label="A map of looks. Drag, swipe or use the arrow keys." data-part="surface">` +
    `<div class="bb-picker-viewport"><div class="bb-picker-world">` +
    cells.join('') +
    `</div></div></div>`
  );
}

function looksLikeTrackpad(event: WheelEvent): boolean {
  if (event.ctrlKey || event.deltaMode !== 0) return false;
  return event.deltaX !== 0 || Math.abs(event.deltaY) < 40 || !Number.isInteger(event.deltaY);
}

/**
 * Build a picker. Returns `null` where there is no DOM, so a binding can create
 * one in a browser effect and skip it on the server.
 */
export function createPicker(options: PickerOptions): PickerRuntime | null {
  if (typeof document === 'undefined') return null;

  const {
    name,
    defaultValue,
    palette = PALETTE,
    spotlight = true,
    onChange,
    onSave,
    onCancel,
    reducedMotion,
  } = options;

  /* ------------------------------------------------------------- state */

  const startColor = (() => {
    const i = defaultValue?.color ? palette.indexOf(defaultValue.color) : CENTER_COLUMN;
    return i >= 0 ? i : CENTER_COLUMN;
  })();
  const startExpression = (() => {
    const i = defaultValue?.expression ? EXPRESSIONS.indexOf(defaultValue.expression) : CENTER_ROW;
    return i >= 0 ? i : CENTER_ROW;
  })();
  const startBlush = defaultValue?.blush ?? true;

  let cell = 68;
  let gap = MAX_GAP;
  let blush = startBlush;
  let spotlightOn = spotlight;
  let dragging = false;
  let stepping = false;
  let settling = false;
  let hover: CellIndex | null = null;
  let pinned: { color: number; expression: number } | null = null;

  // World origin, in whole cells. Wraps forever.
  let ox = startColor - CENTER_COLUMN;
  let oy = startExpression - CENTER_ROW;
  // Sub-cell position, in pixels, and the velocity that carries it.
  let pos = { x: 0, y: 0 };
  let vel = { x: 0, y: 0 };
  let mode: 'idle' | 'press' | 'drag' | 'glide' | 'snap' = 'idle';
  let center: CellIndex = { column: CENTER_COLUMN, row: CENTER_ROW };

  const reduced =
    reducedMotion ??
    (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false);

  let raf = 0;
  let stepRaf = 0;
  let stepOffset = 0;
  let stepDelta = 0;

  // What the cells were last drawn for, so a pan only rebuilds them when the
  // wrapped colour or mood actually changes rather than every frame.
  let drawnOx = Number.NaN;
  let drawnOy = Number.NaN;

  /* --------------------------------------------------------------- DOM */

  const host = document.createElement('div');
  host.innerHTML = surfaceHtml();
  const surface = host.firstElementChild as HTMLElement;
  const world = surface.querySelector<HTMLElement>('.bb-picker-world') as HTMLElement;
  const syncDragging = (): void => {
    if (dragging) surface.setAttribute('data-dragging', '1');
    else surface.removeAttribute('data-dragging');
  };

  const cellEls = new Map<string, HTMLElement>();
  for (const el of surface.querySelectorAll<HTMLElement>('.bb-picker-cell')) {
    const key = el.dataset.key;
    if (key) cellEls.set(key, el);
  }

  /* ------------------------------------------------------------ notify */

  const listeners = new Set<() => void>();
  let snapshot: PickerSnapshot = buildSnapshot();
  /** The last value handed to `onChange`. Seeded here, so the look the picker
   *  opens on is never reported as a change. */
  let reported = valueKey(snapshot.value);
  /** Everything the snapshot shows, so a listener hears about a real change
   *  and not about every frame of a pan. */
  let lastKey = currentKey();

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function notify(): void {
    snapshot = buildSnapshot();
    for (const listener of listeners) listener();
    report();
  }

  /**
   * Everything a listener can see. A pan changes these once per cell, not once
   * per frame, so a binding is never asked to re-render mid-glide.
   */
  function currentKey(): string {
    const c = selected();
    const where = hover ? `${hover.column}:${hover.row}` : '-';
    return (
      `${c.color}.${c.expression}.${blush}.${spotlightOn}` +
      `.${dragging}.${stepping}.${settling}` +
      `.${center.column}.${center.row}.${where}`
    );
  }

  function notifyIfChanged(): void {
    const key = currentKey();
    if (key === lastKey) return;
    lastKey = key;
    notify();
  }

  /* -------------------------------------------------------------- lens */

  let lensOn = false;
  let positioned = false;

  function renderLens(): void {
    const p = pitch();
    const size = cell;
    const hovered = hover && !dragging && !stepping && !settling ? hover : null;

    if (!hovered) {
      if (!lensOn && positioned) return;
      lensOn = false;
      positioned = true;
      for (const [, el] of cellEls) {
        el.style.transform = '';
        el.style.opacity = '1';
        el.style.filter = '';
      }
      return;
    }

    lensOn = true;
    positioned = true;
    for (const [key, el] of cellEls) {
      const [column, row] = key.split(':').map(Number) as [number, number];
      const { dx, dy, opacity, blur } = lensEffect({
        cell: { column, row },
        lens: hovered,
        pitch: p,
        size,
        offsetX: pos.x,
        offsetY: pos.y,
        push: !reduced,
        spotlight: spotlightOn,
      });
      // Base position is `left`/`top`, which is never transitioned; the lens
      // push rides on `transform`, so a re-wrap moves the grid instantly
      // instead of animating 35 cells across the screen.
      el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.filter = blur > 0.06 ? `blur(${blur.toFixed(2)}px)` : '';
    }
  }

  /* ------------------------------------------------------------ layout */

  function pitch(): number {
    return cell + gap;
  }

  function surfaceWidth(): number {
    return COLUMNS * cell + (COLUMNS - 1) * gap + GRID_PADDING * 2;
  }

  function surfaceHeight(): number {
    return ROWS * cell + (ROWS - 1) * gap + GRID_PADDING * 2;
  }

  function drawLayout(): void {
    const p = pitch();
    const size = cell;
    surface.style.width = `${surfaceWidth()}px`;
    surface.style.height = `${surfaceHeight()}px`;
    for (const [key, el] of cellEls) {
      const [column, row] = key.split(':').map(Number) as [number, number];
      el.style.left = `${column * p}px`;
      el.style.top = `${row * p}px`;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
    }
    apply();
  }

  /* ------------------------------------------------------------ cells */

  function selected(): { color: number; expression: number } {
    return (
      pinned ?? {
        color: wrapIndex(ox + center.column, palette.length),
        expression: wrapIndex(oy + center.row, EXPRESSION_COUNT),
      }
    );
  }

  function focusCell(): CellIndex | null {
    if (dragging || stepping || settling) return null;
    if (hover) return hover;
    // Otherwise the lens rests on the cell holding the current value, so the
    // chosen face is the one shown at full size.
    const chosen = selected();
    for (const c of lookCells(ox, oy, palette.length, EXPRESSION_COUNT)) {
      if (c.color === chosen.color && c.expression === chosen.expression) {
        return { column: c.column, row: c.row };
      }
    }
    return center;
  }

  let motionStop: (() => void) | undefined;
  let motionEl: SVGSVGElement | null = null;
  // `attachAvatarMotion` is the follow runtime itself: attaching it is what
  // makes a cell follow, so there is no `follow` flag to pass. Its defaults are
  // the picker's defaults.
  const motionOptions = {};

  function syncMotion(): void {
    const focus = focusCell();
    const el = focus ? cellEls.get(`${focus.column}:${focus.row}`) : null;
    const svg = el?.querySelector('svg') ?? null;
    if (svg === motionEl) return;
    motionStop?.();
    motionStop = undefined;
    motionEl = svg;
    if (svg) motionStop = attachAvatarMotion(svg, motionOptions);
  }

  function syncCells(): void {
    if (ox === drawnOx && oy === drawnOy) {
      syncMarkers();
      syncMotion();
      return;
    }
    drawnOx = ox;
    drawnOy = oy;
    for (const c of lookCells(ox, oy, palette.length, EXPRESSION_COUNT)) {
      const el = cellEls.get(c.key);
      const lift = el?.querySelector<HTMLElement>('.bb-picker-lift');
      if (!lift) continue;
      lift.innerHTML = cellSvg(
        name,
        palette[c.color] as string,
        EXPRESSIONS[c.expression] as AvatarExpression,
        blush,
        cell,
      );
    }
    syncMarkers();
    syncMotion();
  }

  function syncMarkers(): void {
    const focus = focusCell();
    const chosen = selected();
    const moving = dragging || stepping || settling;
    for (const c of lookCells(ox, oy, palette.length, EXPRESSION_COUNT)) {
      const el = cellEls.get(c.key);
      if (!el) continue;
      const on = !!focus && c.column === focus.column && c.row === focus.row;
      if (on) el.setAttribute('data-focus', '1');
      else el.removeAttribute('data-focus');
      el.style.zIndex = on ? '6' : '1';
      const check = el.querySelector<HTMLElement>('.bb-picker-check');
      const chosenHere = !moving && c.color === chosen.color && c.expression === chosen.expression;
      if (check) {
        if (chosenHere) check.setAttribute('data-on', '1');
        else check.removeAttribute('data-on');
      }
    }
  }

  /** Rebuild everything the DOM shows from the current state. */
  function flush(): void {
    syncCells();
    syncDragging();
    renderLens();
  }

  /* ------------------------------------------------------------- world */

  function writeWorld(): void {
    world.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
  }

  function apply(): void {
    writeWorld();
    center = lensCell(pos.x, pos.y, pitch());
    flush();
    notifyIfChanged();
  }

  /** Fold whole pitches of travel back into the origin, so it never grows. */
  function normalize(): void {
    const p = pitch();
    const nx = Math.floor(pos.x / p);
    const ny = Math.floor(pos.y / p);
    if (nx !== 0) {
      ox -= nx;
      pos.x -= nx * p;
    }
    if (ny !== 0) {
      oy -= ny;
      pos.y -= ny * p;
    }
  }

  function request(): void {
    if (raf) return;
    raf = requestAnimationFrame(function tick() {
      raf = 0;
      const p = pitch();
      if (mode === 'glide') {
        pos.x += vel.x;
        pos.y += vel.y;
        vel.x *= 0.9;
        vel.y *= 0.9;
        if (Math.abs(vel.x) < 0.4 && Math.abs(vel.y) < 0.4) mode = 'snap';
        normalize();
        apply();
        request();
      } else if (mode === 'snap') {
        const tx = pos.x < p / 2 ? 0 : p;
        const ty = pos.y < p / 2 ? 0 : p;
        const done = Math.abs(tx - pos.x) < 0.4 && Math.abs(ty - pos.y) < 0.4;
        if (done) {
          pos = { x: tx, y: ty };
          normalize();
          apply();
          mode = 'idle';
          settling = false;
          flush();
          notifyIfChanged();
        } else {
          pos.x += (tx - pos.x) * 0.22;
          pos.y += (ty - pos.y) * 0.22;
          normalize();
          apply();
          request();
        }
      }
    });
  }

  function stopAnimation(): void {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function stepMood(delta: number): void {
    if (stepRaf) return;
    pinned = null;
    if (reduced) {
      oy += delta;
      apply();
      return;
    }
    stepping = true;
    stepDelta = delta;
    notifyIfChanged();
    const p = pitch();
    const to = -delta * p;
    const began = performance.now();
    const dur = 300;
    const tick = (now: number): void => {
      const t = Math.min(1, (now - began) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      stepOffset = to * eased;
      world.style.transform = `translate3d(${pos.x}px, ${pos.y + stepOffset}px, 0)`;
      renderLens();
      if (t < 1) {
        stepRaf = requestAnimationFrame(tick);
      } else {
        oy += delta;
        stepOffset = 0;
        stepRaf = 0;
        stepping = false;
        apply();
      }
    };
    stepRaf = requestAnimationFrame(tick);
  }

  function cellUnder(clientX: number, clientY: number): CellIndex | null {
    const rect = surface.getBoundingClientRect();
    return cellAtPoint({
      x: clientX - rect.left,
      y: clientY - rect.top,
      pad: GRID_PADDING,
      offsetX: pos.x,
      offsetY: pos.y,
      pitch: pitch(),
      width: COLUMNS * cell + (COLUMNS - 1) * gap,
      height: ROWS * cell + (ROWS - 1) * gap,
    });
  }

  /* ---------------------------------------------------------- gestures */

  let activePointer: number | null = null;
  let downCell: CellIndex | null = null;
  let startPt = { x: 0, y: 0 };
  let lastPt = { x: 0, y: 0 };
  let slop = 0;

  function onPointerDown(event: PointerEvent): void {
    // Only the primary button starts a gesture. `> 0` rejects middle and right
    // clicks while still accepting touch and pen, whose `button` may be 0 or
    // absent depending on the engine.
    if (event.button > 0) return;
    // One pointer owns the map: a second finger, or a system gesture, must not
    // teleport it or restart the drag.
    if (activePointer !== null) return;
    activePointer = event.pointerId;
    try {
      surface.setPointerCapture(event.pointerId);
    } catch {
      /* capture is best-effort */
    }

    stopAnimation();
    if (stepRaf) {
      cancelAnimationFrame(stepRaf);
      stepRaf = 0;
      oy += stepDelta;
      stepOffset = 0;
      stepping = false;
      apply();
    }

    // Record the cell at press, not at release. The map can glide, and a
    // resize can change the pitch, between down and up; neither may change
    // which face a tap means.
    downCell = cellUnder(event.clientX, event.clientY);
    mode = 'press';
    slop = dragSlop(event.pointerType);
    startPt = { x: event.clientX, y: event.clientY };
    lastPt = { x: event.clientX, y: event.clientY };
    vel = { x: 0, y: 0 };
    hover = null;
    flush();
    notifyIfChanged();
  }

  function onPointerMove(event: PointerEvent): void {
    if (mode === 'press' || mode === 'drag') {
      if (event.pointerId !== activePointer) return;

      if (mode === 'press') {
        // A finger rests a few pixels from where it landed. Only past the slop
        // does intent become a drag, and the movement past the slop is carried
        // into the pan so the map follows from the moment it became a drag —
        // the slack is dropped, nothing else.
        if (exceedsSlop(startPt, { x: event.clientX, y: event.clientY }, slop)) {
          mode = 'drag';
          const dx = event.clientX - startPt.x;
          const dy = event.clientY - startPt.y;
          const dist = Math.hypot(dx, dy) || 1;
          const carry = (dist - slop) / dist;
          pos.x += dx * carry;
          pos.y += dy * carry;
          lastPt = { x: event.clientX, y: event.clientY };
          vel = { x: clamp(dx * 0.85, -40, 40), y: clamp(dy * 0.85, -40, 40) };
          normalize();
          pinned = null;
          dragging = true;
          apply();
        }
        return;
      }

      const dx = event.clientX - lastPt.x;
      const dy = event.clientY - lastPt.y;
      lastPt = { x: event.clientX, y: event.clientY };
      pos.x += dx;
      pos.y += dy;
      vel = { x: clamp(dx * 0.85, -40, 40), y: clamp(dy * 0.85, -40, 40) };
      normalize();
      apply();
      return;
    }

    // A resting finger is not a cursor; skip the hover maths on touch.
    if (event.pointerType === 'touch') return;
    const at = cellUnder(event.clientX, event.clientY);
    const same = at && hover && at.column === hover.column && at.row === hover.row;
    if (!same) {
      hover = at;
      flush();
      notifyIfChanged();
    }
  }

  function endDrag(event: PointerEvent, commit: boolean): void {
    if (activePointer !== null && event.pointerId !== activePointer) return;
    activePointer = null;
    if (mode !== 'press' && mode !== 'drag') return;
    const wasTap = mode === 'press';
    dragging = false;

    if (wasTap && commit && downCell) {
      pinned = {
        color: wrapIndex(ox + downCell.column, palette.length),
        expression: wrapIndex(oy + downCell.row, EXPRESSION_COUNT),
      };
    }
    hover = null;
    downCell = null;

    if (reduced) {
      const p = pitch();
      pos.x = pos.x < p / 2 ? 0 : p;
      pos.y = pos.y < p / 2 ? 0 : p;
      normalize();
      mode = 'idle';
      apply();
      return;
    }
    mode = 'glide';
    settling = true;
    apply();
    request();
  }

  function onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        pinned = null;
        ox += 1;
        apply();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        pinned = null;
        ox -= 1;
        apply();
        break;
      case 'ArrowDown':
        event.preventDefault();
        stepMood(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        stepMood(-1);
        break;
      default:
        break;
    }
  }

  function onWheel(event: WheelEvent): void {
    if (!looksLikeTrackpad(event)) return;
    event.preventDefault();
    if (reduced) {
      if (event.deltaX) ox += event.deltaX > 0 ? 1 : -1;
      if (event.deltaY) oy += event.deltaY > 0 ? 1 : -1;
      apply();
      return;
    }
    stopAnimation();
    pos.x += event.deltaX;
    pos.y += event.deltaY;
    vel = {
      x: clamp(event.deltaX * 0.8, -40, 40),
      y: clamp(event.deltaY * 0.8, -40, 40),
    };
    normalize();
    apply();
    mode = 'glide';
    request();
  }

  function onPointerLeave(): void {
    if (mode === 'idle' && hover) {
      hover = null;
      flush();
      notifyIfChanged();
    }
  }

  const onPointerUp = (event: PointerEvent): void => endDrag(event, true);
  const onPointerCancel = (event: PointerEvent): void => endDrag(event, false);

  surface.addEventListener('pointerdown', onPointerDown);
  surface.addEventListener('pointermove', onPointerMove);
  surface.addEventListener('pointerup', onPointerUp);
  surface.addEventListener('pointercancel', onPointerCancel);
  // If capture is torn away without an up or cancel, the gesture must still
  // end or the next touch would be ignored forever.
  surface.addEventListener('lostpointercapture', onPointerCancel);
  surface.addEventListener('pointerleave', onPointerLeave);
  surface.addEventListener('keydown', onKeyDown);
  surface.addEventListener('wheel', onWheel, { passive: false });

  /* ----------------------------------------------------------- measure */

  let observer: ResizeObserver | undefined;

  function measure(): void {
    // Size to the box the surface actually lives in, not the root. In a preset
    // that is the panel; in a custom layout it may be a narrow column beside a
    // sidebar, and measuring the root would overflow it. `clientWidth` includes
    // the host's padding, so take the content box.
    const box = surface.parentElement ?? surface;
    const style = getComputedStyle(box);
    const padX =
      (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
    const { cell: nextCell, gap: nextGap } = gridMetrics(box.clientWidth - padX);
    if (nextCell === cell && nextGap === gap) {
      drawLayout();
    } else {
      // A resize changes the pitch, so any glide or snap in flight is aiming at
      // a stale grid: stop it. Do not reset the offset — rotating a phone or
      // the browser toolbar collapsing must not make the map jump.
      stopAnimation();
      if (stepRaf) {
        cancelAnimationFrame(stepRaf);
        stepRaf = 0;
        stepping = false;
      }
      settling = false;
      mode = 'idle';
      cell = nextCell;
      gap = nextGap;
      normalize();
      positioned = false;
      drawLayout();
    }

    if (observer || typeof ResizeObserver === 'undefined') return;
    observer = new ResizeObserver(() => measure());
    observer.observe(box);
  }

  /* ------------------------------------------------------------ value */

  function buildSnapshot(): PickerSnapshot {
    const chosen = selected();
    const under =
      hover ? wrapIndex(oy + hover.row, EXPRESSION_COUNT) : chosen.expression;
    return {
      name,
      value: {
        color: palette[chosen.color] as string,
        expression: EXPRESSIONS[chosen.expression] as AvatarExpression,
        blush,
      },
      changed:
        chosen.color !== startColor || chosen.expression !== startExpression || blush !== startBlush,
      blush,
      expressionName: EXPRESSION_NAMES[under] as string,
      spotlight: spotlightOn,
      palette,
      dragging,
      moving: dragging || stepping || settling,
    };
  }

  function report(): void {
    const key = valueKey(snapshot.value);
    if (reported === key) return;
    reported = key;
    onChange?.(snapshot.value);
  }

  /* ------------------------------------------------------------ build */

  drawLayout();
  flush();

  return {
    surface,
    getSnapshot: () => snapshot,
    subscribe,
    nextExpression: () => stepMood(1),
    previousExpression: () => stepMood(-1),
    toggleBlush: () => {
      blush = !blush;
      flush();
      notifyIfChanged();
    },
    toggleSpotlight: () => {
      spotlightOn = !spotlightOn;
      renderLens();
      notifyIfChanged();
    },
    reset: () => {
      pinned = null;
      ox = startColor - CENTER_COLUMN;
      oy = startExpression - CENTER_ROW;
      blush = startBlush;
      pos = { x: 0, y: 0 };
      vel = { x: 0, y: 0 };
      center = { column: CENTER_COLUMN, row: CENTER_ROW };
      hover = null;
      apply();
    },
    save: () => onSave?.(snapshot.value),
    cancel: () => onCancel?.(),
    hasCancel: !!onCancel,
    measure,
    destroy: () => {
      stopAnimation();
      if (stepRaf) cancelAnimationFrame(stepRaf);
      motionStop?.();
      observer?.disconnect();
      surface.removeEventListener('pointerdown', onPointerDown);
      surface.removeEventListener('pointermove', onPointerMove);
      surface.removeEventListener('pointerup', onPointerUp);
      surface.removeEventListener('pointercancel', onPointerCancel);
      surface.removeEventListener('lostpointercapture', onPointerCancel);
      surface.removeEventListener('pointerleave', onPointerLeave);
      surface.removeEventListener('keydown', onKeyDown);
      surface.removeEventListener('wheel', onWheel);
      listeners.clear();
    },
  };
}
