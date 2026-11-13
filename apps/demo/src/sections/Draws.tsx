import { Avatar } from '@blobbies/react';
import { GLYPHS } from '../data';
import { Glyph } from '../ui';
import { Lead } from './Lead';

const SIZES = [96, 64, 40, 28, 20];

/**
 * The glyph plate. Tapping a letter sets it as the name, so the showcase is
 * also a way to inspect any single eye.
 */
export function Draws({ onPick }: { onPick: (name: string) => void }) {
  return (
    <section className="section" id="draws">
      <Lead title="What it draws." note="Every eye is a hand-drawn path. No fonts." />
      <div className="dq-grid">
        {GLYPHS.map((ch) => (
          <button key={ch} type="button" onClick={() => onPick(ch)} title={`Draw “${ch}”`}>
            <span
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#ece6da',
              }}
            >
              <Glyph char={ch} size={34} />
            </span>
          </button>
        ))}
      </div>
      <p className="dq-caption">A–Z and 0–9. Anything else falls back to a bold glyph.</p>

      <div className="sizes" style={{ marginTop: 8 }}>
        {SIZES.map((s) => (
          <Avatar key={s} name="Sourav Nanda" size={s} animate={s === 96 ? 'all' : 'blink'} />
        ))}
      </div>
      <p className="dq-caption">One avatar, five sizes. It stays crisp — it is vectors all the way down.</p>
    </section>
  );
}
