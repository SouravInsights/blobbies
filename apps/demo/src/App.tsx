import { useEffect, useMemo, useState } from 'react';
import { Avatar } from '@blobbies/react';
import { Api, Footer } from './sections/Api';
import { Behaviour } from './sections/Behaviour';
import { Count } from './sections/Count';
import { Draws } from './sections/Draws';
import { Hero } from './sections/Hero';
import { Playground, DEFAULTS, avatarPropsFrom, type Controls } from './sections/Playground';
import { QuickStart } from './sections/QuickStart';
import { buildNames } from './data';

const STRESS = buildNames(200);

/** The mark is built the same way an avatar is: disk, egg, two eyes. */
function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx="50" cy="50" r="50" fill="#2f2f2f" />
      <ellipse cx="50" cy="60" rx="41" ry="38" fill="#FFD43B" />
      <circle cx="38" cy="55" r="5.5" fill="#1c1c1c" />
      <circle cx="62" cy="55" r="5.5" fill="#1c1c1c" />
    </svg>
  );
}

export function App(): JSX.Element {
  const params = useMemo(
    () => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''),
    [],
  );
  const [name, setName] = useState(() => params.get('name') ?? 'Sourav Nanda');
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    params.get('theme') === 'light' ? 'light' : 'dark',
  );
  const [stress, setStress] = useState(() => params.get('stress') === '1');
  const [controls, setControls] = useState<Controls>(DEFAULTS);

  // Hairline under the bar only after you have scrolled, so the top of the
  // page stays completely open.
  useEffect(() => {
    const onScroll = (): void => {
      document.documentElement.dataset.scrolled = window.scrollY > 8 ? '1' : '';
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#15151a' : '#fbfaf7');
  }, [theme]);

  // Screenshot hooks. ?pointer=x,y fires a synthetic pointer so the follow tier
  // can be captured headlessly; ?stress=1 renders the 200-avatar stress grid.
  useEffect(() => {
    const pointer = params.get('pointer');
    if (!pointer) return undefined;
    const [x, y] = pointer.split(',').map(Number);
    const fire = (): void => {
      window.dispatchEvent(new MouseEvent('pointermove', { clientX: x ?? 0, clientY: y ?? 0 }));
    };
    fire();
    const t = window.setTimeout(fire, 600);
    return () => window.clearTimeout(t);
  }, [params]);

  return (
    <div id="top">
      <a className="skip" href="#main">
        Skip to content
      </a>

      <div className="topbar">
        <a className="brand" href="#top">
          <Mark />
          <span>blobbies</span>
        </a>
        <nav className="topnav" aria-label="Sections">
          <a href="#start">Quick start</a>
          <a href="#behaviour">Behaviour</a>
          <a href="#playground">Playground</a>
          <a href="#api">API</a>
        </nav>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} appearance`}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>

      <main id="main">
        {stress ? (
          <section className="stress" style={{ marginTop: 40 }}>
            <div className="lead">
              <h2>200 avatars, all animated.</h2>
              <p>One pointer listener, one animation frame loop, no React renders.</p>
            </div>
            <div className="stress-grid">
              {STRESS.map((n, i) => (
                <Avatar key={`${n}-${i}`} name={n} size={52} {...avatarPropsFrom(controls)} />
              ))}
            </div>
          </section>
        ) : (
          <>
            <Hero />
            <QuickStart />
            <Behaviour name={name} />
            <Playground value={controls} onChange={setControls} onAdopt={setName} />
            <Count />
            <Draws onPick={setName} />
            <Api />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
