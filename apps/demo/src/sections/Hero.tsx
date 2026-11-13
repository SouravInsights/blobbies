import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Avatar } from '@blobbies/react';
import { buildNames } from '../data';
import { layoutField, type Blob } from '../motion/field';
import { CopyButton, GitHubIcon, REPO } from '../ui';

const NAMES = buildNames(140);

/** Room left around the copy, so no blob crowds the words. */
const COPY_PAD = 26;

/**
 * The hero: a crowd of blobs arrives.
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

  useLiftAway(sectionRef, crowdRef);

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

      <div className="hello" ref={copyRef}>
        <h1>Any name becomes a face.</h1>
        <p className="lede">Same name, same face. Every time.</p>
        <div className="cta">
          <CopyButton className="btn primary code" text="npm i blobbies" label="npm i blobbies" />
          <a className="btn" href={REPO} target="_blank" rel="noreferrer">
            <GitHubIcon /> Source
          </a>
        </div>
        <p className="meta">Deterministic SVG avatars · zero dependencies · 1.4 KB each</p>
      </div>

      <span className="cue" aria-hidden="true" />
    </header>
  );
}

/**
 * As the hero leaves, the crowd lifts away faster than the page does — the
 * stage clearing itself. Quadratic, and staggered per blob by `--lag`, so it
 * breaks up from the edges inward instead of sliding as one sheet.
 */
function useLiftAway(
  section: React.RefObject<HTMLElement | null>,
  crowd: React.RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const host = crowd.current;
    const el = section.current;
    if (!host || !el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let raf = 0;
    const update = (): void => {
      raf = 0;
      const gone = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / (window.innerHeight * 0.9)));
      host.style.setProperty('--away', gone.toFixed(4));
    };
    const onScroll = (): void => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [section, crowd]);
}
