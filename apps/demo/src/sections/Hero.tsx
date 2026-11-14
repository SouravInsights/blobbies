import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Avatar } from '@blobbies/react';
import { buildNames } from '../data';
import { layoutField, type Blob } from '../motion/field';
import { CopyButton, GitHubIcon, REPO, Words } from '../ui';

const NAMES = buildNames(140);

/** Room left around the copy, so no blob crowds the words. */
const COPY_PAD = 26;

/**
 * The hero: a crowd of blobs arrives, and then the page speaks.
 *
 * Every blob starts below the fold and rises to its own spot, from its own
 * distance, on its own delay. Once there it drifts on three independent
 * layers — a slow vertical bob, a slower sideways sway with a little roll —
 * so nothing ever sits still and nothing moves in step. Depth decides the
 * size, the order, how fast it drifts and how far out of focus it is: the
 * nearest and the farthest are soft, the middle band is sharp.
 *
 * Then the blobs do the one thing a grid of avatars cannot: all of them turn
 * to watch the pointer at once.
 *
 * The copy is a narration rather than a fade. The first line says itself, word
 * by word; the second arrives faint, waiting; the buttons rise in under it.
 * The moment the page moves, the first line steps back and the second says
 * itself — so the hero is a thing that happens rather than a thing that is
 * there. Scrolling on, the whole block blurs upward and out, and comes back
 * the way it went.
 *
 * The whole layout is derived from the names, so the crowd is the same crowd
 * on every load — which is the library's own thesis, running in its own hero.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const crowdRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [blobs, setBlobs] = useState<Blob[]>([]);

  useLayoutEffect(() => {
    const crowd = crowdRef.current;
    const copy = copyRef.current;
    if (!crowd || !copy) return undefined;

    const layout = (): void => {
      const field = crowd.getBoundingClientRect();
      const box = copy.getBoundingClientRect();
      setBlobs(
        layoutField({
          width: field.width,
          height: field.height,
          names: NAMES,
          avoid: {
            left: box.left - field.left - COPY_PAD,
            right: box.right - field.left + COPY_PAD,
            top: box.top - field.top - COPY_PAD,
            bottom: box.bottom - field.top + COPY_PAD,
          },
          seed: 'hero',
        }),
      );
    };

    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(crowd);
    return () => observer.disconnect();
  }, []);

  useHeroScript(sectionRef, crowdRef, copyRef);

  return (
    <header className="hero" ref={sectionRef}>
      <div className="crowd" ref={crowdRef} aria-hidden="true">
        {blobs.map((blob, i) => (
          <span className="cf" key={`${blob.name}-${i}`} style={blob.vars as CSSProperties}>
            <span className="cf-b">
              <span className="cf-s">
                <span className="cf-p">
                  <Avatar
                    name={blob.name}
                    size={Math.round(blob.dia)}
                    animate="all"
                    blinkInterval={[5000, 13000]}
                  />
                </span>
              </span>
            </span>
          </span>
        ))}
      </div>

      <div className="hello" ref={copyRef} data-cta="0">
        <h1 className="says" data-s="wait">
          <Words text="Any name becomes a face." />
        </h1>
        <p className="lede says" data-s="wait">
          <Words text="Same name, same face. Every time." />
        </p>
        <div className="cta">
          <CopyButton className="btn primary code" text="npm i blobbies" label="npm i blobbies" />
          <a className="btn" href={REPO} target="_blank" rel="noreferrer">
            <GitHubIcon /> Source
          </a>
        </div>
        <p className="meta">
          <span>Deterministic SVG avatars</span>
          <i aria-hidden="true">·</i>
          <span>zero dependencies</span>
          <i aria-hidden="true">·</i>
          <span>1.4 KB each</span>
        </p>
      </div>

      <span className="cue" aria-hidden="true" />
    </header>
  );
}

/** When the first line is said, and when the second arrives faint under it. */
const SAY = 1200;
const GHOST = 2000;

/**
 * The hero's clock and its scroll.
 *
 * Two things run here. A clock says the first line, then brings the second in
 * faint and raises the buttons — the hero telling itself, which no scroll
 * position could do because the visitor has not scrolled yet. And the scroll
 * takes over from there: the first line steps back, the second is said, and
 * the whole block blurs up and out as the crowd lifts away.
 *
 * Everything the scroll drives is a plain function of where the page is, so it
 * runs backward exactly as it ran forward. Coming back to the top restores the
 * hero to the state it was left in, not to the state it started in.
 */
function useHeroScript(
  section: React.RefObject<HTMLElement | null>,
  crowd: React.RefObject<HTMLElement | null>,
  copy: React.RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const host = crowd.current;
    const hello = copy.current;
    const el = section.current;
    if (!host || !hello || !el) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const line1 = hello.querySelector('h1');
    const line2 = hello.querySelector('.lede');

    // Already on its way, or nothing to say: no clock at all.
    let intro = reduced || window.scrollY > 4 ? 2 : 0;
    let raf = 0;

    const paint = (): void => {
      raf = 0;
      const h = window.innerHeight || 1;
      const y = window.scrollY;

      // With less motion asked for there is no narration to wait for and no
      // exit to scrub, so both lines are simply in ink — the second one is
      // already the quieter of the two by its colour. A line held faint
      // because a scroll might say it later is not readable, and unreadable
      // is the one thing it must never be.
      if (reduced) {
        if (line1 && line1.getAttribute('data-s') !== 'said') line1.setAttribute('data-s', 'said');
        if (line2 && line2.getAttribute('data-s') !== 'said') line2.setAttribute('data-s', 'said');
        if (hello.getAttribute('data-cta') !== '1') hello.setAttribute('data-cta', '1');
        return;
      }

      const moved = y > h * 0.02;

      const one = moved ? 'quiet' : intro >= 1 ? 'said' : 'wait';
      const two = moved ? 'said' : intro >= 2 ? 'ghost' : 'wait';
      if (line1 && line1.getAttribute('data-s') !== one) line1.setAttribute('data-s', one);
      if (line2 && line2.getAttribute('data-s') !== two) line2.setAttribute('data-s', two);

      const cta = intro >= 2 || moved ? '1' : '0';
      if (hello.getAttribute('data-cta') !== cta) hello.setAttribute('data-cta', cta);

      // The crowd leaves over most of a screen; the words leave earlier, so
      // they are gone before the stage has finished clearing.
      const away = clamp(y / (h * 0.9), 0, 1);
      const out = clamp((y - h * 0.22) / (h * 0.55), 0, 1);
      host.style.setProperty('--away', away.toFixed(4));
      hello.style.setProperty('--out', out.toFixed(4));
    };

    const onScroll = (): void => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const timers: number[] = [];
    if (!reduced && intro === 0) {      timers.push(
        window.setTimeout(() => {
          intro = Math.max(intro, 1);
          paint();
        }, SAY),
        window.setTimeout(() => {
          intro = Math.max(intro, 2);
          paint();
        }, GHOST),
      );
    }

    paint();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      for (const t of timers) window.clearTimeout(t);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [section, crowd, copy]);
}

const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
