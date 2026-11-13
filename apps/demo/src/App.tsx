import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar } from '@blobbies/react';
import { Menu } from 'iconoir-react';
import { Api, Footer } from './sections/Api';
import { Draws } from './sections/Draws';
import { Ending } from './sections/Ending';
import { Film } from './sections/Film';
import { Hero } from './sections/Hero';
import { Playground, DEFAULTS, avatarPropsFrom, type Controls } from './sections/Playground';
import { QuickStart } from './sections/QuickStart';
import { buildNames } from './data';
import { GitHubIcon, ThemeIcon, REPO } from './ui';

const STRESS = buildNames(200);

/** The sections the bar links to. */
const SECTIONS = [
  ['#start', 'Quick start'],
  ['#playground', 'Playground'],
  ['#draws', 'Glyphs'],
  ['#api', 'API'],
] as const;

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
  const [menu, setMenu] = useState(false);

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

  useEffect(() => {
    const onScroll = (): void => {
      document.documentElement.dataset.scrolled = window.scrollY > 8 ? '1' : '';
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The menu is a sheet over the page: it has to give way to anything that
  // means the visitor has moved on.
  useEffect(() => {
    if (!menu) return undefined;
    const close = (): void => setMenu(false);
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
    };
  }, [menu]);

  const flipTheme = (): void => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const themeLabel = `Switch to ${theme === 'dark' ? 'light' : 'dark'} appearance`;

  return (
    <div id="top">
      <a className="skip" href="#main">
        Skip to content
      </a>

      <header className="bar" data-menu={menu ? '1' : '0'}>
        <a className="brand" href="#top">
          <Mark />
          <span className="brand-word">blobbies</span>
          <span className="brand-version">0.1.0</span>
        </a>

        <nav className="barnav" aria-label="Sections">
          {SECTIONS.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <div className="bar-end">
          <a className="bar-cta" href={REPO} target="_blank" rel="noreferrer">
            <GitHubIcon size={15} />
            <span>GitHub</span>
          </a>
          <button type="button" className="icon-btn bar-theme" onClick={flipTheme} aria-label={themeLabel}>
            <ThemeIcon theme={theme} />
          </button>
          <button
            type="button"
            className="icon-btn bar-menu-btn"
            onClick={() => setMenu((m) => !m)}
            aria-expanded={menu}
            aria-controls="bar-menu"
            aria-label={menu ? 'Close menu' : 'Open menu'}
          >
            <Menu width={17} height={17} aria-hidden="true" />
          </button>
        </div>

        <div className="bar-menu" id="bar-menu" hidden={!menu}>
          <nav aria-label="Sections">
            {SECTIONS.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenu(false)}>
                {label}
              </a>
            ))}
          </nav>
          <div className="bar-menu-foot">
            <a href={REPO} target="_blank" rel="noreferrer">
              <GitHubIcon size={15} />
              <span>GitHub</span>
            </a>
            <button type="button" onClick={flipTheme}>
              <ThemeIcon theme={theme} />
              <span>{theme === 'dark' ? 'Light' : 'Dark'} appearance</span>
            </button>
          </div>
        </div>
      </header>

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
            <Film />
            <QuickStart />
            <Playground value={controls} onChange={setControls} onAdopt={setName} />
            <Draws name={name} onPick={setName} />
            <Api />
            <Ending />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
