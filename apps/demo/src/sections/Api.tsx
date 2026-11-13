import { CORE_SNIPPET, DATA_URI_SNIPPET, INSTALL, MOTION_SNIPPET, NPM, REACT_SNIPPET } from '../data';
import { CopyButton, GitHubIcon, REPO } from '../ui';
import { Lead } from './Lead';

const CORE_API: Array<[string, string]> = [
  ['getInitials(name)', 'The two eye characters: “SN”, “IR”, “?”.'],
  ['renderAvatarSvg(name, options?)', 'A complete standalone SVG string.'],
  ['avatarDataUri(name, options?)', 'A data URI, for an <img> or CSS.'],
  ['resolveAvatar(name, options?)', 'Every seeded decision, without rendering.'],
  ['LETTER_PATHS', 'The 36 hand-drawn glyphs, as path data.'],
  ['attachAvatarMotion(el)', 'Cursor following, from blobbies/motion.'],
];

const REACT_PROPS: Array<[string, string, string]> = [
  ['name', 'string', 'required'],
  ['size', 'number | string', '48'],
  ['animate', `boolean | 'blink' | 'follow' | 'all'`, 'false'],
  ['blinkInterval', '[min, max] ms', '[2500, 6000]'],
  ['followRange', 'number', '6'],
  ['smoothing', '0..1', '0.15'],
  ['wink · glance · surprise', 'boolean', 'false'],
  ['rounded', 'boolean', 'false'],
];

export function Api() {
  return (
    <section className="section" id="api">
      <Lead title="Two packages, one import." note="No runtime dependencies. Import the motion only if you want it." />
      <div className="api">
        <div className="api-row">
          <CopyButton className="btn code" text={INSTALL} label={INSTALL} />
          <span className="api-note">@blobbies/react depends on blobbies. React itself is a peer.</span>
        </div>

        <div className="api-blocks">
          <CodeBlock label="core.ts" code={CORE_SNIPPET} />
          <CodeBlock label="react.tsx" code={REACT_SNIPPET} />
          <CodeBlock label="image.ts" code={DATA_URI_SNIPPET} />
          <CodeBlock label="motion.ts" code={MOTION_SNIPPET} />
        </div>

        <div className="tables">
          <div className="table-block">
            <span className="qs-file">Core API</span>
            <table>
              <tbody>
                {CORE_API.map(([n, what]) => (
                  <tr key={n}>
                    <th scope="row">
                      <code>{n}</code>
                    </th>
                    <td>{what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-block">
            <span className="qs-file">React props</span>
            <table>
              <thead>
                <tr>
                  <th>Prop</th>
                  <th>Type</th>
                  <th>Default</th>
                </tr>
              </thead>
              <tbody>
                {REACT_PROPS.map(([p, type, def]) => (
                  <tr key={p}>
                    <th scope="row">
                      <code>{p}</code>
                    </th>
                    <td>
                      <code>{type}</code>
                    </td>
                    <td>{def}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <figure className="table-block">
      <div className="code-head">
        <span className="qs-file">{label}</span>
        <CopyButton className="btn small" text={code} label="Copy" />
      </div>
      <pre className="code">
        <code>{code}</code>
      </pre>
    </figure>
  );
}

export function Footer() {
  return (
    <footer>
      <nav>
        <a href={REPO} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href={NPM} target="_blank" rel="noreferrer">
          npm
        </a>
        <a href="#top">Back to top</a>
      </nav>
      <span>
        MIT · made by{' '}
        <a href="https://github.com/SouravInsights" target="_blank" rel="noreferrer">
          @souravinsights
        </a>
      </span>
    </footer>
  );
}
