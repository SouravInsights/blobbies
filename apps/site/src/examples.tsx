import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { EXAMPLES } from './examples-data';
import { GitHubIcon, Mark, REPO } from './ui';
import './styles.css';
import './examples.css';

/**
 * Where the examples live.
 *
 * A page rather than a section, because the landing page is an argument and
 * this is a list. Someone arrives here from one link, wants one of four apps,
 * and should be one click from it — not four screens of scrolling first.
 */
function Examples() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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
            The same avatar and the same picker in each. Drag the map in two of them
            and watch them answer identically — that is the point, and it is the one
            thing a screenshot cannot tell you.
          </p>
        </div>

        <ul className="ex-list">
          {EXAMPLES.map((example) => (
            <li key={example.name}>
              <a className="ex-card" href={example.href} target="_blank" rel="noreferrer">
                <span className="ex-card-head">
                  <b>{example.name}</b>
                  <span className="ex-file">{example.file}</span>
                </span>
                <span className="ex-what">{example.what}</span>
                <span className="ex-open">
                  Open
                  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 2.5h5.5V8M9.5 2.5 3 9" />
                  </svg>
                </span>
                {!example.picker && <span className="ex-tag">no picker</span>}
              </a>
            </li>
          ))}
        </ul>

        <p className="ex-foot">
          The <a href="/">landing page</a> has the playground and the picker inline,
          if you would rather try one before choosing a framework.
        </p>
      </main>
    </div>
  );
}

createRoot(document.querySelector('#root') as HTMLElement).render(<Examples />);
