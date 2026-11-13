import { Avatar } from '@blobbies/react';
import { buildNames } from '../data';
import { useReveal } from '../ui';

const NAMES = buildNames(140);

/**
 * Plate 01 — the colony. The signature: a full-bleed field of blobs that all
 * turn to look at the cursor. One shared pointer listener and one rAF loop
 * drive every one of them (see `blobbies/motion`), so 140 faces cost about as
 * much as one.
 */
export function Colony() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="colony" id="colony">
      <header className="colony-head">
        <span className="label">Plate 01 · The colony</span>
        <p className="colony-line">
          Move your cursor. <em>All 140 of them look back.</em>
        </p>
      </header>
      <div className="colony-field" ref={ref} data-reveal>
        {NAMES.map((n, i) => (
          <Avatar key={`${n}-${i}`} name={n} size={44} animate="follow" />
        ))}
      </div>
      <p className="colony-foot">
        One <code>pointermove</code> listener · one <code>requestAnimationFrame</code> loop · zero
        React re-renders
      </p>
    </section>
  );
}
