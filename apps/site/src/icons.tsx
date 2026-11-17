import { Globe } from 'lucide-react';
import { LOGOS } from './logos';

/**
 * Brand marks, for the places that show one.
 *
 * They are svgl's (https://svgl.app) — the real multi-colour logos, inlined by
 * `scripts/fetch-logos.mjs` and keyed by name. Nothing here is hand-drawn: a
 * guessed path for a brand mark is a wrong logo.
 *
 * `globe` is the one exception, because there is no such thing as an HTTP logo
 * — so it takes a lucide glyph rather than something invented.
 */
const GLYPHS: Record<string, typeof Globe> = {
  globe: Globe,
};

export function Icon({
  name,
  size = 21,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}): JSX.Element | null {
  const logo = LOGOS[name];
  if (logo) {
    return (
      <span
        className={['brand-mark', className].filter(Boolean).join(' ')}
        style={{ width: size, height: size }}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: logo }}
      />
    );
  }

  const Glyph = GLYPHS[name];
  if (!Glyph) return null;

  return (
    <Glyph
      className={['plats-glyph', className].filter(Boolean).join(' ')}
      size={size}
      strokeWidth={1.8}
      aria-hidden="true"
    />
  );
}
