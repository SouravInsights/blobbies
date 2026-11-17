import { useEffect, useMemo, useRef } from 'react';
import { Avatar } from '@blobbies/react';
import { createRng } from 'blobbies';
import { buildNames } from '../data';

const NAMES = buildNames(200);

/** Rendered always; only the first `n` fly, where `n` follows the stage's size. */
const MAX_FACES = 44;

/** The names that go up with the faces. Short enough to read at speed. */
const SAID = ['Ada', 'Grace', 'Sourav', 'Maya', 'Priya'];

/** Downward pull, in px/s². */
const GRAVITY = 1600;
/** The drag that brings them back down and stops them drifting sideways. */
const DRAG = 0.1;

interface Item {
  kind: 'face' | 'word';
  text: string;
}

interface Body {
  el: HTMLElement;
  w: number;
  h: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  delay: number;
  persp: number;
  reach: number;
  up: boolean;
  done: boolean;
}

/**
 * The burst: a fountain of blobs out of the bottom of the section.
 *
 * Not a keyframe animation — a small physics step. Each body is thrown with
 * the velocity it needs to reach its own height (`√(2gh)`, so a taller toss
 * also takes longer, the way a real throw does), then gravity and drag take
 * over. Depth decides how big it is, how hard it is thrown and how soft it is,
 * exactly as in the crowd.
 *
 * With the blobs go pills of the names they were drawn from, and last, bigger,
 * up the middle: the wordmark. The faces are the trick; the names are why it
 * is the trick.
 */
export function Burst({ trigger }: { trigger: number }): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const items = useMemo(buildItems, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!trigger || !host) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const bodies: Body[] = [];
    const children = [...host.children] as HTMLElement[];
    const { width: w, height: h } = host.getBoundingClientRect();
    const base = Math.min(Math.max(Math.min(w, h) * 0.066, 40), 72);
    const rng = createRng('burst');

    // A phone gets a handful, a desktop a fountain: the same density, not the
    // same number.
    const faces = Math.round(Math.min(Math.max((w * h * 0.18) / ((base * base * Math.PI) / 4), 36), 180) * 0.5);
    const flying = Math.min(faces, MAX_FACES);
    // Fewer, and smaller, pills on a narrow stage: five wide labels across a
    // phone read as a pile, not as confetti.
    const said = w < 640 ? SAID.slice(0, 3) : SAID;
    const pillScale = Math.min(1, Math.max(0.72, w / 1200));

    /** Out of focus at the back and the front, sharp through the middle. */
    const softness = (depth: number): number =>
      depth < 0.25 ? 2 + ((0.25 - depth) / 0.25) * 2.5 : depth > 0.8 ? 3 + ((depth - 0.8) / 0.2) * 3 : 0;

    children.forEach((el, i) => {
      const item = items[i];
      if (!item) return;
      if (item.kind === 'face' && i >= flying) return;
      const last = i === children.length - 1;
      const wordIndex = item.kind === 'word' ? i - (children.length - SAID.length - 1) : 0;
      if (item.kind === 'word' && !last && wordIndex >= said.length) return;
      const depth = last ? 0.8 : 0.35 + rng() * 0.6;
      const persp = 0.6 + 0.65 * depth;

      if (item.kind === 'face') {
        const dia = base * (0.55 + 0.75 * depth) * 1.1;
        el.style.width = `${dia.toFixed(1)}px`;
        el.style.height = `${dia.toFixed(1)}px`;
        const soft = softness(depth);
        if (soft) el.style.filter = `blur(${((dia * soft) / 146).toFixed(2)}px)`;
      } else {
        el.style.fontSize = `${(base * 0.36 * (0.6 + 0.65 * depth) * (last ? 1.35 : 1) * pillScale).toFixed(1)}px`;
      }

      const bw = el.offsetWidth;
      const bh = el.offsetHeight;
      // How high this one goes, as a share of the stage.
      const height = last ? 0.62 : 0.42 + rng() * 0.34;
      // √(2gh): the exact speed to reach `height`, so taller tosses take longer.
      const rise = Math.sqrt(2 * GRAVITY * h * height) * persp;
      // Faces are thrown anywhere. The pills are dealt out across the width
      // instead, so they read as a row of names rather than a pile of labels.
      const spread = Math.min(0.6, (0.45 * w) / h);
      const offset =
        item.kind === 'face'
          ? rng() * 2 - 1
          : last
            ? 0
            : ((wordIndex + 0.25 + rng() * 0.5) / said.length) * 2 - 1;

      el.style.opacity = '0';
      el.style.display = '';
      el.style.zIndex = String(Math.round(depth * 100) + (item.kind === 'word' ? 100 : 0));

      bodies.push({
        el,
        w: bw,
        h: bh,
        x: w / 2 + offset * spread * w * 0.12 * persp,
        y: h + (item.kind === 'word' ? 1.5 : 1) * bh,
        vx: rise * (offset * 0.7 + (rng() * 2 - 1) * 0.08),
        vy: -rise,
        angle: (rng() * 2 - 1) * (item.kind === 'word' ? 0.12 : 0.5),
        spin: (rng() * 2 - 1) * (item.kind === 'word' ? 0.35 : 1.2),
        delay: last ? 1.15 : item.kind === 'word' ? 0.1 + ((wordIndex + rng() * 0.6) / said.length) * 0.95 : 0.9 * rng() ** 1.6,
        persp,
        reach: bw / 2,
        up: false,
        done: false,
      });
    });

    let raf = 0;
    let t0 = 0;
    let last = 0;

    const step = (now: number): void => {
      if (!t0) t0 = last = now;
      const dt = Math.min((now - last) / 1000, 1 / 30);
      const t = (now - t0) / 1000;
      // Framerate-independent drag: the same loss per second, not per frame.
      const keep = 1 / (1 + DRAG * dt);
      last = now;

      let alive = 0;
      for (const b of bodies) {
        if (b.done) continue;
        alive++;
        if (t < b.delay) continue;
        if (!b.up) {
          b.up = true;
          b.el.style.opacity = '1';
        }
        b.vy = (b.vy + GRAVITY * b.persp * dt) * keep;
        b.vx *= keep;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.spin *= keep;
        b.angle += b.spin * dt;

        // Off the sides of the stage: turn around, and lose most of the spin.
        const x = Math.min(Math.max(b.x, b.reach), w - b.reach);
        if (x !== b.x) {
          b.x = x;
          b.vx *= -0.35;
          b.spin *= -0.6;
        }
        if (b.vy > 0 && b.y > h + Math.max(b.w, b.h)) {
          b.done = true;
          // Hidden, not removed: the button throws the same bodies again, so
          // they have to still be here.
          b.el.style.display = 'none';
          continue;
        }
        b.el.style.transform = `translate(${(b.x - b.w / 2).toFixed(1)}px, ${(b.y - b.h / 2).toFixed(1)}px) rotate(${b.angle.toFixed(3)}rad)`;
      }

      if (alive) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      // A burst cut off mid-flight (a re-fire, an unmount) leaves bodies in the
      // air: put them back out of sight.
      for (const b of bodies) b.el.style.display = 'none';
    };
  }, [trigger, items]);

  return (
    <div className="burst" ref={hostRef} aria-hidden="true">
      {items.map((item, i) =>
        item.kind === 'face' ? (
          <span className="bf" key={i}>
            <Avatar name={item.text} size={48} />
          </span>
        ) : (
          <span className="bn" key={i}>
            {item.text}
          </span>
        ),
      )}
    </div>
  );
}

function buildItems(): Item[] {
  const out: Item[] = [];
  for (let i = 0; i < MAX_FACES; i++) out.push({ kind: 'face', text: NAMES[i] as string });
  for (const text of SAID) out.push({ kind: 'word', text });
  out.push({ kind: 'word', text: 'blobbies' });
  return out;
}
