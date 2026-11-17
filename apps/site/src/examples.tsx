import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Avatar } from '@blobbies/react';
import { EXAMPLES, SAMPLE } from './examples-data';
import { Icon } from './icons';
import { GitHubIcon, Mark, REPO } from './ui';
import './styles.css';
import './examples.css';

/**
 * Where the examples live.
 *
 * A page rather than a section, because the landing page is an argument and
 * this is a list. Someone arrives from one link, wants one of four apps, and
 * should be one click from it — not four screens of scrolling first.
 *
 * Every card shows the same three faces at three sizes. That repetition is the
 * page's whole argument: the avatar does not depend on what is around it, so
 * the only thing that differs between these four is the logo in the corner.
 */
function Examples() {
  // Same as the landing page: the theme can be set from the URL, so a link can
  // point at a light one and a screenshot can ask for one.
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    new URLSearchParams(window.location.search).get('theme') === 'light' ? 'light' : 'dark',
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="ex">
      <header className="ex-bar">
        <a className="brand" href="/">
          <Mark />
          <span className="brand-word">blobbies</span>
        </a>
        <div className="ex-bar-end">
          <a className="bar-cta" href={REPO} target="_blank" rel="noreferrer">
            <GitHubIcon size={15} />
            <span>GitHub</span>
          </a>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            <span className="ex-theme">{theme === 'dark' ? '☾' : '☀'}</span>
          </button>
        </div>
      </header>

      <main className="ex-main">
        <div className="ex-head">
          <h1>Every framework, running.</h1>
          <p className="ex-note">
            The same avatar and the same picker in each of them. Open two and drag
            the map in both — that is the one thing a screenshot cannot tell you.
          </p>
        </div>

        <ul className="ex-grid">
          {EXAMPLES.map((example) => (
            <li key={example.name}>
              <a className="ex-card" href={example.href} target="_blank" rel="noreferrer">
                <span className="ex-top">
                  <Icon name={example.icon} size={30} />
                  <span className="ex-id">
                    <b>{example.name}</b>
                    <span className="ex-file">{example.file}</span>
                  </span>
                </span>

                <span className="ex-what">{example.what}</span>

                <span className="ex-foot">
                  {/* The same face, three sizes, in every card. */}
                  <span className="ex-faces" aria-hidden="true">
                    <Avatar name={SAMPLE} size={20} />
                    <Avatar name={SAMPLE} size={28} />
                    <Avatar name={SAMPLE} size={38} animate="all" />
                  </span>
                  <span className="ex-open">
                    Open
                    <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 2.5h5.5V8M9.5 2.5 3 9" />
                    </svg>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="ex-note-foot">
          The <a href="/">landing page</a> has the playground and the picker inline,
          if you would rather try one before choosing a framework.
        </p>
      </main>
    </div>
  );
}

createRoot(document.querySelector('#root') as HTMLElement).render(<Examples />);
