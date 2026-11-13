import { useEffect, useMemo, useState } from 'react';
import { Avatar } from '@blobbies/react';
import { Alpha } from './sections/Alpha';
import { Api, Footer } from './sections/Api';
import { Behaviour } from './sections/Behaviour';
import { Colony } from './sections/Colony';
import { Hero } from './sections/Hero';
import {
  DEFAULTS,
  Playground,
  avatarPropsFrom,
  type Controls,
} from './sections/Playground';
import { Alphabet, Derivation, SpecimenData } from './sections/Specimens';
import { buildNames } from './data';

const STRESS = buildNames(200);

/** Ten-pixel mark: the disk, the egg, two eyes. Same construction as the real thing. */
function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="50" fill="var(--mark-disk)" />
      <ellipse cx="50" cy="60" rx="41" ry="38" fill="#FFD43B" />
      <circle cx="38" cy="55" r="5" fill="#1c1c1c" />
      <circle cx="62" cy="55" r="5" fill="#1c1c1c" />
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

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#15121b' : '#f6f3ec');
  }, [theme]);

  // Screenshot hook: ?pointer=x,y fires a synthetic pointer so the follow tier
  // can be captured headlessly. Harmless in normal use.
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

  // Screenshot hook: ?scroll=<px> jumps to a position after paint so individual
  // viewports can be captured headlessly.
  useEffect(() => {
    const y = Number(params.get('scroll') ?? '0');
    if (!y) return undefined;
    const t = window.setTimeout(() => window.scrollTo(0, y), 120);
    return () => window.clearTimeout(t);
  }, [params]);

  const nav = [
    ['Colony', '#colony'],
    ['Behaviour', '#behaviour'],
    ['Alphabet', '#alphabet'],
    ['Playground', '#playground'],
    ['API', '#api'],
  ] as const;

  return (
    <div className="page">
      <a className="skip" href="#main">
        Skip to content
      </a>

      <header className="topbar">
        <a className="brand" href="#top">
          <Mark />
          <span>blobbies</span>
        </a>
        <nav className="topnav" aria-label="Sections">
          {nav.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="topbar-end">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} appearance`}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <main id="main">
        {stress ? (
          <section className="stress">
            <h1 className="plate-title">200 avatars, all animated.</h1>
            <p className="plate-lede">
              Motion is written to CSS variables by a single shared loop. React never re-renders on
              pointer movement.
            </p>
            <div className="stress-grid">
              {STRESS.map((n, i) => (
                <Avatar key={`${n}-${i}`} name={n} size={52} {...avatarPropsFrom(controls)} />
              ))}
            </div>
          </section>
        ) : (
          <>
            <Hero name={name} />
            <Colony />
            <Derivation name={name} setName={setName} />
            <Behaviour name={name} />
            <Alphabet />
            <SpecimenData name={name} />
            <Playground value={controls} onChange={setControls} onAdopt={setName} />
            <Alpha />
            <Api />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
