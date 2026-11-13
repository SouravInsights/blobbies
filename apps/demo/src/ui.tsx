import {
  Fragment,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Check, Copy, Github, MoonSat, SunLight } from 'iconoir-react';
import { BACKDROP_COLOR, INK_COLOR, LETTER_PATHS, STROKE_WIDTH, LETTER_BOX } from 'blobbies';
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

/**
 * A line, split into words so CSS can stagger them.
 *
 * Each word is its own inline-block with an index, which is all the film needs:
 * the line's parent carries the state, and every word reads `--i` for its own
 * place in the queue. The spaces stay as text nodes between them, so the line
 * breaks between words and the words never run together.
 *
 * The whole line is laid out from the first frame — only opacity, blur and
 * offset change — so nothing reflows as it is said.
 */
/** Eight words' worth of wait, which is the pause a full stop makes. */
const STOP = 8;

export function Words({ text }: { text: string }) {
  const words = useMemo(() => {
    const out: Array<{ word: string; i: number }> = [];
    let i = 0;
    // A sentence is a run of words; the counter skips a beat at the end of one,
    // so the next arrives as its own thought rather than as more of the last.
    for (const sentence of text.match(/[^.!?]+[.!?]*/g) ?? [text]) {
      for (const word of sentence.trim().split(/\s+/).filter(Boolean)) {
        out.push({ word, i: i++ });
      }
      i += STOP;
    }
    return out;
  }, [text]);

  return (
    <>
      {words.map(({ word, i }, k) => (
        <Fragment key={`${word}-${i}`}>
          {k > 0 ? ' ' : null}
          <span className="w" style={{ '--i': i } as CSSProperties}>
            {word}
          </span>
        </Fragment>
      ))}
    </>
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

/**
 * The mark: one blobbie, built out of the library's own geometry.
 *
 * It is not a drawing of an avatar — it is an avatar. The same egg path, the
 * same disk it is clipped to, the same ink, at the same places. The one thing
 * it leaves out is the initials: the eyes of a real avatar are letterforms,
 * and at sixteen pixels a letterform is a smudge, so the mark is the face
 * without the name on it.
 *
 * The mouth is what it used to be missing. A disk, an egg and two dots is a
 * shape; a disk, an egg, two dots and a smile is a face.
 */
const MARK_BLOB =
  'M44 10.18C44 -23.34 22 -37.7 0 -37.7C-22 -37.7 -44 -23.34 -44 10.18C-44 25.2 -24 38 0 38C24 38 44 25.2 44 10.18Z';

/** The face, in the library's own ink at the library's own coordinates. */
const MARK_FACE =
  '<circle cx="38" cy="56.2" r="7.5"/><circle cx="61" cy="56.2" r="7.5"/>' +
  '<path transform="translate(50 78)" d="M-9 0 A9 7 0 0 0 9 0 Z"/>';

export function Mark({ size = 22 }: { size?: number }) {
  // Sanitised because React's ids carry colons, which are legal in an id but
  // not in the functional notation this is used in.
  const clip = `mk-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clip}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="50" fill={BACKDROP_COLOR} />
      {/* Clipped to the disk exactly as the library clips a real one, so the
          egg can never poke out of the circle. */}
      <g clipPath={`url(#${clip})`}>
        <g transform="translate(50 61.09)">
          <path d={MARK_BLOB} fill="#FFD43B" />
        </g>
      </g>
      <g fill={INK_COLOR} dangerouslySetInnerHTML={{ __html: MARK_FACE }} />
    </svg>
  );
}

/** The same mark as a data URI, for the tab. */
export function markDataUri(size = 64): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">` +
    `<circle cx="50" cy="50" r="50" fill="${BACKDROP_COLOR}"/>` +
    `<clipPath id="m"><circle cx="50" cy="50" r="50"/></clipPath>` +
    `<g clip-path="url(#m)"><g transform="translate(50 61.09)">` +
    `<path d="${MARK_BLOB}" fill="#FFD43B"/></g></g>` +
    `<g fill="${INK_COLOR}">${MARK_FACE}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * The box the glyphs' ink actually occupies inside the 24-unit authoring box,
 * measured across all thirty-six: the paths themselves, plus half the stroke
 * that sits outside them. It is taller than it is wide, and its centre is not
 * the box's centre.
 */
const INK = { x: 0.75, y: -0.3, w: 23.5, h: 25.05 };
const INK_CX = INK.x + INK.w / 2;
const INK_CY = INK.y + INK.h / 2;

/**
 * A single glyph from the library's own path data, fitted to its container.
 *
 * Sizing it by the authoring box rather than by the ink is what used to clip
 * these: the ink is 25 units tall in a 24-unit viewBox before any padding, so
 * anything that scaled the box up cut the tops and bottoms off. This scales by
 * the ink, on its own centre, and leaves the size to CSS.
 */
export function Glyph({ char, pad = 0.05 }: { char: string; pad?: number }) {
  const d = LETTER_PATHS[char];
  if (!d) return null;
  const s = (24 * (1 - pad * 2)) / Math.max(INK.w, INK.h);
  return (
    <svg viewBox="0 0 24 24" className="glyph" aria-hidden="true" focusable="false">
      <g transform={`translate(12 12) scale(${s.toFixed(4)}) translate(${-INK_CX} ${-INK_CY})`}>
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
