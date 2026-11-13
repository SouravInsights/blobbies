import { useRef, useState } from 'react';
import {
  CORE_SNIPPET,
  DATA_URI_SNIPPET,
  INSTALL,
  MOTION_SNIPPET,
  NPM,
  OPTIONS_SNIPPET,
  REACT_SNIPPET,
  TYPES_SNIPPET,
} from '../data';
import { Code, CopyButton, GitHubIcon, REPO } from '../ui';
import { Lead } from './Lead';

/**
 * Four ways to use it, then the reference — all in one panel.
 *
 * The reference is the one thing a landing page usually gets wrong. A table of
 * twenty rows reads as a syllabus: here is everything you will have to learn.
 * The same information written as the types, with the defaults in the comments,
 * is shorter, complete, scannable, and is exactly what a reader would paste —
 * it is the artefact they wanted, not a description of it.
 */
interface Sample {
  id: string;
  label: string;
  file: string;
  code: string;
  /** Starts the reference half of the list. */
  divide?: boolean;
}

const SAMPLES: readonly Sample[] = [
  { id: 'core', label: 'core', file: 'avatar.ts', code: CORE_SNIPPET },
  { id: 'react', label: 'react', file: 'Avatar.tsx', code: REACT_SNIPPET },
  { id: 'image', label: 'image', file: 'img.ts', code: DATA_URI_SNIPPET },
  { id: 'motion', label: 'motion', file: 'follow.ts', code: MOTION_SNIPPET },
  { id: 'types', label: 'types', file: 'blobbies.d.ts', code: TYPES_SNIPPET, divide: true },
  { id: 'options', label: 'options', file: 'options.ts', code: OPTIONS_SNIPPET },
];

export function Api() {
  const [active, setActive] = useState<string>('core');
  const sample = SAMPLES.find((s) => s.id === active) ?? (SAMPLES[0] as Sample);
  const listRef = useRef<HTMLDivElement>(null);

  /** Left and right move between tabs; Home and End go to the ends. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const at = SAMPLES.findIndex((s) => s.id === active);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? SAMPLES.length - 1
          : (at + (event.key === 'ArrowRight' ? 1 : -1) + SAMPLES.length) % SAMPLES.length;
    const id = SAMPLES[next]?.id ?? 'core';
    setActive(id);
    listRef.current?.querySelector<HTMLButtonElement>(`#tab-${id}`)?.focus();
  };

  return (
    <section className="section" id="api">
      <Lead title="Three imports, and you are done." note="Nothing at runtime except each other." />

      <div className="api">
        <div className="api-install">
          <CopyButton className="btn code" text={INSTALL} label={INSTALL} />
          <span className="api-note">React is a peer dependency. Everything else is included.</span>
        </div>

        <div className="api-code">
          <div
            className="api-tablist"
            role="tablist"
            aria-label="Examples and reference"
            ref={listRef}
            onKeyDown={onKeyDown}
          >
            {SAMPLES.map((s) => (
              <button
                key={s.id}
                id={`tab-${s.id}`}
                type="button"
                role="tab"
                aria-selected={s.id === active}
                aria-controls="api-panel"
                tabIndex={s.id === active ? 0 : -1}
                data-divide={s.divide ? '1' : undefined}
                onClick={() => setActive(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <figure className="api-panel" id="api-panel" role="tabpanel" aria-labelledby={`tab-${active}`}>
            <figcaption>
              <span className="qs-file">{sample.file}</span>
              <CopyButton className="btn small" text={sample.code} label="Copy" />
            </figcaption>
            <Code code={sample.code} />
          </figure>
        </div>

        <p className="api-foot">
          Every option has a deterministic default, so anything you leave out still draws the same face.
          Try them in the <a href="#playground">playground</a>, or read the tables on{' '}
          <a href={NPM} target="_blank" rel="noreferrer">
            npm
          </a>{' '}
          and{' '}
          <a href={REPO} target="_blank" rel="noreferrer">
            <GitHubIcon size={13} /> GitHub
          </a>
          .
        </p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer>
      <nav>
        <a href={REPO} target="_blank" rel="noreferrer">
          <GitHubIcon size={13} /> GitHub
        </a>
        <a href={NPM} target="_blank" rel="noreferrer">
          npm
        </a>
        <a href="#top">Back to top</a>
      </nav>
      <span>
        MIT · made by{' '}
        <a href="https://github.com/SouravInsights" target="_blank" rel="noreferrer">
          @souravinsights
        </a>
      </span>
    </footer>
  );
}
