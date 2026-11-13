import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Avatar } from '@blobbies/react';
import { BUILDS, EYE_PAIRS, TOTAL, buildNames } from '../data';

const CROWD = buildNames(120);

/**
 * The film. One sticky stage, four beats, driven entirely by scroll position.
 *
 *   SECTION.film      height: 460vh   ← the timeline
 *     DIV.film-pin    position: sticky; height: 100vh
 *       .beat × 4     absolutely stacked, crossfading on --p
 *
 * Scroll position is written to `--p` (0..1) once per frame and everything
 * else is CSS. There is no animation library and no layout thrash: the only
 * measurement is the section's own rect, and the only write is one custom
 * property.
 */
export function Film() {
  const ref = useRef<HTMLElement>(null);
  useFilmProgress(ref);

  return (
    <section className="film" ref={ref} data-stage="0" aria-label="How Blobbies works">
      <div className="film-pin">
        <Beat from={-0.25} to={0.25}>
          <div className="beat-visual">
            <div className="film-crowd" data-converge>
              {CROWD.map((n, i) => (
                <span key={`${n}-${i}`}>
                  <Avatar name={n} size={56} animate="follow" />
                </span>
              ))}
            </div>
          </div>
          <div className="beat-copy">
            <h3>Any name becomes a face.</h3>
            <p>120 of them, and every one tracks your pointer.</p>
          </div>
        </Beat>

        <Beat from={0.25} to={0.55}>
          <div className="beat-visual">
            <span className="film-halo" />
            <Avatar name="Sourav Nanda" size={216} animate="all" wink />
          </div>
          <div className="beat-copy">
            <h3>One name. One face.</h3>
            <p>The same name always draws the same face. Blink is pure CSS; follow is one shared pointer listener.</p>
          </div>
        </Beat>

        <Beat from={0.55} to={1.25}>
          <div className="beat-visual">
            <p className="film-number" data-count-to={TOTAL}>0</p>
          </div>
          <div className="beat-copy">
            <h3>Every name gets its own.</h3>
            <p>
              {BUILDS.toLocaleString('en-US')} builds × {EYE_PAIRS.toLocaleString('en-US')} eye pairs,
              before the rotation and the offset.
            </p>
          </div>
        </Beat>

        <span className="film-cue" aria-hidden="true">
          ↓
        </span>
        <div className="film-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}

/** One state of the stage. Opacity is a trapezoid built from two clamps. */
function Beat({ from, to, children }: { from: number; to: number; children: ReactNode }) {
  return (
    <div className="beat" style={{ '--in': from, '--out': to } as CSSProperties}>
      {children}
    </div>
  );
}

/**
 * Writes `--p` and `data-stage` on the film. Reads one rect and writes one
 * property per frame, only while a frame is already scheduled.
 */
function useFilmProgress(ref: React.RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf = 0;

    const update = (): void => {
      raf = 0;
      const total = el.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total)) : 0;
      el.style.setProperty('--p', p.toFixed(4));
      el.dataset.stage = String(Math.min(2, Math.floor(p * 3)));

      const count = el.querySelector<HTMLElement>('[data-count-to]');
      if (count) {
        const to = Number(count.dataset.countTo ?? 0);
        const t = Math.min(1, Math.max(0, (p - 0.55) / 0.17));
        count.textContent = Math.round(to * t).toLocaleString('en-US');
      }
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
  }, [ref]);
}
