import { Avatar } from '@blobbies/react';
import { GLYPHS } from '../data';
import { Glyph } from '../ui';
import { Lead } from './Lead';

const SIZES = [96, 64, 40, 28, 20];

/**
 * The glyph plate. Tapping a letter sets it as the name, so the showcase is
 * also a way to inspect any single eye.
 */
export function Draws({ name, onPick }: { name: string; onPick: (name: string) => void }) {
  return (
    <section className="section" id="draws">
      <Lead title="What it draws." note="Every name gets its own eyes. Click any to draw it." />
      <div className="dq-grid">
        {GLYPHS.map((ch) => (
          <button key={ch} type="button" onClick={() => onPick(ch)} title={`Draw “${ch}”`}>
            <span className="dq-chip">
              <Glyph char={ch} />
            </span>
          </button>
        ))}
      </div>
      <p className="dq-caption">A–Z and 0–9. Click any to draw it.</p>

      <div className="sizes" style={{ marginTop: 8 }}>
        {SIZES.map((s) => (
          <Avatar key={s} name={name} size={s} animate={s === 96 ? 'all' : 'blink'} />
        ))}
      </div>
      <p className="dq-caption">One avatar, five sizes. It stays crisp — it is vectors all the way down.</p>
    </section>
  );
}
