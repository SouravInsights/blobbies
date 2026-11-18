import { useMemo, useState } from 'react';
import { Shuffle } from 'iconoir-react';
import {
  COLORS,
  EXPRESSIONS,
  EXPRESSION_NAMES,
  SHAPES,
} from 'blobbies';
import type { AvatarExpression, AvatarShape } from 'blobbies';
import { API_BASE, API_REPO, API_SELF_HOST } from '../data';
import { Check, Range, Select } from '../controls';
import { captureEvent } from '../analytics';
import { Code, CopyButton, GitHubIcon } from '../ui';
import { Icon } from '../icons';
import { Lead } from './Lead';

/**
 * The API, as a playground.
 *
 * Every option this page offers as a React prop is also a query parameter, and
 * the whole point of the HTTP edge is that none of them need a build step: the
 * URL *is* the API. So the section is not a table of parameters — it is the
 * thing itself. Turn a dial, watch the face in the `<img>` change, and copy the
 * URL that produced it.
 *
 * The value of a URL like this is that it is deterministic: the same name, the
 * same options, the same bytes, forever — which is what makes it safe in an
 * email, a PDF, a cache, or an `<img>` on someone else's page.
 */
type Format = 'svg' | 'png' | 'json';
type Tri = 'auto' | 'true' | 'false';

interface Lab {
  expression: 'auto' | AvatarExpression;
  shape: 'auto' | AvatarShape;
  color: string;
  blush: Tri;
  tilt: number;
  variant: number;
  size: number;
  rounded: boolean;
  animate: 'false' | 'blink';
}

const DEFAULTS: Lab = {
  expression: 'auto',
  shape: 'auto',
  color: '',
  blush: 'auto',
  tilt: 0,
  variant: 0,
  size: 128,
  rounded: false,
  animate: 'false',
};

const FORMATS: ReadonlyArray<{ value: Format; label: string }> = [
  { value: 'svg', label: 'svg' },
  { value: 'png', label: 'png' },
  { value: 'json', label: 'json' },
];

/** `auto` is the seeded value: the API draws it when the parameter is absent. */
const EXPRESSION_OPTIONS = [
  { value: 'auto', label: 'Seeded from name' },
  ...EXPRESSIONS.map((value, i) => ({
    value,
    label: EXPRESSION_NAMES[i] ?? value,
  })),
];

const SHAPE_OPTIONS = [
  { value: 'auto', label: 'Seeded from name' },
  ...SHAPES.map((value) => ({ value, label: value })),
];

const BLUSH_OPTIONS = [
  { value: 'auto', label: 'Seeded from name' },
  { value: 'true', label: 'On' },
  { value: 'false', label: 'Off' },
];

const ANIMATE_OPTIONS = [
  { value: 'false', label: 'Still' },
  { value: 'blink', label: 'Blink' },
];

/** Named colours, in the palette's own order, for the swatch row. */
const SWATCHES = Object.entries(COLORS);

/** The URL a reader would paste. Every omitted option is seeded by the name. */
function buildUrl(name: string, format: Format, lab: Lab): string {
  const params = new URLSearchParams();
  params.set('name', name.trim() || 'Sourav Nanda');
  if (lab.expression !== 'auto') params.set('expression', lab.expression);
  if (lab.shape !== 'auto') params.set('shape', lab.shape);
  if (lab.color) params.set('color', lab.color);
  if (lab.blush !== 'auto') params.set('blush', lab.blush);
  if (lab.tilt !== 0) params.set('tilt', String(lab.tilt));
  if (lab.variant !== 0) params.set('variant', String(lab.variant));
  params.set('size', String(lab.size));
  if (lab.rounded) params.set('rounded', 'true');
  if (lab.animate !== 'false') params.set('animate', lab.animate);
  return `${API_BASE}/v1/avatar/${format}?${params.toString()}`;
}

/** The smallest piece of code that uses the URL, per format. */
function snippetFor(
  format: Format,
  url: string,
  name: string,
): { file: string; code: string } {
  const label = name.trim() || 'Sourav Nanda';
  if (format === 'json') {
    return {
      file: 'avatar.ts',
      code: `const res = await fetch(\n  '${url}'\n)\n\nconst { svg, letters, traits } = await res.json()`,
    };
  }
  return {
    file: 'index.html',
    code: `<img\n  src="${url}"\n  alt="${label}"\n  width="64"\n  height="64"\n/>`,
  };
}

export function HttpApi({
  name,
  onAdopt,
}: {
  name: string;
  onAdopt: (n: string) => void;
}): JSX.Element {
  const [format, setFormat] = useState<Format>('svg');
  const [lab, setLab] = useState<Lab>(DEFAULTS);

  const set = <K extends keyof Lab>(key: K, value: Lab[K]): void =>
    setLab((s) => ({ ...s, [key]: value }));

  const url = useMemo(() => buildUrl(name, format, lab), [name, format, lab]);
  // JSON is not an image, so the preview falls back to the SVG it wraps.
  const preview = useMemo(
    () => (format === 'json' ? buildUrl(name, 'svg', lab) : url),
    [name, format, lab, url],
  );
  const sample = useMemo(() => snippetFor(format, url, name), [format, url, name]);

  const pickFormat = (next: Format): void => {
    if (next === format) return;
    setFormat(next);
    captureEvent('api_format_changed', { format: next });
  };

  return (
    <section className="section" id="api">
      <Lead
        title="Avatars from a URL."
        note="No install, no key — and yours to self-host."
      />

      <div className="lab">
        {/* First in source, so on a phone it can pin to the top while the
            controls scroll under it — the playground's own rule: turning a
            dial and seeing the face are never two scrolls. On a wide screen
            the grid places it on the right regardless of source order. */}
        <div className="lab-stage">
          <img
            key={preview}
            src={preview}
            alt={`${name.trim() || 'Sourav Nanda'}, served by the API`}
            width={160}
            height={160}
          />
        </div>

        <div className="lab-controls">
          <div className="lab-group">
            <label className="field">
              <span>Name</span>
              <input
                className="lab-input"
                value={name}
                onChange={(event) => onAdopt(event.target.value)}
                spellCheck={false}
              />
            </label>

            <div className="field">
              <span>Format</span>
              <div className="lab-seg" role="group" aria-label="Response format">
                {FORMATS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    aria-pressed={format === f.value}
                    onClick={() => pickFormat(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lab-group">
            <span className="group-label">Face</span>
            <Select
              label="Expression"
              value={lab.expression}
              options={EXPRESSION_OPTIONS}
              onChange={(v) => set('expression', v as Lab['expression'])}
            />
            <Select
              label="Shape"
              value={lab.shape}
              options={SHAPE_OPTIONS}
              onChange={(v) => set('shape', v as Lab['shape'])}
            />
            <div className="field">
              <span>Colour</span>
              <div className="swatches">
                <button
                  type="button"
                  className="swatch"
                  data-auto="1"
                  aria-pressed={lab.color === ''}
                  aria-label="Seeded from name"
                  onClick={() => set('color', '')}
                />
                {SWATCHES.map(([key, hex]) => (
                  <button
                    key={key}
                    type="button"
                    className="swatch"
                    style={{ background: hex }}
                    title={key}
                    aria-pressed={lab.color === hex}
                    aria-label={key}
                    onClick={() => set('color', hex)}
                  />
                ))}
              </div>
            </div>
            <Select
              label="Blush"
              value={lab.blush}
              options={BLUSH_OPTIONS}
              onChange={(v) => set('blush', v as Tri)}
            />
          </div>

          <div className="lab-group">
            <div className="lab-group-head">
              <span className="group-label">Body</span>
              <button
                type="button"
                className="lab-shuffle"
                title="Try another body"
                aria-label="Try another body"
                onClick={() => {
                  const next = (lab.variant + 1) % 13;
                  set('variant', next);
                  captureEvent('api_variant_shuffled', { variant: next });
                }}
              >
                <Shuffle width={13} height={13} aria-hidden="true" />
              </button>
            </div>
            <div className="lab-pair">
              <Range
                label="Tilt"
                suffix="°"
                min={-8}
                max={8}
                step={0.5}
                value={lab.tilt}
                onChange={(v) => set('tilt', v)}
              />
              <Range
                label="Variant"
                min={0}
                max={12}
                step={1}
                value={lab.variant}
                onChange={(v) => set('variant', v)}
              />
            </div>
            <Range
              label="Size"
              suffix="px"
              min={32}
              max={256}
              step={8}
              value={lab.size}
              onChange={(v) => set('size', v)}
            />
            <div className="checks">
              <Check
                label="Rounded"
                checked={lab.rounded}
                onChange={(v) => set('rounded', v)}
              />
            </div>
          </div>

          <div className="lab-group">
            <span className="group-label">Motion</span>
            <Select
              label="Animate"
              value={lab.animate}
              options={ANIMATE_OPTIONS}
              onChange={(v) => set('animate', v as Lab['animate'])}
            />
          </div>
        </div>

        <figure className="lab-url">
          <figcaption>
            <span className="qs-file">GET</span>
            <CopyButton
              className="btn small"
              text={url}
              label="Copy URL"
              source="api_url"
            />
          </figcaption>
          <code>{url}</code>
        </figure>

        <figure className="lab-code">
          <figcaption>
            <span className="qs-file">{sample.file}</span>
            <CopyButton
              className="btn small"
              text={sample.code}
              label="Copy"
              source={`api_snippet_${format}`}
            />
          </figcaption>
          <Code code={sample.code} />
        </figure>

        <div className="lab-host">
          <span className="lab-host-mark">
            <Icon name="docker" size={20} />
          </span>
          <div className="lab-host-copy">
            <span className="lab-host-title">Self-host it</span>
            <p>One stateless container, no database.</p>
          </div>
          <CopyButton
            className="btn code lab-host-install"
            text={API_SELF_HOST}
            label={API_SELF_HOST}
            source="api_selfhost"
          />
          <a
            className="lab-host-link"
            href={API_REPO}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              captureEvent('outbound_clicked', {
                destination: 'api_repo',
                source: 'api',
              })
            }
          >
            <GitHubIcon size={15} />
            blobbies-api
          </a>
        </div>
      </div>
    </section>
  );
}
