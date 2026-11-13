import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LETTER_PATHS, STROKE_WIDTH, INK_COLOR, LETTER_BOX } from 'blobbies';

export const REPO = 'https://github.com/SouravInsights/blobbies';

export function GitHubIcon({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

/** Sun / moon as paths rather than text glyphs, so weight and size match. */
export function ThemeIcon({ theme }: { theme: 'dark' | 'light' }) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      {theme === 'dark' ? (
        <>
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
        </>
      ) : (
        <path d="M20 14.5A8.2 8.2 0 0 1 9.5 4a8.2 8.2 0 1 0 10.5 10.5Z" />
      )}
    </svg>
  );
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
      {state === 'idle' ? label : state === 'copied' ? 'Copied' : 'Copy failed'}
    </button>
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
