import { useEffect, useMemo, useState } from 'react';
import { Avatar } from '@blobbies/react';
import type { AvatarAnimate } from '@blobbies/react';

const FIRST = [
  'Ada', 'Grace', 'Sourav', 'Ira', 'John', 'Jane', 'Linus', 'Maya', 'Nina', 'Omar',
  'Priya', 'Quinn', 'Rosa', 'Sam', 'Tara', 'Uma', 'Vera', 'Wes', 'Xiu', 'Yara', 'Zoe',
  'Ken', 'Lena', 'Milo', 'Nadia', 'Owen', 'Pia', 'Rex', 'Sofia', 'Theo', 'Ula',
];
const LAST = [
  'Nanda', 'Hopper', 'Lovelace', 'Doe', 'Chen', 'Singh', 'Patel', 'Khan', 'Ali',
  'Garcia', 'Rossi', 'Muller', 'Novak', 'Silva', 'Haddad', 'Kim', 'Nakamura',
  'Okafor', 'Petrov', 'Dubois',
];

const SAMPLE_NAMES: string[] = Array.from({ length: 60 }, (_, i) => {
  const first = FIRST[(i * 3) % FIRST.length] as string;
  const last = LAST[(i * 7 + 1) % LAST.length] as string;
  return i % 9 === 0 ? first : `${first} ${last}`;
});

const STRESS_NAMES: string[] = Array.from({ length: 200 }, (_, i) => {
  const first = FIRST[(i * 5) % FIRST.length] as string;
  const last = LAST[(i * 11 + 3) % LAST.length] as string;
  return `${first} ${last}`;
});

type Flag = 'auto' | 'on' | 'off';

interface Controls {
  animate: AvatarAnimate;
  blink: Flag;
  follow: Flag;
  blinkMin: number;
  blinkMax: number;
  followRange: number;
  smoothing: number;
  idleTimeout: number;
  size: number;
  rounded: boolean;
  paused: boolean;
  respectReducedMotion: boolean;
  wink: boolean;
  glance: boolean;
  surprise: boolean;
}

const DEFAULTS: Controls = {
  animate: 'all',
  blink: 'auto',
  follow: 'auto',
  blinkMin: 2500,
  blinkMax: 6000,
  followRange: 6,
  smoothing: 0.15,
  idleTimeout: 2500,
  size: 128,
  rounded: false,
  paused: false,
  respectReducedMotion: true,
  wink: true,
  glance: true,
  surprise: true,
};

function flagValue(flag: Flag): boolean | undefined {
  return flag === 'auto' ? undefined : flag === 'on';
}

export function App(): JSX.Element {
  const params = useMemo(
    () => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''),
    [],
  );
  const [name, setName] = useState(() => params.get('name') ?? 'Sourav Nanda');
  const [dark, setDark] = useState(() => params.get('theme') !== 'light');
  const [stress, setStress] = useState(() => params.get('stress') === '1');
  const [copied, setCopied] = useState(false);
  const [c, setC] = useState<Controls>(DEFAULTS);

  const set = <K extends keyof Controls>(key: K, value: Controls[K]): void =>
    setC((prev) => ({ ...prev, [key]: value }));

  // Debug helper for automated screenshots: ?pointer=x,y fires a synthetic
  // pointermove so cursor-follow can be captured headlessly.
  useEffect(() => {
    const pointer = params.get('pointer');
    if (!pointer) return undefined;
    const [x, y] = pointer.split(',').map(Number);
    const fire = (): void => {
      window.dispatchEvent(new MouseEvent('pointermove', { clientX: x ?? 0, clientY: y ?? 0 }));
    };
    fire();
    const timer = setTimeout(fire, 600);
    return () => clearTimeout(timer);
  }, [params]);

  const avatarProps = useMemo(
    () => ({
      animate: c.animate,
      blink: flagValue(c.blink),
      follow: flagValue(c.follow),
      blinkInterval: [Math.min(c.blinkMin, c.blinkMax), Math.max(c.blinkMin, c.blinkMax)] as [
        number,
        number,
      ],
      followRange: c.followRange,
      smoothing: c.smoothing,
      idleTimeout: c.idleTimeout,
      rounded: c.rounded,
      paused: c.paused,
      respectReducedMotion: c.respectReducedMotion,
      wink: c.wink,
      glance: c.glance,
      surprise: c.surprise,
    }),
    [
      c.animate,
      c.blink,
      c.follow,
      c.blinkMin,
      c.blinkMax,
      c.followRange,
      c.smoothing,
      c.idleTimeout,
      c.rounded,
      c.paused,
      c.respectReducedMotion,
      c.wink,
      c.glance,
      c.surprise,
    ],
  );

  const installSnippet = `npm i blobbies @blobbies/react

import { Avatar } from '@blobbies/react'

<Avatar name="${name}" animate="all" wink />`;

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(installSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={dark ? 'app dark' : 'app light'}>
      <header className="topbar">
        <div>
          <h1>Blobbies</h1>
          <p>Deterministic, cute SVG avatars. Blink (CSS) + cursor follow (JS).</p>
        </div>
        <div className="topbar-actions">
          <button type="button" onClick={() => setStress((s) => !s)}>
            {stress ? '← Back to demo' : '200-avatar stress test'}
          </button>
          <button type="button" onClick={() => setDark((d) => !d)}>
            {dark ? '☀ Light' : '☾ Dark'}
          </button>
        </div>
      </header>

      {stress ? (
        <section className="stress">
          <p className="hint">
            200 avatars, all animated (blink + follow). Pointer moves must stay smooth — motion is
            written to CSS variables, never through React state.
          </p>
          <div className="grid stress-grid">
            {STRESS_NAMES.map((n, i) => (
              <Avatar key={`${n}-${i}`} name={n} size={56} {...avatarProps} />
            ))}
          </div>
        </section>
      ) : (
        <main className="layout">
          <aside className="panel">
            <label className="field">
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Type a name…" />
            </label>

            <label className="field">
              <span>Animate</span>
              <select
                value={String(c.animate)}
                onChange={(e) =>
                  set(
                    'animate',
                    (e.target.value === 'false' ? false : e.target.value) as AvatarAnimate,
                  )
                }
              >
                <option value="false">Off (static)</option>
                <option value="blink">Blink only</option>
                <option value="follow">Follow only</option>
                <option value="all">Blink + follow</option>
              </select>
            </label>

            <div className="row">
              <label className="field">
                <span>Blink</span>
                <select value={c.blink} onChange={(e) => set('blink', e.target.value as Flag)}>
                  <option value="auto">auto</option>
                  <option value="on">on</option>
                  <option value="off">off</option>
                </select>
              </label>
              <label className="field">
                <span>Follow</span>
                <select value={c.follow} onChange={(e) => set('follow', e.target.value as Flag)}>
                  <option value="auto">auto</option>
                  <option value="on">on</option>
                  <option value="off">off</option>
                </select>
              </label>
            </div>

            <Slider label={`Blink min — ${c.blinkMin}ms`} min={500} max={8000} step={100} value={c.blinkMin} onChange={(v) => set('blinkMin', v)} />
            <Slider label={`Blink max — ${c.blinkMax}ms`} min={500} max={12000} step={100} value={c.blinkMax} onChange={(v) => set('blinkMax', v)} />
            <Slider label={`Follow range — ${c.followRange}`} min={0} max={14} step={0.5} value={c.followRange} onChange={(v) => set('followRange', v)} />
            <Slider label={`Smoothing — ${c.smoothing}`} min={0.02} max={1} step={0.01} value={c.smoothing} onChange={(v) => set('smoothing', v)} />
            <Slider label={`Idle timeout — ${c.idleTimeout}ms`} min={0} max={8000} step={100} value={c.idleTimeout} onChange={(v) => set('idleTimeout', v)} />
            <Slider label={`Size — ${c.size}px`} min={32} max={220} step={4} value={c.size} onChange={(v) => set('size', v)} />

            <div className="checks">
              <Check label="Rounded" checked={c.rounded} onChange={(v) => set('rounded', v)} />
              <Check label="Paused" checked={c.paused} onChange={(v) => set('paused', v)} />
              <Check label="Respect reduced motion" checked={c.respectReducedMotion} onChange={(v) => set('respectReducedMotion', v)} />
              <Check label="Wink on click" checked={c.wink} onChange={(v) => set('wink', v)} />
              <Check label="Idle glance" checked={c.glance} onChange={(v) => set('glance', v)} />
              <Check label="Surprise up close" checked={c.surprise} onChange={(v) => set('surprise', v)} />
            </div>

            <div className="snippet">
              <div className="snippet-head">
                <span>Install &amp; use</span>
                <button type="button" onClick={copy}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre>{installSnippet}</pre>
            </div>
          </aside>

          <section className="stage">
            <div className="hero">
              <Avatar name={name || '?'} size={c.size} {...avatarProps} />
              <div className="hero-meta">
                <strong>{name || '(empty)'}</strong>
                <span>Move your cursor around the page. Click for a wink.</span>
              </div>
            </div>

            <h2>60 sample names</h2>
            <div className="grid samples">
              {SAMPLE_NAMES.map((n) => (
                <button
                  type="button"
                  className="sample"
                  key={n}
                  onClick={() => setName(n)}
                  title={n}
                >
                  <Avatar name={n} size={72} {...avatarProps} />
                  <small>{n}</small>
                </button>
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

function Slider(props: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}): JSX.Element {
  return (
    <label className="field slider">
      <span>{props.label}</span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Check(props: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}): JSX.Element {
  return (
    <label className="check">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      <span>{props.label}</span>
    </label>
  );
}
