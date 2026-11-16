import { Globe } from 'lucide-react';
import { LOGOS } from './logos';

/**
 * Marks for the tab strip.
 *
 * The brand marks are svgl's (https://svgl.app) — the real multi-colour logos,
 * inlined by `scripts/fetch-logos.mjs` and keyed by the `icon` on each platform.
 * Nothing here is hand-drawn: a guessed path for a brand mark is a wrong logo.
 *
 * The HTTP row is the only one without a mark, because there is no such thing
 * as an HTTP logo — so it takes a lucide globe rather than something invented.
 */
const GLYPHS: Record<string, typeof Globe> = {
  globe: Globe,
};

export function Icon({ name, size = 21 }: { name: string; size?: number }): JSX.Element | null {
  const logo = LOGOS[name];
  if (logo) {
    return (
      <span
        className="plats-logo"
        style={{ width: size, height: size }}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: logo }}
      />
    );
  }

  const Glyph = GLYPHS[name];
  if (!Glyph) return null;

  return <Glyph className="plats-glyph" size={size} strokeWidth={1.8} aria-hidden="true" />;
}
