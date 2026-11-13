import { INSTALL, MOTION_SNIPPET, QUICK_START, REACT_SNIPPET } from '../data';
import { Copy, GitHubMark, Install, Plate } from '../ui';

const CORE_API: Array<[string, string]> = [
  ['getInitials(name)', 'The two eye characters: “RK”, “IR”, “?”.'],
  ['renderAvatarSvg(name, options?)', 'A complete standalone SVG string.'],
  ['renderAvatarBody(name, options?)', 'Inner markup + resolved metadata, for wrappers.'],
  ['avatarDataUri(name, options?)', 'A data URI for <img>, CSS or email.'],
  ['resolveAvatar(name, options?)', 'Every seeded decision, without rendering.'],
  ['LETTER_PATHS', 'The 36 hand-drawn glyphs, as raw path data.'],
];

const REACT_PROPS: Array<[string, string, string]> = [
  ['name', 'string', 'required'],
  ['size', 'number | string', '48'],
  ['animate', `boolean | 'blink' | 'follow' | 'all'`, 'false'],
  ['blinkInterval', '[min, max] ms', '[2500, 6000]'],
  ['followRange', 'number', '6'],
  ['smoothing', '0..1', '0.15'],
  ['idleTimeout', 'number', '2500'],
  ['wink · glance · surprise', 'boolean', 'false'],
  ['rounded', 'boolean', 'false'],
];

export function Api() {
  return (
    <Plate
      index="Plate 07 · Field notes"
      id="api"
      title="Two packages, one import, no dependencies."
      lede="blobbies is the engine. @blobbies/react is a thin wrapper. Import the motion runtime only if you want it."
    >
      <div className="api">
        <div className="api-install">
          <Install text={INSTALL} />
          <p className="api-note">
            <code>blobbies</code> has zero runtime dependencies. <code>@blobbies/react</code> depends
            only on <code>blobbies</code>; React is a peer.
          </p>
        </div>

        <div className="api-blocks">
          <CodeBlock label="Core · framework-agnostic" code={QUICK_START} />
          <CodeBlock label="React" code={REACT_SNIPPET} />
          <CodeBlock label="Motion only · blobbies/motion" code={MOTION_SNIPPET} />
        </div>

        <div className="api-tables">
          <div className="table-wrap">
            <span className="label">Core API</span>
            <table>
              <tbody>
                {CORE_API.map(([name, what]) => (
                  <tr key={name}>
                    <th scope="row">
                      <code>{name}</code>
                    </th>
                    <td>{what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-wrap">
            <span className="label">React props</span>
            <table>
              <thead>
                <tr>
                  <th>Prop</th>
                  <th>Type</th>
                  <th>Default</th>
                </tr>
              </thead>
              <tbody>
                {REACT_PROPS.map(([prop, type, def]) => (
                  <tr key={prop}>
                    <th scope="row">
                      <code>{prop}</code>
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
    </Plate>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <figure className="code">
      <figcaption>
        <span className="label">{label}</span>
        <Copy text={code} />
      </figcaption>
      <pre>
        <code>{code}</code>
      </pre>
    </figure>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-mark">
        <span className="footer-dot" aria-hidden="true" />
        <span>Blobbies</span>
      </div>
      <nav className="footer-nav">
        <a href="https://github.com/SouravInsights/blobbies" target="_blank" rel="noreferrer">
          <GitHubMark /> GitHub
        </a>
        <a href="https://www.npmjs.com/package/blobbies" target="_blank" rel="noreferrer">
          npm
        </a>
        <a href="#top">Back to top</a>
      </nav>
      <p className="footer-note">
        MIT · built by{' '}
        <a href="https://github.com/SouravInsights" target="_blank" rel="noreferrer">
          @souravinsights
        </a>
      </p>
    </footer>
  );
}
