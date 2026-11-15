import { useState } from 'react';
import { Avatar, AvatarPicker } from '@blobbies/react';
import type { AvatarOptions } from '@blobbies/react';
import { Check } from 'iconoir-react';
import { Lead } from './Lead';

/**
 * The picker, on the page — the real component from `@blobbies/react`,
 * themed with the page's tokens. Its own footer carries the Spotlight toggle,
 * because whether to blur the crowd is the person's choice, not the host's.
 */
export function Picker({ name }: { name: string }) {
  const [saved, setSaved] = useState<AvatarOptions | null>(null);

  return (
    <section className="section" id="picker">
      <Lead title="Find your look." note="Every look is drawn from your name." />
      <div className="wk-demo">
        <AvatarPicker name={name} className="blobbies-picker" onSave={setSaved} />
        <div className="wk-saved" data-on={saved ? '1' : undefined} aria-live="polite">
          {saved && (
            <>
              <Avatar name={name} {...saved} size={34} animate="blink" />
              <span>
                <b>{name}</b> is saved
              </span>
              <Check width={15} height={15} aria-hidden="true" />
            </>
          )}
        </div>
      </div>
      <p className="dq-caption">Same name, same face, every time.</p>
    </section>
  );
}
