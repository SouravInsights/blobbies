import { Avatar } from '@blobbies/react';
import { getInitials } from 'blobbies';
import { BUILDS, COMBINATIONS, EYE_PAIRS, GLYPHS } from '../data';
import { Glyph, Plate } from '../ui';

/** Plate 02 — the derivation: a name, the two letters it keeps, the face. */
export function Derivation({
  name,
  setName,
}: {
  name: string;
  setName: (v: string) => void;
}) {
  const initials = getInitials(name || '?');
  const letters = Array.from(initials);

  return (
    <Plate
      index="Plate 02 · Derivation"
      id="derive"
      title="The eyes are the initials."
      lede={
        <>
          First letter of the first and last word. One word, first two letters. Everything else —
          emoji, punctuation, spacing — is discarded before the hash is taken.
        </>
      }
    >
      <div className="derive">
        <div className="derive-input">
          <label className="label" htmlFor="name-input">
            Specimen name
          </label>
          <input
            id="name-input"
            className="name-input"
            value={name}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
            placeholder="Type a name…"
          />
        </div>

        <div className="derive-stage">
          <Avatar name={name || '?'} size={180} animate="all" style={{ width: 'min(180px, 46vw)', height: 'auto' }} />
        </div>
      </div>
      <p className="derive-hint">
        Try <button type="button" onClick={() => setName('Ira')}>Ira</button>,{' '}
        <button type="button" onClick={() => setName('@souravinsights')}>@souravinsights</button>{' '}
        or <button type="button" onClick={() => setName('😀')}>😀</button>.
      </p>

      <ol className="pipeline">
        <li>
          <span className="label">Input</span>
          <span className="pipeline-value">{name || '—'}</span>
        </li>
        <li aria-hidden="true" className="pipeline-arrow">
          →
        </li>
        <li>
          <span className="label">Initials</span>
          <span className="pipeline-tiles">
            {letters.map((ch, i) => (
              <span className="tile" key={`${ch}-${i}`}>
                {ch}
              </span>
            ))}
          </span>
        </li>
        <li aria-hidden="true" className="pipeline-arrow">
          →
        </li>
        <li>
          <span className="label">Eyes</span>
          <span className="pipeline-eyes">
            {letters.map((ch, i) => (
              <span className="eye-tile" key={`${ch}-${i}`}>
                <Glyph char={ch} size={40} />
              </span>
            ))}
          </span>
        </li>
      </ol>
    </Plate>
  );
}

/** Plate 04 — the alphabet, drawn from the library's own glyph paths. */
export function Alphabet() {
  return (
    <Plate
      index="Plate 04 · The alphabet"
      id="alphabet"
      title="Thirty-six hand-drawn eyes."
      lede={
        <>
          No fonts. Every eye is a stroked path on a 24 × 24 grid, flat-capped and weighted like a
          heavy grotesque. Anything outside this set falls back to a bold glyph.
        </>
      }
    >
      <ul className="alphabet">
        {GLYPHS.map((ch) => (
          <li key={ch} title={ch}>
            <Glyph char={ch} size={38} />
            <span className="alphabet-key">{ch}</span>
          </li>
        ))}
      </ul>
    </Plate>
  );
}

/** Plate 05 — specimen data. Numbers, not adjectives. */
export function SpecimenData({ name }: { name: string }) {
  const ladder = [16, 24, 32, 48, 64, 96];
  return (
    <Plate
      index="Plate 05 · Measurements"
      id="data"
      title="Small enough to not think about."
      lede={
        <>
          A static avatar is under 1.5 KB of SVG. The entire motion runtime is under 2 KB gzipped
          and ships in its own entry point, so static users never download it.
        </>
      }
    >
      <div className="measure-grid">
        <div className="ladder" aria-label="The same avatar at six sizes">
          {ladder.map((s) => (
            <div className="ladder-step" key={s}>
              <Avatar name={name} size={s} animate="blink" />
              <span className="ladder-key">{s}</span>
            </div>
          ))}
        </div>

        <dl className="stats">
          <div className="stat">
            <dt>Named builds</dt>
            <dd>
              {BUILDS.toLocaleString('en-US')}
              <span className="stat-note">9 palettes · 5 eggs · 5 mouths · blush · 4 tilts</span>
            </dd>
          </div>
          <div className="stat">
            <dt>Eye pairs</dt>
            <dd>
              {EYE_PAIRS.toLocaleString('en-US')}
              <span className="stat-note">36 × 36 before the fallback</span>
            </dd>
          </div>
          <div className="stat stat-wide">
            <dt>Possible faces</dt>
            <dd>
              {COMBINATIONS.toLocaleString('en-US')}
              <span className="stat-note">
                before continuous rotation and offset — both seeded, both unbounded
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </Plate>
  );
}
