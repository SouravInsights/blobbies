import { Avatar } from '@blobbies/react';
import { Copy, GitHubMark } from '../ui';

/**
 * Plate 00 — the type specimen. One giant blob, annotated like a field-guide
 * diagram: disk, egg, eyes, blush. The four labels are absolutely positioned
 * around the stage on wide screens and become a legend list on narrow ones.
 */
export function Hero({ name }: { name: string }) {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <span className="label">Plate 00 · Type specimen</span>
        <h1 className="display">
          Every name
          <br />
          gets a face.
        </h1>
        <p className="lede">
          Blobbies turns any name into a deterministic SVG creature. Two letters become the eyes, a
          seeded egg becomes the body. The same name always draws the same blob — on the server, in
          the browser, five years from now.
        </p>
        <div className="hero-cta">
          <Copy text="npm i blobbies" label="npm i blobbies" className="copy-primary" />
          <a className="btn" href="https://github.com/SouravInsights/blobbies" target="_blank" rel="noreferrer">
            <GitHubMark /> Source
          </a>
        </div>
        <dl className="spec-list">
          <div>
            <dt>Runtime deps</dt>
            <dd>0</dd>
          </div>
          <div>
            <dt>Per avatar</dt>
            <dd>1.4 KB</dd>
          </div>
          <div>
            <dt>Motion</dt>
            <dd>2.0 KB gz</dd>
          </div>
          <div>
            <dt>Licence</dt>
            <dd>MIT</dd>
          </div>
        </dl>
      </div>

      <figure className="specimen">
        <div className="specimen-stage">
          <span className="specimen-cross" aria-hidden="true" />
          <Avatar
            name={name}
            animate="all"
            wink
            size={264}
            style={{ width: 'min(264px, 62vw)', height: 'auto' }}
          />
          <span className="anno anno-tl">The disk</span>
          <span className="anno anno-tr">The egg</span>
          <span className="anno anno-bl">The eyes</span>
          <span className="anno anno-br">The blush</span>
        </div>
        <figcaption className="specimen-caption">
          <span>{name}</span>
          <span>100 × 100 viewBox</span>
          <span>1,358 bytes</span>
        </figcaption>
      </figure>
    </section>
  );
}
