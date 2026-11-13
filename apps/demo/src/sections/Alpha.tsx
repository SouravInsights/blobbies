import { Plate } from '../ui';

const HAVE = [
  'Core renderer, deterministic from a hash — no Math.random anywhere.',
  'Blink tier as scoped CSS that survives an <img> data URI.',
  'Cursor-follow runtime with one shared listener and one rAF loop.',
  'React bindings, SSR-safe and Strict Mode safe.',
  'Geometry guards: the egg is clipped to the disk and can never escape it.',
  '41 core tests, 11 React tests, zero runtime dependencies.',
];

const HAVE_NOT = [
  'React is the only binding today. Vue and Svelte are not written.',
  'No build-time sprite sheet or server-side cache — every render is fresh.',
  'The follow tier needs inline SVG. An <img> can blink but cannot watch.',
  'No Vue/Svelte/Web Component wrappers yet.',
  'Glyphs cover A–Z and 0–9; other scripts fall back to a bold text element.',
];

/** Plate 08 — status, stated plainly. Honesty is cheaper than a changelog. */
export function Alpha() {
  return (
    <Plate
      index="Plate 08 · Status"
      id="status"
      title="It is early, and it is honest about that."
      lede="v0.1.0. The renderer and both animation tiers are tested and stable. The surface around them is still growing."
    >
      <div className="alpha">
        <div className="alpha-col">
          <span className="label">Working today</span>
          <ul>
            {HAVE.map((t) => (
              <li key={t}>
                <span className="tick" aria-hidden="true">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="alpha-col">
          <span className="label">Not built yet</span>
          <ul>
            {HAVE_NOT.map((t) => (
              <li key={t}>
                <span className="tick tick-no" aria-hidden="true">
                  —
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Plate>
  );
}
