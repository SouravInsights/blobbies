import { useMemo } from 'react';
import { Avatar } from '@blobbies/react';
import { avatarDataUri } from 'blobbies';
import { Plate } from '../ui';

/**
 * Plate 03 — behaviour. The three tiers, running side by side. Tier 1 is an
 * actual <img> pointing at a data URI, which is the point: the blink is pure
 * CSS baked into the SVG, so it survives outside the DOM.
 */
export function Behaviour({ name }: { name: string }) {
  const blinkUri = useMemo(
    () => avatarDataUri(name, { animate: 'blink', size: 128 }),
    [name],
  );

  return (
    <Plate
      index="Plate 03 · Behaviour"
      id="behaviour"
      title="It blinks on its own, then it watches you."
      lede={
        <>
          Three tiers, all opt-in. Nothing animates unless you ask, and everything respects{' '}
          <code>prefers-reduced-motion</code>.
        </>
      }
    >
      <div className="tiers">
        <article className="tier">
          <div className="tier-stage">
            <img src={blinkUri} width={128} height={128} alt={`${name}, blinking`} />
          </div>
          <div className="tier-meta">
            <span className="label">Tier 1 · Blink · CSS</span>
            <p>
              A seed-scoped <code>&lt;style&gt;</code> block scales each eye shut. Timing comes from
              the hash, so no two avatars blink together. Works in an{' '}
              <code>&lt;img&gt;</code> — this one is a data&nbsp;URI.
            </p>
            <code className="tier-code">animate: 'blink'</code>
          </div>
        </article>

        <article className="tier">
          <div className="tier-stage">
            <Avatar name={name} size={128} animate="follow" />
          </div>
          <div className="tier-meta">
            <span className="label">Tier 2 · Follow · JS</span>
            <p>
              The eyes and mouth track the pointer; the disk and the egg stay put. Inline SVG only —
              an image tag has no DOM to reach into.
            </p>
            <code className="tier-code">animate: 'follow'</code>
          </div>
        </article>

        <article className="tier">
          <div className="tier-stage">
            <Avatar name={name} size={128} animate="all" wink glance surprise />
          </div>
          <div className="tier-meta">
            <span className="label">Tier 3 · Extras · off by default</span>
            <p>
              Click it for a wink. Leave it alone and it will glance around. Get close and it looks
              mildly startled.
            </p>
            <code className="tier-code">wink · glance · surprise</code>
          </div>
        </article>
      </div>
    </Plate>
  );
}
