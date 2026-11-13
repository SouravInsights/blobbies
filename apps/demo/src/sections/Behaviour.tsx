import { useMemo, useState } from 'react';
import { Avatar } from '@blobbies/react';
import { avatarDataUri } from 'blobbies';
import { Lead } from './Lead';

/**
 * One tier at a time. Tier 1 is rendered as an actual <img> pointing at a data
 * URI, because that is the claim: the blink is CSS inside the SVG, so it works
 * with no DOM at all.
 */
export function Behaviour({ name }: { name: string }) {
  const [active, setActive] = useState(0);
  const blinkUri = useMemo(() => avatarDataUri(name, { animate: 'blink', size: 128 }), [name]);

  const tiers = [
    {
      label: 'Blink · CSS',
      title: 'It blinks on its own.',
      note: 'A seed-scoped style block scales each eye shut. The interval comes from the hash, so no two avatars blink together — and roughly one blink in four is a double. This one is an <img>, not inline SVG.',
      code: "avatarDataUri(name, { animate: 'blink' })",
      stage: <img src={blinkUri} width={128} height={128} alt={`${name}, blinking`} />,
    },
    {
      label: 'Follow · JS',
      title: 'Then it watches you.',
      note: 'The eyes and mouth track the pointer. The disk and the egg stay exactly where they are, so the face moves and the body does not. Inline SVG only — an image tag has no DOM to reach into.',
      code: "renderAvatarSvg(name, { animate: 'follow' })",
      stage: <Avatar name={name} size={128} animate="follow" />,
    },
    {
      label: 'Extras',
      title: 'And it has a few tells.',
      note: 'Click for a wink. Leave it alone and it will glance around. Bring the pointer close and it looks faintly startled. All three are off unless you ask for them.',
      code: 'wink · glance · surprise',
      stage: <Avatar name={name} size={128} animate="all" wink glance surprise />,
    },
  ];

  const tier = tiers[active] as (typeof tiers)[number];

  return (
    <section className="section" id="behaviour">
      <Lead title="Opt in to each one." note="Nothing moves until you ask it to, and everything stops for reduced motion." />
      <div className="panel tabs">
        <div className="tab-list" role="tablist" aria-label="Animation tiers">
          {tiers.map((t, i) => (
            <button
              key={t.label}
              role="tab"
              type="button"
              aria-selected={i === active}
              onClick={() => setActive(i)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="tab-body">
          <div className="tab-stage">{tier.stage}</div>
          <div className="tab-text">
            <h3>{tier.title}</h3>
            <p>{tier.note}</p>
          </div>
          <pre className="code">
            <code>{tier.code}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
