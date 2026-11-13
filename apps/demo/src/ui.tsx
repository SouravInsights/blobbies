import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, Copy, Github, MoonSat, SunLight } from 'iconoir-react';
import { LETTER_PATHS, STROKE_WIDTH, INK_COLOR, LETTER_BOX } from 'blobbies';
import { highlight, highlightShell } from './highlight';

export const REPO = 'https://github.com/SouravInsights/blobbies';

/** Every icon in the page, at the one size the type is set in. */
const ICON = 15;

export function GitHubIcon({ size = ICON }: { size?: number }) {
  return <Github width={size} height={size} aria-hidden="true" />;
}

/** Sun and moon, rather than a generic switch, so the state is readable at a glance. */
export function ThemeIcon({ theme }: { theme: 'dark' | 'light' }) {
  const Icon = theme === 'dark' ? SunLight : MoonSat;
  return <Icon width={ICON} height={ICON} aria-hidden="true" />;
}

export function CopyButton(props: { text: string; label: string; className?: string; icon?: ReactNode }) {
  const { text, label, className, icon } = props;
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (state === 'idle') return undefined;
    const timer = window.setTimeout(() => setState('idle'), 1400);
    return () => window.clearTimeout(timer);
  }, [state]);

  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        navigator.clipboard.writeText(text).then(
          () => setState('copied'),
          () => setState('failed'),
        )
      }
    >
      {icon}
      {state === 'copied' ? (
        <Check width={14} height={14} aria-hidden="true" />
      ) : (
        <Copy width={14} height={14} aria-hidden="true" />
      )}
      {state === 'idle' ? label : state === 'copied' ? 'Copied' : 'Copy failed'}
    </button>
  );
}

/** A highlighted code block. Plain text where there is nothing to say. */
export function Code({ code, lang = 'ts', className }: { code: string; lang?: 'ts' | 'sh'; className?: string }) {
  const tokens = useMemo(() => (lang === 'sh' ? highlightShell(code) : highlight(code)), [code, lang]);
  return (
    <pre className={className ? `code ${className}` : 'code'}>
      <code>
        {tokens.map((token, i) =>
          token.cls ? (
            <span key={i} className={token.cls}>
              {token.text}
            </span>
          ) : (
            token.text
          ),
        )}
      </code>
    </pre>
  );
}

/** A single glyph from the library's own path data. */
export function Glyph({ char, size = 44 }: { char: string; size?: number }) {
  const d = LETTER_PATHS[char];
  if (!d) return null;
  const s = (size / LETTER_BOX.width) * 0.8;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <g transform={`translate(${(24 - 24 * s) / 2} ${(24 - 24 * s) / 2}) scale(${s})`}>
        <path
          d={d}
          fill="none"
          stroke={INK_COLOR}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="butt"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/** Fires once, when the element first scrolls into view. */
export function useInView<T extends HTMLElement>(threshold = 0.4) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setSeen(true);
        io.disconnect();
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

/** Number that counts up once, unless the visitor prefers less motion. */
export function useCountUp(to: number, run: boolean): number {
  const [value, setValue] = useState(to);
  useEffect(() => {
    if (!run || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to);
      return undefined;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number): void => {
      const p = Math.min(1, (now - start) / 1200);
      setValue(Math.round(to * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run]);
  return value;
}
