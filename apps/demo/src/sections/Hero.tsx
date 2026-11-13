import { Avatar } from '@blobbies/react';
import { buildNames } from '../data';
import { CopyButton, GitHubIcon, REPO } from '../ui';

const FIELD = buildNames(72);

/**
 * The hero card. The right half is a field of 56 blobs that all turn to watch
 * the cursor — the library's whole trick, running on the same one-listener /
 * one-rAF runtime as the rest of the page.
 */
export function Hero() {
  return (
    <header className="hero">
      <div className="hero-field" aria-hidden="true">
        <div className="hero-field-inner" style={{ ['--cols' as string]: 9 }}>
          {FIELD.map((n, i) => (
            <span className="hf-cell" key={`${n}-${i}`}>
              <Avatar name={n} size={64} animate="follow" />
            </span>
          ))}
        </div>
      </div>

      <div className="intro">
        <p className="version">v0.1.0</p>
        <h1>blobbies</h1>
        <p className="lede">Any name becomes a face. The same name always draws the same one.</p>
        <div className="cta">
          <CopyButton className="btn primary code" text="npm i blobbies" label="npm i blobbies" />
          <a className="btn" href={REPO} target="_blank" rel="noreferrer">
            <GitHubIcon /> Source
          </a>
        </div>
        <p className="meta">No dependencies · TypeScript · MIT</p>
      </div>
    </header>
  );
}
