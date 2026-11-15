import { useEffect, useState } from 'react';
import {
  Avatar,
  AvatarPicker,
  AvatarPickerBlush,
  AvatarPickerMood,
  AvatarPickerRoot,
  AvatarPickerSave,
  AvatarPickerSurface,
  useAvatarPicker,
} from '@blobbies/react';
import type { AvatarOptions } from '@blobbies/react';
import { Bell, Camera, CheckCircle, CreditCard, User } from 'iconoir-react';
import { Code, Mark } from '../ui';
import { Lead } from './Lead';

/**
 * The picker, in the places products actually put one.
 *
 * The component is the same everywhere — what changes is the shell around it.
 * A settings page opens it over a dialog and writes the result back to the
 * profile row; a sign-up embeds it as a step; and a custom layout keeps the
 * parts and throws the panel away. Each scenario is the real shipped
 * component, not a mock of it, which is the point: you are looking at what
 * you get.
 */
export function Picker({ name }: { name: string }) {
  const [scenario, setScenario] = useState<Scenario>('settings');

  /** Left and right move between scenarios; Home and End go to the ends. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const at = SCENARIOS.findIndex((s) => s.id === scenario);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? SCENARIOS.length - 1
          : (at + (event.key === 'ArrowRight' ? 1 : -1) + SCENARIOS.length) %
            SCENARIOS.length;
    const id = SCENARIOS[next]?.id ?? 'settings';
    setScenario(id);
    document.getElementById(`show-tab-${id}`)?.focus();
  };

  return (
    <section className="section" id="picker">
      <Lead
        title="See it in your UI."
        note="The real component, in the places real apps need one."
      />

      <div className="show">
        <div
          className="show-tabs"
          role="tablist"
          aria-label="Picker scenarios"
          onKeyDown={onKeyDown}
        >
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              id={`show-tab-${s.id}`}
              type="button"
              role="tab"
              aria-selected={scenario === s.id}
              aria-controls="show-stage"
              tabIndex={scenario === s.id ? 0 : -1}
              onClick={() => setScenario(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div
          className="show-stage"
          id="show-stage"
          role="tabpanel"
          aria-labelledby={`show-tab-${scenario}`}
        >
          {scenario === 'settings' && <Settings name={name} />}
          {scenario === 'signup' && <Signup name={name} />}
          {scenario === 'own' && <OwnLayout name={name} />}
        </div>

        <figure className="show-code">
          <figcaption>
            <span className="qs-file">{CODE[scenario].file}</span>
          </figcaption>
          <Code code={CODE[scenario].code} />
        </figure>
      </div>
    </section>
  );
}

type Scenario = 'settings' | 'signup' | 'own';

const SCENARIOS: ReadonlyArray<{ id: Scenario; label: string }> = [
  { id: 'settings', label: 'Profile settings' },
  { id: 'signup', label: 'Sign-up' },
  { id: 'own', label: 'Your own layout' },
];

const CODE: Record<Scenario, { file: string; code: string }> = {
  settings: {
    file: 'ProfileSettings.tsx',
    code: `const [saved, setSaved] = useState<AvatarOptions>()
const [open, setOpen] = useState(false)

<button onClick={() => setOpen(true)}>
  <Avatar name={user.name} {...saved} size={40} />
</button>

{open && (
  <Dialog onClose={() => setOpen(false)}>
    <AvatarPicker
      name={user.name}
      defaultValue={saved}
      onSave={(look) => {
        setSaved(look)
        setOpen(false)
      }}
      onCancel={() => setOpen(false)}
    />
  </Dialog>
)}`,
  },
  signup: {
    file: 'Onboarding.tsx',
    code: `// The picker is just a step. Strip its header
// and give Save the app's own words.
<AvatarPicker
  name={user.name}
  title=""
  description=""
  saveLabel="Start writing"
  onSave={(look) => updateUser({ look })}
/>`,
  },
  own: {
    file: 'OwnLayout.tsx',
    code: `// Keep the state, throw away the panel.
<AvatarPickerRoot name={user.name} onSave={save} unstyled>
  <YourPreview />
  <AvatarPickerSurface />
  <AvatarPickerMood />
  <AvatarPickerBlush />
  <AvatarPickerSave>Use this look</AvatarPickerSave>
</AvatarPickerRoot>

// inside <YourPreview />:
const { value, expressionName } = useAvatarPicker()`,
  },
};

/* ---------------------------------------------------------- settings demo */

function Settings({ name }: { name: string }) {
  const [saved, setSaved] = useState<AvatarOptions | null>(null);
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!flash) return undefined;
    const timer = window.setTimeout(() => setFlash(false), 2200);
    return () => window.clearTimeout(timer);
  }, [flash]);

  return (
    <div className="show-frame">
      <div className="app">
        <aside className="app-side">
          <span className="app-brand">
            <Mark size={18} />
            <b>NoteMap</b>
          </span>
          <nav>
            <span className="app-link" data-on="1">
              <User /> Profile
            </span>
            <span className="app-link">
              <Bell /> Notifications
            </span>
            <span className="app-link">
              <CreditCard /> Billing
            </span>
          </nav>
        </aside>

        <div className="app-main">
          <p className="app-eyebrow">Settings</p>
          <h3 className="app-title">Profile</h3>

          <div className="app-row">
            <div className="app-copy">
              <b>Profile photo</b>
              <span>Upload a photo or pick an avatar.</span>
            </div>
            <button
              type="button"
              className="app-photo"
              onClick={() => setOpen(true)}
              aria-label="Change profile photo"
            >
              <Avatar name={name} {...saved} size={40} animate="blink" />
              <span className="app-photo-tag">
                <Camera width={13} height={13} aria-hidden="true" />
                Change
              </span>
            </button>
          </div>

          <label className="app-row">
            <div className="app-copy">
              <b>Full name</b>
            </div>
            <input className="app-input" defaultValue="Maya Chen" spellCheck={false} readOnly />
          </label>

          <label className="app-row">
            <div className="app-copy">
              <b>Email</b>
            </div>
            <input
              className="app-input"
              defaultValue="maya@notemap.com"
              spellCheck={false}
              readOnly
            />
          </label>
        </div>
      </div>

      {open && (
        <div className="app-scrim" onClick={() => setOpen(false)}>
          <div
            className="app-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Choose an avatar"
            onClick={(event) => event.stopPropagation()}
          >
            <AvatarPicker
              name={name}
              className="blobbies-picker"
              defaultValue={saved ?? undefined}
              onSave={(look) => {
                setSaved(look);
                setOpen(false);
                setFlash(true);
              }}
              onCancel={() => setOpen(false)}
            />
          </div>
        </div>
      )}

      <p className="app-toast" data-on={flash ? '1' : undefined} aria-live="polite">
        <CheckCircle width={15} height={15} aria-hidden="true" />
        Profile photo updated
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ signup demo */

function Signup({ name }: { name: string }) {
  const [saved, setSaved] = useState<AvatarOptions | null>(null);
  return (
    <div className="show-frame">
      <div className="signup">
        <div className="signup-head">
          <span className="app-brand">
            <Mark size={18} />
            <b>NoteMap</b>
          </span>
          <p className="signup-step">Step 2 of 2</p>
          <h3 className="app-title">Pick your look</h3>
          <p className="app-sub">This is how you will show up across the workspace.</p>
        </div>

        <AvatarPicker
          name={name}
          className="blobbies-picker"
          title=""
          description=""
          saveLabel="Start writing"
          onSave={(look) => setSaved(look)}
        />

        <p className="signup-done" data-on={saved ? '1' : undefined} aria-live="polite">
          {saved && <Avatar name={name} {...saved} size={24} />}
          <CheckCircle width={15} height={15} aria-hidden="true" />
          You are all set.
        </p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- custom layout */

function OwnLayout({ name }: { name: string }) {
  const [saved, setSaved] = useState<AvatarOptions | null>(null);
  return (
    <div className="show-frame">
      <AvatarPickerRoot
        name={name}
        unstyled
        className="own"
        onSave={(look) => setSaved(look)}
      >
        <OwnPreview saved={saved} />
        <AvatarPickerSurface className="own-surface" />
        <div className="own-bar">
          <AvatarPickerMood />
          <span className="bb-picker-grow" />
          <AvatarPickerBlush />
          <AvatarPickerSave>Use this look</AvatarPickerSave>
        </div>
      </AvatarPickerRoot>
    </div>
  );
}

/** The one piece the parts leave to you: a live preview of the current look. */
function OwnPreview({ saved }: { saved: AvatarOptions | null }) {
  const { name, value, expressionName } = useAvatarPicker();
  return (
    <div className="own-head">
      <Avatar name={name} {...(saved ?? value)} size={52} animate="all" />
      <div className="own-copy">
        <b>Your avatar</b>
        <span>{saved ? 'Saved' : expressionName.toLowerCase()}</span>
      </div>
    </div>
  );
}
