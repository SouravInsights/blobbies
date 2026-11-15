import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { EXPRESSIONS, EXPRESSION_COUNT, EXPRESSION_NAMES, PALETTE } from 'blobbies';
import type { AvatarExpression, AvatarOptions } from 'blobbies';
import { Avatar } from './Avatar.js';
import type { AvatarProps } from './Avatar.js';
import { usePickerStyles } from './picker-styles.js';

// `useLayoutEffect` warns when it runs during server rendering. The picker is
// SSR-safe, so fall back to `useEffect` where there is no DOM; the effect only
// measures the client anyway.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * The Blobbies avatar picker — the Look Map.
 *
 * The grid is a window onto a map of looks: columns are colours, rows are
 * moods, and the map wraps in both directions, so it never ends. Dragging,
 * swiping, scrolling or the arrow keys move the world under a fixed lens; the
 * faces nearest the lens are full size, and the ones moving away shrink and
 * fade — glyph's honeycomb behaviour, computed from screen distance every
 * frame so it is continuous rather than snapping cell by cell.
 *
 * It ships as parts, like Glyph's picker: `AvatarPickerRoot` owns the state,
 * the parts are composable, and `AvatarPicker` is the preset.
 */

const COLS = 5;
const ROWS = 3;
const CENTER_I = 2;
const CENTER_J = 1;
const BCOLS = COLS + 2;
const BROWS = ROWS + 2;
// The gap and the cell are measured from the panel, not fixed: on a phone the
// whole 5 × 3 grid has to fit the same box it fits on a laptop. A small floor
// keeps the initials legible; the grid never grows past MAX_CELL.
const MIN_GAP = 4;
const MAX_GAP = 8;
const MIN_CELL = 24;
const MAX_CELL = 78;
const LENS = 2.6;
const MAX_BLUR = 3.2;
const PUSH = 6;
// Padding from the surface edge to the lens: enough room for an edge ring, not
// enough to reveal the buffer column or row that waits outside the visible grid.
const PAD = 8;

const mod = (n: number, m: number): number => ((Math.trunc(n) % m) + m) % m;
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));

interface Focus {
  i: number;
  j: number;
}

interface Cell {
  key: string;
  i: number;
  j: number;
  color: number;
  expression: number;
}

interface MapController {
  stageRef: RefObject<HTMLDivElement>;
  worldRef: RefObject<HTMLDivElement>;
  cellEls: RefObject<Map<string, HTMLDivElement>>;
  cell: number;
  pitch: number;
  vw: number;
  vh: number;
  cells: Cell[];
  focus: Focus | null;
  selected: { color: number; expression: number };
  dragging: boolean;
  moving: boolean;
  handlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
    onPointerLeave: () => void;
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  };
}

export interface AvatarPickerState {
  name: string;
  value: AvatarOptions;
  changed: boolean;
  blush: boolean;
  expressionName: string;
  nextExpression: () => void;
  previousExpression: () => void;
  toggleBlush: () => void;
  spotlight: boolean;
  toggleSpotlight: () => void;
  palette: readonly string[];
  reset: () => void;
  save: () => void;
  cancel: () => void;
  hasCancel: boolean;
}

const Context = createContext<(AvatarPickerState & { map: MapController }) | null>(null);

function usePickerContext(): AvatarPickerState & { map: MapController } {
  const context = useContext(Context);
  if (!context) {
    throw new Error('AvatarPicker parts must be used inside <AvatarPickerRoot>.');
  }
  return context;
}

export function useAvatarPicker(): AvatarPickerState {
  const { map: _map, ...state } = usePickerContext();
  return state;
}

function Chevron({ dir }: { dir: 'l' | 'r' }) {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === 'l' ? 'M7.5 2.5 4 6l3.5 3.5' : 'M4.5 2.5 8 6l-3.5 3.5'} />
    </svg>
  );
}

function looksLikeTrackpad(event: WheelEvent): boolean {
  if (event.ctrlKey || event.deltaMode !== 0) return false;
  return event.deltaX !== 0 || Math.abs(event.deltaY) < 40 || !Number.isInteger(event.deltaY);
}

export interface AvatarPickerRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** The person's name — the eyes every look shares. */
  name: string;
  /** The look to open on. Changing it after mount does not reset the picker. */
  defaultValue?: AvatarOptions;
  /** Called with the current look whenever it changes (not on mount). */
  onChange?: (value: AvatarOptions) => void;
  /** Called when the save button is pressed. */
  onSave?: (value: AvatarOptions) => void;
  /** Shows a cancel button and calls this. */
  onCancel?: () => void;
  /** The colours the map offers. Defaults to the built-in `PALETTE`. */
  palette?: readonly string[];
  /** Run the depth-of-field spotlight while hovering. Default: true. */
  spotlight?: boolean;
  /** Skip the panel styling and style the parts yourself. */
  unstyled?: boolean;
  children: ReactNode;
}

export function AvatarPickerRoot(props: AvatarPickerRootProps) {
  const {
    name,
    defaultValue,
    onChange,
    onSave,
    onCancel,
    palette = PALETTE,
    spotlight = true,
    unstyled = false,
    className,
    style,
    children,
    ...rest
  } = props;

  usePickerStyles();

  const initial = useRef({
    color: (() => {
      const i = defaultValue?.color ? palette.indexOf(defaultValue.color) : CENTER_I;
      return i >= 0 ? i : CENTER_I;
    })(),
    expression: (() => {
      const i = defaultValue?.expression ? EXPRESSIONS.indexOf(defaultValue.expression) : CENTER_J;
      return i >= 0 ? i : CENTER_J;
    })(),
    blush: defaultValue?.blush ?? true,
  });

  const [metrics, setMetrics] = useState({ cell: 68, gap: MAX_GAP });
  const [blush, setBlush] = useState(initial.current.blush ?? true);
  const [pinned, setPinned] = useState<{ color: number; expression: number } | null>(null);
  const [spotlightOn, setSpotlightOn] = useState(spotlight);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState<Focus | null>(null);
  const [stepping, setStepping] = useState(false);
  const [settling, setSettling] = useState(false);
  const [version, setVersion] = useState(0);

  const { cell, gap } = metrics;
  const pitch = cell + gap;
  const vw = COLS * cell + (COLS - 1) * gap;
  const vh = ROWS * cell + (ROWS - 1) * gap;
  const surfaceW = vw + PAD * 2;
  const surfaceH = vh + PAD * 2;

  const ox = useRef(initial.current.color - CENTER_I);
  const oy = useRef(initial.current.expression - CENTER_J);
  const center = useRef<Focus>({ i: CENTER_I, j: CENTER_J });
  const pos = useRef({ x: 0, y: 0 });
  const vel = useRef({ x: 0, y: 0 });
  const mode = useRef<'idle' | 'drag' | 'glide' | 'snap'>('idle');
  const raf = useRef(0);
  const moved = useRef(false);
  const stepRaf = useRef(0);
  const stepOffset = useRef(0);
  const stepDelta = useRef(0);
  const steppingRef = useRef(false);
  const pitchRef = useRef(pitch);
  pitchRef.current = pitch;

  const cardRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cellEls = useRef(new Map<string, HTMLDivElement>());
  const last = useRef({ x: 0, y: 0 });
  const reduced = useRef(
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  const hoverRef = useRef<Focus | null>(hover);
  const draggingRef = useRef(dragging);
  const settlingRef = useRef(settling);
  const cellRef = useRef(cell);
  const lensOn = useRef(false);
  const positioned = useRef(false);
  const spotlightRef = useRef(spotlightOn);
  spotlightRef.current = spotlightOn;
  hoverRef.current = hover;
  draggingRef.current = dragging;
  settlingRef.current = settling;
  cellRef.current = cell;

  const bump = (): void => setVersion((v) => v + 1);

  // The lens. Each cell is positioned from its buffer slot, but its scale and
  // opacity come from its *screen* distance to the lens, written straight to
  // the DOM so the fade keeps up with the pan instead of snapping at cell lines.
  const renderLens = (): void => {
    const p = pitchRef.current;
    const size = cellRef.current;
    const hovered =
      hoverRef.current && !draggingRef.current && !steppingRef.current && !settlingRef.current
        ? hoverRef.current
        : null;

    // Nothing is being looked at, so every option stays clear and legible.
    if (!hovered) {
      if (!lensOn.current && positioned.current) return;
      lensOn.current = false;
      positioned.current = true;
      for (const [key, el] of cellEls.current) {
        const [i, j] = key.split(':').map(Number) as [number, number];
        el.style.transform = `translate3d(${(i * p).toFixed(1)}px, ${(j * p).toFixed(1)}px, 0)`;
        el.style.opacity = '1';
        el.style.filter = '';
      }
      return;
    }

    lensOn.current = true;
    positioned.current = true;
    const lx = (hovered.i + 0.5) * p + pos.current.x;
    const ly = (hovered.j + 0.5) * p + pos.current.y;
    for (const [key, el] of cellEls.current) {
      const [i, j] = key.split(':').map(Number) as [number, number];
      const sx = i * p + pos.current.x + size / 2;
      const sy = j * p + pos.current.y + size / 2;
      const d = Math.hypot(sx - lx, sy - ly) / p;
      const t = Math.min(1, d / LENS);
      const fall = 1 - t * t;
      let px = 0;
      let py = 0;
      if (d >= 1e-3) {
        const len = Math.hypot(sx - lx, sy - ly) || 1;
        const push = reduced.current ? 0 : fall * PUSH;
        px = ((sx - lx) / len) * push;
        py = ((sy - ly) / len) * push;
      }
      const opacity = d < 1e-3 ? 1 : 0.7 + 0.3 * fall;
      const blur = spotlightRef.current && d >= 1e-3 ? Math.min(MAX_BLUR, t * MAX_BLUR) : 0;
      el.style.transform = `translate3d(${(i * p + px).toFixed(1)}px, ${(j * p + py).toFixed(1)}px, 0)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.filter = blur > 0.06 ? `blur(${blur.toFixed(2)}px)` : '';
    }
  };

  const cellAt = (clientX: number, clientY: number): Focus | null => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const p = pitchRef.current;
    const i = Math.floor((clientX - rect.left - PAD - pos.current.x) / p);
    const j = Math.floor((clientY - rect.top - PAD - pos.current.y) / p);
    if (i >= -1 && i <= COLS && j >= -1 && j <= ROWS) return { i, j };
    return null;
  };

  const writeStep = (offsetY: number): void => {
    const world = worldRef.current;
    if (world) {
      world.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y + offsetY}px, 0)`;
    }
    renderLens();
  };

  const apply = (): void => {
    const world = worldRef.current;
    if (world) {
      world.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
    }
    const p = pitchRef.current;
    const i = pos.current.x < p / 2 ? CENTER_I : CENTER_I - 1;
    const j = pos.current.y < p / 2 ? CENTER_J : CENTER_J - 1;
    if (i !== center.current.i || j !== center.current.j) {
      center.current = { i, j };
      bump();
    }
    renderLens();
  };

  const normalize = (): void => {
    const p = pitchRef.current;
    let changed = false;
    const nx = Math.floor(pos.current.x / p);
    const ny = Math.floor(pos.current.y / p);
    if (nx !== 0) {
      ox.current -= nx;
      pos.current.x -= nx * p;
      changed = true;
    }
    if (ny !== 0) {
      oy.current -= ny;
      pos.current.y -= ny * p;
      changed = true;
    }
    if (changed) bump();
  };

  const request = (): void => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(function tick() {
      raf.current = 0;
      const p = pitchRef.current;
      if (mode.current === 'glide') {
        pos.current.x += vel.current.x;
        pos.current.y += vel.current.y;
        vel.current.x *= 0.9;
        vel.current.y *= 0.9;
        if (Math.abs(vel.current.x) < 0.4 && Math.abs(vel.current.y) < 0.4) {
          mode.current = 'snap';
        }
        normalize();
        apply();
        request();
      } else if (mode.current === 'snap') {
        const tx = pos.current.x < p / 2 ? 0 : p;
        const ty = pos.current.y < p / 2 ? 0 : p;
        const done = Math.abs(tx - pos.current.x) < 0.4 && Math.abs(ty - pos.current.y) < 0.4;
        if (done) {
          pos.current = { x: tx, y: ty };
          normalize();
          apply();
          mode.current = 'idle';
          setSettling(false);
        } else {
          pos.current.x += (tx - pos.current.x) * 0.22;
          pos.current.y += (ty - pos.current.y) * 0.22;
          normalize();
          apply();
          request();
        }
      }
    });
  };

  const stepMood = (delta: number): void => {
    if (steppingRef.current) return;
    setPinned(null);
    if (reduced.current) {
      oy.current += delta;
      bump();
      apply();
      return;
    }
    steppingRef.current = true;
    stepDelta.current = delta;
    setStepping(true);
    const p = pitchRef.current;
    const to = -delta * p;
    const start = performance.now();
    const dur = 300;
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      stepOffset.current = to * eased;
      writeStep(stepOffset.current);
      if (t < 1) {
        stepRaf.current = requestAnimationFrame(tick);
      } else {
        oy.current += delta;
        stepOffset.current = 0;
        stepRaf.current = 0;
        steppingRef.current = false;
        setStepping(false);
        bump();
        apply();
      }
    };
    stepRaf.current = requestAnimationFrame(tick);
  };

  useIsomorphicLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;
    // Size to the box the surface actually lives in, not the root. In the
    // preset that is the panel; in a custom layout it may be a narrow column
    // beside a sidebar, and measuring the root would overflow it.
    const host = stageRef.current?.parentElement ?? card;
    const measure = (): void => {
      // `clientWidth` includes the host's own padding. A custom layout may put
      // padding on it (the preset puts its padding on the header and footer),
      // so measure the content box the surface actually lives in.
      const style = getComputedStyle(host);
      const padX =
        (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
      const w = host.clientWidth - padX;
      // Keep a little more breathing room at every size: the panel inset
      // shrinks with it. `surfaceW` is then guaranteed to fit inside `w`, so
      // the edge cells are never clipped by the panel.
      const inset = Math.min(16, Math.max(6, Math.round(w * 0.03)));
      const nextGap = clamp(Math.round(w * 0.02), MIN_GAP, MAX_GAP);
      const nextCell = clamp(
        Math.floor((w - inset * 2 - PAD * 2 - (COLS - 1) * nextGap) / COLS),
        MIN_CELL,
        MAX_CELL,
      );
      setMetrics((m) =>
        m.cell === nextCell && m.gap === nextGap ? m : { cell: nextCell, gap: nextGap },
      );
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useIsomorphicLayoutEffect(() => {
    pos.current = { x: 0, y: 0 };
    positioned.current = false;
    mode.current = 'idle';
    if (raf.current) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    }
    apply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cell, gap]);

  // Re-apply the lens after every render (hover, size, origin).
  useIsomorphicLayoutEffect(() => {
    renderLens();
  });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const onWheel = (event: WheelEvent): void => {
      if (!looksLikeTrackpad(event)) return;
      event.preventDefault();
      if (reduced.current) {
        if (event.deltaX) ox.current += event.deltaX > 0 ? 1 : -1;
        if (event.deltaY) oy.current += event.deltaY > 0 ? 1 : -1;
        bump();
        apply();
        return;
      }
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = 0;
      }
      pos.current.x += event.deltaX;
      pos.current.y += event.deltaY;
      vel.current = {
        x: clamp(event.deltaX * 0.8, -40, 40),
        y: clamp(event.deltaY * 0.8, -40, 40),
      };
      normalize();
      apply();
      mode.current = 'glide';
      request();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return;
    try {
      stageRef.current?.setPointerCapture(event.pointerId);
    } catch {
      /* not fatal */
    }
    if (raf.current) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    }
    if (steppingRef.current) {
      if (stepRaf.current) cancelAnimationFrame(stepRaf.current);
      oy.current += stepDelta.current;
      stepOffset.current = 0;
      stepRaf.current = 0;
      steppingRef.current = false;
      setStepping(false);
      apply();
    }
    mode.current = 'drag';
    moved.current = false;
    setDragging(true);
    setHover(null);
    last.current = { x: event.clientX, y: event.clientY };
    vel.current = { x: 0, y: 0 };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (mode.current === 'drag') {
      const dx = event.clientX - last.current.x;
      const dy = event.clientY - last.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) {
        if (!moved.current) setPinned(null);
        moved.current = true;
      }
      last.current = { x: event.clientX, y: event.clientY };
      pos.current.x += dx;
      pos.current.y += dy;
      vel.current = { x: clamp(dx * 0.85, -40, 40), y: clamp(dy * 0.85, -40, 40) };
      normalize();
      apply();
      return;
    }
    const at = cellAt(event.clientX, event.clientY);
    setHover((prev) => (at && prev && prev.i === at.i && prev.j === at.j ? prev : at));
  };

  const endDrag = (): void => {
    if (mode.current !== 'drag') return;
    setDragging(false);
    if (!moved.current) {
      const at = cellAt(last.current.x, last.current.y);
      if (at) {
        setPinned({
          color: mod(ox.current + at.i, palette.length),
          expression: mod(oy.current + at.j, EXPRESSION_COUNT),
        });
      }
      setHover(null);
    }
    if (reduced.current) {
      const p = pitchRef.current;
      pos.current.x = pos.current.x < p / 2 ? 0 : p;
      pos.current.y = pos.current.y < p / 2 ? 0 : p;
      normalize();
      apply();
      mode.current = 'idle';
      return;
    }
    mode.current = 'glide';
    setSettling(true);
    request();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        setPinned(null);
        ox.current += 1;
        bump();
        apply();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        setPinned(null);
        ox.current -= 1;
        bump();
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
  };

  const cells = useMemo(() => {
    const out: Cell[] = [];
    for (let j = -1; j < BROWS - 1; j++) {
      for (let i = -1; i < BCOLS - 1; i++) {
        out.push({
          key: `${i}:${j}`,
          i,
          j,
          color: mod(ox.current + i, palette.length),
          expression: mod(oy.current + j, EXPRESSION_COUNT),
        });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, palette.length]);

  const lens = hover ?? { i: center.current.i, j: center.current.j };
  const selectedIndex = pinned ?? {
    color: mod(ox.current + center.current.i, palette.length),
    expression: mod(oy.current + center.current.j, EXPRESSION_COUNT),
  };
  const value: AvatarOptions = {
    color: palette[selectedIndex.color] as string,
    expression: EXPRESSIONS[selectedIndex.expression] as AvatarExpression,
    blush,
  };
  const valueCell = cells.find(
    (c) => c.color === selectedIndex.color && c.expression === selectedIndex.expression,
  );
  const restFocus = valueCell
    ? { i: valueCell.i, j: valueCell.j }
    : { i: center.current.i, j: center.current.j };
  const focus: Focus | null =
    dragging || stepping || settling ? null : hover ?? restFocus;

  const changed =
    selectedIndex.color !== initial.current.color ||
    selectedIndex.expression !== initial.current.expression ||
    blush !== initial.current.blush;

  const reported = useRef<string | null>(null);
  useEffect(() => {
    const key = `${value.color}.${value.expression}.${value.blush}`;
    if (reported.current === null) {
      reported.current = key;
      return;
    }
    if (reported.current === key) return;
    reported.current = key;
    onChange?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.color, value.expression, value.blush]);

  const reset = (): void => {
    setPinned(null);
    ox.current = (initial.current.color ?? CENTER_I) - CENTER_I;
    oy.current = (initial.current.expression ?? CENTER_J) - CENTER_J;
    setBlush(initial.current.blush ?? true);
    pos.current = { x: 0, y: 0 };
    center.current = { i: CENTER_I, j: CENTER_J };
    setHover(null);
    bump();
    apply();
  };

  const map: MapController = {
    stageRef,
    worldRef,
    cellEls,
    cell,
    pitch,
    vw: surfaceW,
    vh: surfaceH,
    cells,
    focus,
    selected: selectedIndex,
    dragging,
    moving: dragging || stepping || settling,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onPointerLeave: () => setHover(null),
      onKeyDown,
    },
  };

  const state: AvatarPickerState & { map: MapController } = {
    name,
    value,
    changed,
    blush,
    expressionName: EXPRESSION_NAMES[
      hover ? mod(oy.current + hover.j, EXPRESSION_COUNT) : selectedIndex.expression
    ] as string,
    nextExpression: () => stepMood(1),
    previousExpression: () => stepMood(-1),
    toggleBlush: () => setBlush((b) => !b),
    spotlight: spotlightOn,
    toggleSpotlight: () => setSpotlightOn((v) => !v),
    palette,
    reset,
    save: () => onSave?.(value),
    cancel: () => onCancel?.(),
    hasCancel: !!onCancel,
    map,
  };

  const classes = [unstyled ? '' : 'bb-picker', className].filter(Boolean).join(' ');

  return (
    <Context.Provider value={state}>
      <div {...rest} ref={cardRef} className={classes || undefined} data-part="root" style={style}>
        {children}
      </div>
    </Context.Provider>
  );
}

export type AvatarPickerSurfaceProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

export function AvatarPickerSurface(props: AvatarPickerSurfaceProps) {
  const { className, ...rest } = props;
  const { name, blush, value, palette, map } = usePickerContext();
  const { stageRef, worldRef, cellEls, cell, cells, focus, selected, dragging, moving, handlers, vw, vh } = map;

  return (
    <div
      {...rest}
      {...handlers}
      ref={stageRef}
      role="group"
      tabIndex={0}
      aria-label="A map of looks. Drag, swipe or use the arrow keys."
      data-part="surface"
      data-dragging={dragging ? '1' : undefined}
      className={['bb-picker-surface', className].filter(Boolean).join(' ')}
      style={{ width: vw, height: vh }}
    >
      <div className="bb-picker-viewport">
      <div className="bb-picker-world" ref={worldRef}>
        {cells.map((c) => {
          const on = !!focus && c.i === focus.i && c.j === focus.j;
          return (
            <div
              key={c.key}
              ref={(el) => {
                if (el) cellEls.current?.set(c.key, el);
                else cellEls.current?.delete(c.key);
              }}
              className="bb-picker-cell"
              data-focus={on ? '1' : undefined}
              style={{ width: cell, height: cell, zIndex: on ? 6 : 1 }}
              aria-hidden="true"
            >
              <span className="bb-picker-lift">
                <Avatar
                  name={name}
                  color={palette[c.color]}
                  expression={EXPRESSIONS[c.expression] as AvatarExpression}
                  blush={blush}
                  size={cell}
                  animate="all"
                  follow={on}
                  blinkInterval={[4000, 10000]}
                />
              </span>
              <span className="bb-picker-ring" aria-hidden="true" />
              <span
                className="bb-picker-check"
                data-on={
                  !moving && c.color === selected.color && c.expression === selected.expression
                    ? '1'
                    : undefined
                }
                aria-hidden="true"
              >
                <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 6.2 4.8 8.5 9.5 3.5" />
                </svg>
              </span>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

/**
 * The chosen face, for a layout that wants to show it outside the map. It
 * reads the picker's current value, so it stays in step with the surface.
 */
export type AvatarPickerPreviewProps = Omit<AvatarProps, 'name'>;

export function AvatarPickerPreview(props: AvatarPickerPreviewProps) {
  const { name, value } = usePickerContext();
  return <Avatar name={name} {...value} {...props} data-part="preview" />;
}

export type AvatarPickerMoodProps = HTMLAttributes<HTMLDivElement>;

export function AvatarPickerMood(props: AvatarPickerMoodProps) {
  const { className, ...rest } = props;
  const { expressionName, previousExpression, nextExpression } = usePickerContext();
  return (
    <div {...rest} className={['bb-picker-mood', className].filter(Boolean).join(' ')} data-part="mood">
      <button type="button" className="bb-picker-step" onClick={previousExpression} aria-label="Previous expression">
        <Chevron dir="l" />
      </button>
      <span key={expressionName} className="bb-picker-mood-name" aria-live="polite">
        {expressionName}
      </span>
      <button type="button" className="bb-picker-step" onClick={nextExpression} aria-label="Next expression">
        <Chevron dir="r" />
      </button>
    </div>
  );
}

export type AvatarPickerButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function AvatarPickerBlush(props: AvatarPickerButtonProps) {
  const { className, children, onClick, ...rest } = props;
  const { blush, toggleBlush } = usePickerContext();
  return (
    <button
      type="button"
      {...rest}
      className={['bb-picker-blush', className].filter(Boolean).join(' ')}
      data-part="blush"
      data-on={blush ? '1' : undefined}
      aria-pressed={blush}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) toggleBlush();
      }}
    >
      {children ?? 'Blush'}
    </button>
  );
}

export function AvatarPickerSpotlight(props: AvatarPickerButtonProps) {
  const { className, children, onClick, ...rest } = props;
  const { spotlight, toggleSpotlight } = usePickerContext();
  return (
    <button
      type="button"
      {...rest}
      className={['bb-picker-spotlight', className].filter(Boolean).join(' ')}
      data-part="spotlight"
      data-on={spotlight ? '1' : undefined}
      aria-pressed={spotlight}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) toggleSpotlight();
      }}
    >
      {children ?? 'Spotlight'}
    </button>
  );
}

export function AvatarPickerReset(props: AvatarPickerButtonProps) {
  const { className, children, onClick, disabled, ...rest } = props;
  const { changed, reset } = usePickerContext();
  return (
    <button
      type="button"
      {...rest}
      className={['bb-picker-reset', className].filter(Boolean).join(' ')}
      data-part="reset"
      disabled={disabled || !changed}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) reset();
      }}
    >
      {children ?? 'Reset'}
    </button>
  );
}

export function AvatarPickerSave(props: AvatarPickerButtonProps) {
  const { className, children, onClick, ...rest } = props;
  const { save } = usePickerContext();
  return (
    <button
      type="button"
      {...rest}
      className={['bb-picker-btn', 'bb-picker-primary', className].filter(Boolean).join(' ')}
      data-part="save"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) save();
      }}
    >
      {children ?? 'Save'}
    </button>
  );
}

export function AvatarPickerCancel(props: AvatarPickerButtonProps) {
  const { className, children, onClick, ...rest } = props;
  const { cancel, hasCancel } = usePickerContext();
  if (!hasCancel) return null;
  return (
    <button
      type="button"
      {...rest}
      className={['bb-picker-btn', className].filter(Boolean).join(' ')}
      data-part="cancel"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) cancel();
      }}
    >
      {children ?? 'Cancel'}
    </button>
  );
}

export interface AvatarPickerProps extends Omit<AvatarPickerRootProps, 'children'> {
  title?: string;
  description?: string;
  saveLabel?: string;
}

export function AvatarPicker(props: AvatarPickerProps) {
  const {
    title = 'Choose an avatar',
    description = 'Drag across for colour, down for mood, then keep one.',
    saveLabel = 'Save',
    onCancel,
    ...root
  } = props;

  return (
    <AvatarPickerRoot {...root} onCancel={onCancel}>
      {(title || description) && (
        <div className="bb-picker-head" data-part="header">
          {title && <h3 data-part="title">{title}</h3>}
          {description && <p data-part="description">{description}</p>}
        </div>
      )}
      <AvatarPickerSurface />
      <AvatarPickerMood />
      <div className="bb-picker-foot" data-part="footer">
        <AvatarPickerBlush />
        <AvatarPickerSpotlight />
        <AvatarPickerReset />
        <span className="bb-picker-grow" />
        <AvatarPickerCancel />
        <AvatarPickerSave>{saveLabel}</AvatarPickerSave>
      </div>
    </AvatarPickerRoot>
  );
}
