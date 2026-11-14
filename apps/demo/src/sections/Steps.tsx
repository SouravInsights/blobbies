import { Fragment, useEffect, useRef } from 'react';
import { Words } from '../ui';

/** How a face is decided, said one sentence at a time. */
const LINES = [
  'Give it a name.',
  'The name is hashed into one number.',
  'That number picks the colour, the egg, the mouth, the tilt.',
  'The first two letters become the eyes.',
  'Nothing is random, and nothing is fetched.',
  'So the same name always draws the same face.',
];

/** A short opening with nothing said, before the first sentence. */
const LEAD = 0.4;

const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));

/**
 * The paragraph that says itself.
 *
 * A different animation from the film's, and for a different job. The film
 * reveals: words arrive out of a blur and the line is over. This highlights:
 * the whole paragraph is laid out and legible from the first frame, in the
 * quiet tone, and the scroll lights one sentence at a time from the top down.
 * Nothing moves and nothing fades — only the colour changes, so the eye is
 * never waiting for a line to finish arriving and the paragraph can be read
 * at whatever pace the visitor scrolls.
 *
 * Two details make it a handover rather than a switch. The words of a sentence
 * turn 25ms apart, so a sentence is said rather than switched on. And a
 * sentence that loses the light dims more slowly than the next one lights, so
 * one is still leaving as the other arrives.
 */
export function Steps() {
  const ref = useRef<HTMLElement>(null);
  useTurns(ref);

  return (
    <section className="steps" ref={ref} aria-label="How a face is decided">
      <div className="steps-pin">
        <p className="steps-say">
          {LINES.map((line, i) => (
            <Fragment key={line}>
              {i > 0 ? ' ' : null}
              <span className="st">
                <Words text={line} />
              </span>
            </Fragment>
          ))}
        </p>
      </div>
    </section>
  );
}

/**
 * Reads which sentence the scroll is on and lights it.
 *
 * The sentence is picked straight from how far the section has scrolled, so
 * it runs backward exactly as it ran forward — scrolling up walks the light
 * back up the paragraph. The stage drifts upward a little over the whole
 * section, so the page is seen to be going somewhere even while the paragraph
 * holds still.
 */
function useTurns(ref: React.RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const say = el.querySelector<HTMLElement>('.steps-say');
    const parts = [...el.querySelectorAll<HTMLElement>('.st')];
    if (!say || !parts.length) return undefined;

    let lit = -1;
    let raf = 0;

    const frame = (): void => {
      raf = 0;
      const box = el.getBoundingClientRect();
      const through = clamp(-box.top / Math.max(1, box.height - window.innerHeight), 0, 1);
      const at = through * (parts.length + LEAD) - LEAD;
      const i = at < 0 ? -1 : Math.min(parts.length - 1, Math.floor(at));
      if (i !== lit) {
        lit = i;
        parts.forEach((p, k) => p.classList.toggle('is-lit', k === i));
      }
      say.style.setProperty('--drift', ((0.5 - through) * window.innerHeight * 0.125).toFixed(1) + 'px');
    };

    const kick = (): void => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    frame();
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    return () => {
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', kick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
}
