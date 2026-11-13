import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Avatar } from '@blobbies/react';
import { BUILDS, EYE_PAIRS, TOTAL, buildNames } from '../data';
import { layoutField, type Blob } from '../motion/field';

const NAMES = buildNames(160);

/**
 * The film: the many become one.
 *
 * The hero lets a crowd go; the film gathers one back. Every blob is pulled
 * toward the middle of the stage by `--k`, which is just the scroll position
 * once, and the crowd thins to nothing exactly as the single face arrives
 * underneath it. Then the number, which is the point of the single face.
 *
 * One sticky stage, one rect read and one custom property written per frame.
 * Everything else — the convergence, the crossfades, the count — is CSS on top
 * of that number.
 */
export function Film() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const crowdRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [blobs, setBlobs] = useState<Blob[]>([]);

  useLayoutEffect(() => {
    const pin = pinRef.current;
    const crowd = crowdRef.current;
    const copy = copyRef.current;
    if (!pin || !crowd || !copy) return undefined;

    const layout = (): void => {
      const field = crowd.getBoundingClientRect();
      const box = copy.getBoundingClientRect();
      setBlobs(
        layoutField({
          width: field.width,
          height: field.height,
          names: NAMES,
          avoid: {
            left: box.left - field.left - 20,
            right: box.right - field.left + 20,
            top: box.top - field.top - 20,
            bottom: box.bottom - field.top + 20,
          },
          seed: 'film',
        }),
      );
    };

    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(pin);
    return () => observer.disconnect();
  }, []);

  useFilmProgress(sectionRef);

  return (
    <section className="film" ref={sectionRef} aria-label="How Blobbies works">
      <div className="film-pin" ref={pinRef}>
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

        <div className="film-row" aria-hidden="true">
          {[0.4, 0.56, 0.76, 1, 1.32].map((mul, i) => (
            <span key={mul} style={{ '--mul': mul, '--i': i } as CSSProperties}>
              <Avatar name="Sourav Nanda" size={96} animate={i === 4 ? 'all' : 'blink'} wink={i === 4} />
            </span>
          ))}
        </div>

        <div className="film-copy" ref={copyRef}>
          <div className="film-beat" style={{ '--in': -0.3, '--out': 0.34 } as CSSProperties}>
            <h3>Every one of these is a name.</h3>
            <p>A hash of it decides the rest.</p>
          </div>
          <div className="film-beat" style={{ '--in': 0.3, '--out': 0.68 } as CSSProperties}>
            <h3>The only face that name can draw.</h3>
            <p>Same name, same face — at any size, on any device.</p>
          </div>
          <div className="film-beat" style={{ '--in': 0.68, '--out': 1.4 } as CSSProperties}>
            <p className="film-number" data-count-to={TOTAL}>
              0
            </p>
            <p>
              {BUILDS.toLocaleString('en-US')} builds × {EYE_PAIRS.toLocaleString('en-US')} eye pairs,
              before the rotation and the offset.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Writes `--p`, the scroll position through the film, once per frame.
 *
 * The position is followed rather than assigned: `--p` eases toward the real
 * scroll offset with a 105 ms time constant, so a wheel's stepped deltas arrive
 * as one continuous move. The loop stops the moment it has caught up, so a
 * page sitting still costs nothing.
 *
 * The count is the one thing CSS cannot do from a number, so it is done here.
 */
function useFilmProgress(ref: React.RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf = 0;
    let value = 0;
    let last = 0;

    const goalOf = (): number => {
      const total = el.offsetHeight - window.innerHeight;
      return total > 0 ? Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total)) : 0;
    };

    const frame = (now: number): void => {
      raf = 0;
      const dt = Math.min(64, now - (last || now));
      last = now;
      const goal = goalOf();
      value = Math.abs(goal - value) < 0.0008 ? goal : value + (goal - value) * (1 - Math.exp(-dt / 105));
      el.style.setProperty('--p', value.toFixed(4));

      const count = el.querySelector<HTMLElement>('[data-count-to]');
      if (count) {
        const to = Number(count.dataset.countTo ?? 0);
        const t = Math.min(1, Math.max(0, (value - 0.76) / 0.16));
        count.textContent = Math.round(to * (1 - (1 - t) ** 3)).toLocaleString('en-US');
      }

      if (value !== goal) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const kick = (): void => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    // On the first frame there is nothing to ease from: land where the page is.
    value = goalOf();
    el.style.setProperty('--p', value.toFixed(4));
    frame(performance.now());

    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    return () => {
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', kick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
}
