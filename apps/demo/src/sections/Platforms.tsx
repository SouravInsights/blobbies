import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Avatar } from '@blobbies/react';
import { PLATFORMS, type Platform } from '../data';
import { captureEvent } from '../analytics';
import { Code, CopyButton } from '../ui';
import { Icon } from '../icons';
import { Lead } from './Lead';

/**
 * Use it anywhere.
 *
 * The picker's object in a horizontal shape: `.pl`'s panel, `.pl-nav`'s rounded
 * tiles at --raised with the --control shadow, `.pl-body`'s padding and rhythm,
 * `.pl-code`'s window. Only the axis of the nav changes — eight short labels
 * read as one set in a row, and as a list of eight in a column.
 *
 * There is no stage. The picker has one because it has a product surface to
 * show; a platform does not, and a bordered box holding one centred avatar is
 * the decorative move that makes a section look assembled rather than designed.
 * The code is this section's visual, and the evidence for the claim is a single
 * quiet line at the foot of the column.
 *
 * The tab semantics are Radix's, so roving tabindex, arrow keys, Home and End,
 * and the aria wiring are the ones people already know.
 */
export function Platforms({ name }: { name: string }): JSX.Element {
  const [active, setActive] = useState<string>(PLATFORMS[0]?.id ?? 'http');
  const platform = PLATFORMS.find((p) => p.id === active) ?? (PLATFORMS[0] as Platform);

  // `href` is the endpoint itself, so only the query is added here.
  const preview = platform.href ? `${platform.href}?name=${encodeURIComponent(name)}` : null;

  const select = (id: string): void => {
    setActive(id);
    captureEvent('platform_selected', { platform: id });
  };

  const proof = (
    <>
      <span className="plats-face">
        {preview ? (
          <img src={preview} width={34} height={34} alt={`${name}, from the HTTP API`} />
        ) : (
          <Avatar name={name} size={34} animate="all" />
        )}
      </span>
      <span>{platform.href ? 'live from the API' : 'the same face, every way in'}</span>
    </>
  );

  return (
    <section className="section" id="platforms">
      <Lead title="Use it anywhere." note="One engine, every way in." />

      <Tabs.Root
        className="pl plats"
        value={active}
        onValueChange={select}
        orientation="horizontal"
      >
        <Tabs.List className="pl-nav plats-nav" aria-label="Ways to use Blobbies">
          {PLATFORMS.map((p) => (
            <Tabs.Trigger key={p.id} value={p.id}>
              <Icon name={p.icon} size={20} />
              <span>{p.label}</span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content className="pl-body plats-body" value={active}>
          <div className="plats-col">
            <h3 className="plats-claim">{platform.headline}</h3>

            <dl className="plats-facts">
              {platform.meta.map(([term, value]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
              {platform.soon ? (
                <div>
                  <dt>status</dt>
                  <dd>shipping soon</dd>
                </div>
              ) : null}
            </dl>

            {/* A package that is not on npm yet does not get an install command
                to copy: an install line that 404s is worse than none. */}
            {platform.soon ? null : platform.install ? (
              <CopyButton
                className="btn code plats-install"
                text={platform.install}
                label={platform.install}
                source={`platform_${platform.id}_install`}
              />
            ) : (
              <p className="plats-none">Nothing to install.</p>
            )}

            {preview ? (
              <a
                className="plats-proof"
                href={preview}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  captureEvent('outbound_clicked', { destination: 'api', source: 'platforms' })
                }
              >
                {proof}
              </a>
            ) : (
              <p className="plats-proof">{proof}</p>
            )}
          </div>

          <figure className="pl-code">
            <figcaption>
              <span className="qs-file">{platform.file}</span>
              <CopyButton
                className="btn small"
                text={platform.code}
                label="Copy"
                source={`platform_${platform.id}_code`}
              />
            </figcaption>
            <Code code={platform.code} />
          </figure>
        </Tabs.Content>
      </Tabs.Root>
    </section>
  );
}
