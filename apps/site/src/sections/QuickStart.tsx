import { useMemo, useState } from 'react';
import { Avatar } from '@blobbies/react';
import { renderAvatarSvg } from 'blobbies';
import { Lead } from './Lead';

/**
 * The code sample is the demo. The name inside the string literal is a real
 * input, and the output pane shows the avatar plus the SVG it produced.
 */
export function QuickStart() {
  const [value, setValue] = useState('Sourav Nanda');
  const seed = value.trim() || 'Sourav Nanda';
  const svg = useMemo(() => renderAvatarSvg(seed), [seed]);

  return (
    <section className="section" id="start">
      <Lead title="How to use it." note="Pass in a name and get an SVG back." />
      <div className="panel qs">
        <div className="qs-pane">
          <span className="qs-file">app.tsx</span>
          <pre className="qs-code">
            <code>
              <span className="k">import</span> {'{ renderAvatarSvg } '}
              <span className="k">from</span> <span className="s">'blobbies'</span>
              {'\n\nconst svg = renderAvatarSvg('}
              <span className="s">'</span>
              <input
                className="qs-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                style={{ width: `${Math.max(value.length, 1)}ch` }}
                spellCheck={false}
                aria-label="Name to draw"
              />
              <span className="s">'</span>
              {')'}
            </code>
          </pre>
          <p className="qs-hint">Edit the name in yellow.</p>
        </div>
        <div className="qs-pane out">
          <span className="qs-file">Output</span>
          <div className="qs-out">
            <span className="swap" key={seed}>
              <Avatar name={seed} size={112} animate="all" />
            </span>
            <code className="qs-svg">{svg.slice(0, 96)}…</code>
          </div>
        </div>
      </div>
    </section>
  );
}
