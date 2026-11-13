import { useMemo, useState } from 'react';
import { Avatar } from '@blobbies/react';
import { useCountUp, useInView, Glyph } from '../ui';
import { BUILDS, EYE_PAIRS, TOTAL, buildNames } from '../data';
import { Lead } from './Lead';

const BUILD_SAMPLES = buildNames(5);
const EYE_SAMPLES = ['S', 'N', 'A', 'K', 'R'];

function Num({ value, run }: { value: number; run: boolean }) {
  return <>{useCountUp(value, run).toLocaleString('en-US')}</>;
}

/** The one big number on the page, worked out in the open. */
export function Count() {
  const [ref, seen] = useInView<HTMLDivElement>(0.35);

  const terms = useMemo(
    () => [
      {
        value: BUILDS,
        label: 'named builds',
        stack: (
          <div className="stack">
            {BUILD_SAMPLES.map((n, i) => (
              <Avatar key={n} name={n} size={36} animate={i === 0 ? 'follow' : false} />
            ))}
          </div>
        ),
      },
      {
        value: EYE_PAIRS,
        label: 'eye pairs',
        stack: (
          <div className="stack">
            {EYE_SAMPLES.map((g) => (
              <span
                key={g}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#ece6da',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Glyph char={g} size={26} />
              </span>
            ))}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <section className="section" id="count">
      <Lead title="How many are there?" note="Enough that nobody will share one." />
      <div className="count" ref={ref}>
        <div className="sum">
          {terms.map((term, i) => (
            <div className="term-wrap" key={term.label}>
              {i > 0 && <span className="op">×</span>}
              <div className="term">
                {term.stack}
                <b>
                  <Num value={term.value} run={seen} />
                </b>
                <span>{term.label}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="total">
          <span className="op">=</span>
          <b>
            <Num value={TOTAL} run={seen} />
          </b>
          <span>different faces, before the rotation and the offset — both seeded, both unbounded</span>
        </div>
      </div>
    </section>
  );
}
