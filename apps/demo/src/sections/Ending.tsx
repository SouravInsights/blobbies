import { useEffect, useRef, useState } from 'react';
import { RefreshDouble } from 'iconoir-react';
import { Burst } from './Burst';
import { NPM } from '../data';
import { AUTHOR, CopyButton, REPO } from '../ui';

/**
 * The ending: the one line, the one command, and the burst.
 *
 * Three things, each with its own job and its own affordance: the command to
 * copy, a button to throw the blobs again because that is the fun part, and a
 * plain link to the source. The burst is a toy, so its button looks like a toy;
 * the repo is a link, so it gets the mark and a link's own treatment.
 *
 * The burst waits until the section is properly on screen, so it arrives as an
 * answer to the line rather than as decoration off to the side.
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
            <RefreshDouble width={15} height={15} aria-hidden="true" /> Throw them again
          </button>
        </div>
        {/* Two lines rather than one, because one line of five things is a
            list nobody reads and the separators trail onto a second row on a
            phone. What you can go to, then who made it. */}
        <div className="fin-foot">
          <nav className="fin-links" aria-label="Elsewhere">
            <a href={NPM} target="_blank" rel="noreferrer">
              npm
            </a>
            <a href={REPO} target="_blank" rel="noreferrer">
              Source
            </a>
            <a href="#top">Back to top</a>
          </nav>
          <p className="fin-credit">
            <span>MIT</span>
            <i aria-hidden="true">·</i>
            <span>
              Made by{' '}
              <a href={AUTHOR} target="_blank" rel="noreferrer">
                @souravinsights
              </a>
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
