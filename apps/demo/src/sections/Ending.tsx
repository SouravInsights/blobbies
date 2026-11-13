import { useEffect, useRef, useState } from 'react';
import { Burst } from './Burst';
import { CopyButton, GitHubIcon, REPO } from '../ui';

/**
 * The ending: the one line, the one command, and the burst.
 *
 * The burst waits until the section is properly on screen, so it arrives as
 * an answer to the line rather than as decoration somewhere off to the side.
 * Pressing the button throws it again — the same reflex a demo button should
 * have.
 */
export function Ending() {
  const ref = useRef<HTMLElement>(null);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setRun((n) => n + 1);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setRun((n) => n + 1);
        observer.disconnect();
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="ending" ref={ref} aria-label="Get started">
      <Burst trigger={run} />

      <div className="fin">
        <h2>Two lines is all it takes.</h2>
        <div className="cta">
          <CopyButton className="btn primary code" text="npm i blobbies" label="npm i blobbies" />
          <button type="button" className="btn" onClick={() => setRun((n) => n + 1)}>
            <GitHubIcon /> Throw them again
          </button>
        </div>
        <p className="meta">
          MIT · no dependencies ·{' '}
          <a href={REPO} target="_blank" rel="noreferrer">
            SouravInsights/blobbies
          </a>
        </p>
      </div>
    </section>
  );
}
