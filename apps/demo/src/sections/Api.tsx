import { useRef, useState } from 'react';
import {
  CORE_SNIPPET,
  DATA_URI_SNIPPET,
  INSTALL,
  MOTION_SNIPPET,
  NPM,
  REACT_SNIPPET,
} from '../data';
import { Code, CopyButton, GitHubIcon, REPO } from '../ui';
import { Lead } from './Lead';

/** The four ways in, as tabs over one code panel. */
const SAMPLES = [
  { id: 'core', label: 'core', file: 'avatar.ts', code: CORE_SNIPPET },
  { id: 'react', label: 'react', file: 'Avatar.tsx', code: REACT_SNIPPET },
  { id: 'image', label: 'image', file: 'img.ts', code: DATA_URI_SNIPPET },
  { id: 'motion', label: 'motion', file: 'follow.ts', code: MOTION_SNIPPET },
] as const;

/** Everything you can import, grouped by the package it comes from. */
const REFERENCE: Array<{ pkg: string; note: string; items: Array<[string, string]> }> = [
  {
    pkg: 'blobbies',
    note: 'No dependencies. Works in the browser, in Node, and in a worker.',
    items: [
      ['renderAvatarSvg(name, options?)', 'A complete, standalone SVG string.'],
      ['renderAvatarBody(name, options?)', 'The inner markup, if you own the <svg>.'],
      ['avatarDataUri(name, options?)', 'A data URI, for an <img>, CSS or email.'],
      ['resolveAvatar(name, options?)', 'Every seeded decision, without drawing.'],
      ['getInitials(name)', 'The two eye characters: “SN”, “IR”, “?”.'],
      ['LETTER_PATHS', 'The 36 hand-drawn glyphs, as path data.'],
    ],
  },
  {
    pkg: '@blobbies/react',
    note: 'blobbies is the only runtime dependency. React 18+ is a peer.',
    items: [
      ['<Avatar name="…" />', 'Inline SVG. Memoised, so a re-render never restarts a blink.'],
      ['useAvatarMotion(ref, options?)', 'Attach the follow runtime to an SVG you already have.'],
    ],
  },
  {
    pkg: 'blobbies/motion',
    note: 'A separate entry point: static users never download it. 2 KB gzipped.',
    items: [
      ['attachAvatarMotion(el, options?)', 'Returns a cleanup function. One listener and one rAF for the whole page.'],
    ],
  },
];

/** Every option the three entry points share. */
const OPTIONS: Array<[string, string, string]> = [
  ['size', 'number | string', '48'],
  ['rounded', 'boolean', 'false'],
  ['title', 'boolean', 'false'],
  ['palette', 'readonly string[]', 'built-in'],
  ['animate', "boolean | 'blink' | 'follow' | 'all'", 'false'],
  ['blinkInterval', '[min, max] ms', '[2500, 6000]'],
  ['followRange', 'number', '6'],
  ['smoothing', '0..1', '0.15'],
  ['idleTimeout', 'number ms', '2500'],
  ['respectReducedMotion', 'boolean', 'true'],
  ['wink · glance · surprise', 'boolean', 'false'],
];

export function Api() {
  const [active, setActive] = useState<(typeof SAMPLES)[number]['id']>('core');
  const sample = SAMPLES.find((s) => s.id === active) ?? SAMPLES[0];
  const listRef = useRef<HTMLDivElement>(null);

  /** Left and right move between tabs; Home and End go to the ends. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
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
      <Lead
        title="Two packages, one import."
        note="Nothing at runtime except each other. The motion is its own entry point."
      />

      <div className="api">
        <div className="api-install">
          <CopyButton className="btn code" text={INSTALL} label={INSTALL} />
          <span className="api-note">React is a peer dependency. Everything else is included.</span>
        </div>

        <div className="api-code">
          <div className="api-tablist" role="tablist" aria-label="Examples" ref={listRef} onKeyDown={onKeyDown}>
            {SAMPLES.map((s) => (
              <button
                key={s.id}
                id={`tab-${s.id}`}
                type="button"
                role="tab"
                aria-selected={s.id === active}
                aria-controls="api-panel"
                tabIndex={s.id === active ? 0 : -1}
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

        <div className="api-ref">
          {REFERENCE.map((group) => (
            <div className="api-group" key={group.pkg}>
              <div className="api-group-head">
                <code>{group.pkg}</code>
                <span>{group.note}</span>
              </div>
              <dl>
                {group.items.map(([signature, what]) => (
                  <div key={signature}>
                    <dt>
                      <code>{signature}</code>
                    </dt>
                    <dd>{what}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <div className="api-options">
          <div className="api-group-head">
            <code>options</code>
            <span>Shared by all three. Every one has a deterministic default.</span>
          </div>
          <dl className="api-options-list">
            {OPTIONS.map(([name, type, fallback]) => (
              <div key={name}>
                <dt>
                  <code>{name}</code>
                </dt>
                <dd>
                  <code className="api-type">{type}</code>
                  <span className="api-default">{fallback}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
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
