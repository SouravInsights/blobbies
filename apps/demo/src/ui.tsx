import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LETTER_PATHS, STROKE_WIDTH, INK_COLOR, LETTER_BOX } from 'blobbies';

/* ------------------------------------------------------------------ *
 * Scroll reveal. One observer per element; the class drives CSS so   *
 * `prefers-reduced-motion` can opt out of the movement entirely.      *
 * ------------------------------------------------------------------ */
export function useReveal<T extends HTMLElement>(): React.RefObject<T> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    // Screenshot escape hatch: ?reveal=off paints everything immediately so a
    // single tall capture is not full of opacity-0 sections.
    if (window.location.search.includes('reveal=off')) {
      node.dataset.reveal = 'in';
      return undefined;
    }
    if (typeof IntersectionObserver === 'undefined') {
      node.dataset.reveal = 'in';
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.reveal = 'in';
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return ref;
}

/** A field-guide plate: rule, specimen label, title, lede. */
export function Plate(props: {
  index: string;
  title: string;
  lede?: ReactNode;
  id?: string;
  children: ReactNode;
  bleed?: boolean;
}) {
  const ref = useReveal<HTMLElement>();
  return (
    <section className="plate" id={props.id} ref={ref} data-reveal>
      <header className="plate-head">
        <span className="label">{props.index}</span>
        <h2 className="plate-title">{props.title}</h2>
        {props.lede ? <p className="plate-lede">{props.lede}</p> : null}
      </header>
      <div className={props.bleed ? 'plate-body bleed' : 'plate-body'}>{props.children}</div>
    </section>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="label">{children}</span>;
}

export function Copy({ text, label = 'Copy', className }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const run = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      timer.current = window.setTimeout(() => setDone(false), 1400);
    } catch {
      /* clipboard blocked — the text stays selectable */
    }
  };
  return (
    <button type="button" className={`copy ${className ?? ''}`} onClick={run} aria-live="polite">
      <span className="copy-text">{done ? 'Copied' : label}</span>
      <span className="copy-mark" aria-hidden="true">
        {done ? '✓' : '↓'}
      </span>
    </button>
  );
}

export function Install({ text = 'npm i blobbies' }: { text?: string }) {
  return (
    <div className="install">
      <code>
        <span className="install-prompt" aria-hidden="true">
          $
        </span>{' '}
        {text}
      </code>
      <Copy text={text} />
    </div>
  );
}

export function GitHubMark({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
      />
    </svg>
  );
}

/**
 * One hand-drawn letter, rendered from the library's own glyph data — the
 * alphabet plate is literally the same paths the avatars use for eyes.
 */
export function Glyph({ char, size = 44 }: { char: string; size?: number }) {
  const d = LETTER_PATHS[char];
  const s = (size / LETTER_BOX.width) * 0.78;
  if (!d) return null;
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
