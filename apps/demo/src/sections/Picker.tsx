import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  Avatar,
  AvatarPicker,
  AvatarPickerBlush,
  AvatarPickerMood,
  AvatarPickerPreview,
  AvatarPickerReset,
  AvatarPickerRoot,
  AvatarPickerSave,
  AvatarPickerSurface,
  useAvatarPicker,
} from '@blobbies/react';
import type { AvatarOptions } from '@blobbies/react';
import {
  Bell,
  CheckCircle,
  CreditCard,
  EditPencil,
  User,
} from 'iconoir-react';
import { Code, Mark } from '../ui';
import { Lead } from './Lead';

/**
 * The picker, in the places products actually put one.
 *
 * `blobbies` ships no dialog, popover or sign-up — deliberately. What it ships
 * is a panel that fits whatever box you hand it, so the same component drops
 * into a modal, an inline settings row, a popover, or a layout you build from
 * its parts. These six stages are that claim, shown rather than told: every
 * one is the real component, not a mock of it.
 */
export function Picker({ name }: { name: string }) {
  const [id, setId] = useState(PLACES[0]?.id ?? 'dialog');
  const place = PLACES.find((p) => p.id === id) ?? PLACES[0];

  /** Up and down move between places, Home and End go to the ends. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
      return;
    event.preventDefault();
    const at = PLACES.findIndex((p) => p.id === id);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? PLACES.length - 1
          : (at +
              (event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1) +
              PLACES.length) %
            PLACES.length;
    const nextId = PLACES[next]?.id ?? 'dialog';
    setId(nextId);
    document.getElementById(`pl-tab-${nextId}`)?.focus();
  };

  return (
    <section className="section" id="picker">
      <Lead
        title="One picker, every surface."
        note="A dialog, a page, a popover, a sign-up, your colours — the same component."
      />

      <div className="pl">
        <div
          className="pl-nav"
          role="tablist"
          aria-label="Ways to use the picker"
          onKeyDown={onKeyDown}
        >
          {PLACES.map((p) => (
            <button
              key={p.id}
              id={`pl-tab-${p.id}`}
              type="button"
              role="tab"
              aria-selected={id === p.id}
              aria-controls="pl-stage"
              tabIndex={id === p.id ? 0 : -1}
              onClick={() => setId(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="pl-body">
          <p className="pl-note">{place?.note}</p>
          <div
            className="pl-stage"
            id="pl-stage"
            role="tabpanel"
            aria-labelledby={`pl-tab-${id}`}
          >
            <Place id={id} name={name} />
          </div>
          <figure className="pl-code">
            <figcaption>
              <span className="qs-file">{place?.file}</span>
            </figcaption>
            <Code code={place?.code ?? ''} />
          </figure>
        </div>
      </div>
    </section>
  );
}

interface Place {
  id: PlaceId;
  label: string;
  note: string;
  file: string;
  code: string;
}

type PlaceId = 'dialog' | 'page' | 'popover' | 'signup' | 'themed' | 'custom';

const DIALOG_CODE = `const [open, setOpen] = useState(false)

<button onClick={() => setOpen(true)}>
  <Avatar name={user.name} {...photo} size={40} />
</button>

{open && (
  <Dialog open onClose={() => setOpen(false)}>
    <AvatarPicker
      name={user.name}
      defaultValue={photo}
      onSave={(look) => {
        setPhoto(look)
        setOpen(false)
      }}
      onCancel={() => setOpen(false)}
    />
  </Dialog>
)}`;

const THEMED_CODE = `<AvatarPicker
  name={user.name}
  palette={brand}
  className="brand-picker"
  onSave={save}
/>

.brand-picker {
  --bb-picker-panel: #ffffff;
  --bb-picker-ink: #14142b;
  --bb-picker-accent: #6d28d9;
  --bb-picker-accent-ink: #ffffff;
}`;

const CUSTOM_CODE = `<AvatarPickerRoot name={user.name} unstyled onSave={save}>
  <div className="side">
    <AvatarPickerPreview size={76} />
    <AvatarPickerBlush />
    <AvatarPickerReset />
    <AvatarPickerSave>Use this look</AvatarPickerSave>
  </div>
  <div className="hive">
    <AvatarPickerSurface />
    <AvatarPickerMood />
  </div>
</AvatarPickerRoot>`;

const PLACES: readonly Place[] = [
  {
    id: 'dialog',
    label: 'In a dialog',
    note: 'Open it from the profile photo, inside your own dialog.',
    file: 'ProfileSettings.tsx',
    code: DIALOG_CODE,
  },
  {
    id: 'page',
    label: 'On the page',
    note: 'No popup: the picker sits in the settings body itself.',
    file: 'Settings.tsx',
    code: `<AvatarPicker
  name={user.name}
  title=""
  description=""
  defaultValue={photo}
  onSave={(look) => setPhoto(look)}
/>`,
  },
  {
    id: 'popover',
    label: 'In a popover',
    note: 'A smaller surface, anchored to the photo it changes.',
    file: 'AvatarPopover.tsx',
    code: `<Popover
  open={open}
  onOpenChange={setOpen}
  trigger={<Avatar name={user.name} {...photo} />}
>
  <AvatarPicker
    name={user.name}
    title=""
    description=""
    onSave={(look) => {
      setPhoto(look)
      setOpen(false)
    }}
  />
</Popover>`,
  },
  {
    id: 'signup',
    label: 'When signing up',
    note: 'Let people pick a face as a step in onboarding.',
    file: 'Onboarding.tsx',
    code: `<AvatarPicker
  name={user.name}
  title=""
  description=""
  saveLabel="Continue"
  onSave={(look) => updateUser({ look })}
/>`,
  },
  {
    id: 'themed',
    label: 'In your colours',
    note: 'A handful of CSS variables and a palette make it yours.',
    file: 'BrandPicker.tsx',
    code: THEMED_CODE,
  },
  {
    id: 'custom',
    label: 'Your own layout',
    note: 'Keep the parts, keep the state, throw the panel away.',
    file: 'OwnLayout.tsx',
    code: CUSTOM_CODE,
  },
];

function Place({ id, name }: { id: PlaceId; name: string }): JSX.Element {
  switch (id) {
    case 'page':
      return <OnPage name={name} />;
    case 'popover':
      return <InPopover name={name} />;
    case 'signup':
      return <SignUp name={name} />;
    case 'themed':
      return <Themed name={name} />;
    case 'custom':
      return <Custom name={name} />;
    default:
      return <InDialog name={name} />;
  }
}

/* ------------------------------------------------------------------ shell */

/** The settings window three of the six places share. */
function Window({
  crumb,
  tall = false,
  children,
}: {
  crumb: string;
  tall?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={tall ? 'win tall' : 'win'}>
      <div className="win-bar">
        <span>Settings</span>
        <i aria-hidden="true">/</i>
        <b>{crumb}</b>
      </div>
      <div className="win-body">{children}</div>
    </div>
  );
}

function Row({
  label,
  hint,
  last = false,
  children,
}: {
  label: string;
  hint?: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="win-row" data-last={last ? '1' : undefined}>
      <div className="win-label">
        <b>{label}</b>
        {hint && <p>{hint}</p>}
      </div>
      {children}
    </div>
  );
}

/** The photo before a look is chosen: the letter the avatar will replace. */
function Photo({
  name,
  look,
  size = 44,
}: {
  name: string;
  look: AvatarOptions | null;
  size?: number;
}) {
  if (look) return <Avatar name={name} {...look} size={size} animate="blink" />;
  return (
    <span className="win-letter" style={{ width: size, height: size }}>
      M
    </span>
  );
}

/* ----------------------------------------------------------- 1. in a dialog */

function InDialog({ name }: { name: string }) {
  const [photo, setPhoto] = useState<AvatarOptions | null>(null);
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
    <Window crumb="Profile">
      <Row label="Profile photo" hint="Upload a photo or pick an avatar.">
        <button
          type="button"
          className="win-photo"
          onClick={() => setOpen(true)}
          aria-label="Change profile photo"
        >
          <Photo name={name} look={photo} />
          <span className="win-edit">
            <EditPencil width={18} height={18} aria-hidden="true" />
          </span>
        </button>
      </Row>
      <Row label="Full name">
        <span className="win-field">Maya Chen</span>
      </Row>
      <Row label="Email" last>
        <span className="win-field">maya@notemap.com</span>
      </Row>

      {open &&
        createPortal(
          <div className="win-scrim" onClick={() => setOpen(false)}>
            <div
              className="win-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="Choose an avatar"
              onClick={(event) => event.stopPropagation()}
            >
              <AvatarPicker
                name={name}
                className="blobbies-picker"
                defaultValue={photo ?? undefined}
                onSave={(look) => {
                  setPhoto(look);
                  setOpen(false);
                  setFlash(true);
                }}
                onCancel={() => setOpen(false)}
              />
            </div>
          </div>,
          document.body,
        )}

      <p className="win-toast" data-on={flash ? '1' : undefined} aria-live="polite">
        <CheckCircle width={15} height={15} aria-hidden="true" />
        Profile photo updated
      </p>
    </Window>
  );
}

/* ------------------------------------------------------------ 2. on the page */

function OnPage({ name }: { name: string }) {
  const [photo, setPhoto] = useState<AvatarOptions | null>(null);
  const [open, setOpen] = useState(true);

  return (
    <Window crumb="Profile">
      <Row label="Profile photo" hint="Pick an avatar. You can change it any time.">
        <div className="pd-current">
          <Photo name={name} look={photo} />
          {!open && (
            <button type="button" className="btn small" onClick={() => setOpen(true)}>
              Change
            </button>
          )}
        </div>
      </Row>

      {open && (
        <div className="pd-inline">
          <AvatarPicker
            name={name}
            className="blobbies-picker flat"
            title=""
            description=""
            defaultValue={photo ?? undefined}
            onSave={(look) => {
              setPhoto(look);
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        </div>
      )}

      <Row label="Full name">
        <span className="win-field">Maya Chen</span>
      </Row>
      <Row label="Email" last>
        <span className="win-field">maya@notemap.com</span>
      </Row>
    </Window>
  );
}

/* ----------------------------------------------------------- 3. in a popover */

function InPopover({ name }: { name: string }) {
  const [photo, setPhoto] = useState<AvatarOptions | null>(null);
  const [open, setOpen] = useState(true);
  const anchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event: PointerEvent): void => {
      if (!anchor.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  return (
    <Window crumb="Profile" tall>
      <Row label="Profile photo" hint="Click it to pick another.">
        <div className="pd-anchor" ref={anchor}>
          <button
            type="button"
            className="win-photo"
            aria-expanded={open}
            aria-label="Change profile photo"
            onClick={() => setOpen((value) => !value)}
          >
            <Photo name={name} look={photo} size={52} />
            <span className="win-edit">
              <EditPencil width={18} height={18} aria-hidden="true" />
            </span>
          </button>

          {open && (
            <div className="pd-pop">
              <AvatarPicker
                name={name}
                className="blobbies-picker"
                title=""
                description=""
                defaultValue={photo ?? undefined}
                onSave={(look) => {
                  setPhoto(look);
                  setOpen(false);
                }}
                onCancel={() => setOpen(false)}
              />
            </div>
          )}
        </div>
      </Row>
      <Row label="Full name">
        <span className="win-field">Maya Chen</span>
      </Row>
      <Row label="Email" last>
        <span className="win-field">maya@notemap.com</span>
      </Row>
    </Window>
  );
}

/* ------------------------------------------------------------- 4. sign-up */

function SignUp({ name }: { name: string }) {
  const [done, setDone] = useState<AvatarOptions | null>(null);

  if (done) {
    return (
      <div className="su">
        <div className="su-done">
          <Avatar name={name} {...done} size={88} animate="all" />
          <h4>Welcome, Maya</h4>
          <p>You are all set.</p>
          <button type="button" className="btn small" onClick={() => setDone(null)}>
            Start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="su">
      <div className="su-steps" aria-hidden="true">
        <i className="on" />
        <i className="on" />
        <i />
      </div>
      <div className="su-ask">
        <h4>Pick your look</h4>
        <p>Step 2 of 3. You can change it later.</p>
      </div>
      <AvatarPicker
        name={name}
        className="blobbies-picker flat"
        title=""
        description=""
        saveLabel="Continue"
        onSave={setDone}
      />
    </div>
  );
}

/* ------------------------------------------------------------ 5. your colours */

const BRAND = ['#6d28d9', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444'];

function Themed({ name }: { name: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="th-wrap">
      <AvatarPicker
        name={name}
        className="blobbies-picker th-picker"
        palette={BRAND}
        saveLabel={saved ? 'Saved' : 'Save'}
        onChange={() => setSaved(false)}
        onSave={() => setSaved(true)}
      />
    </div>
  );
}

/* -------------------------------------------------------- 6. your own layout */

function Custom({ name }: { name: string }) {
  const [saved, setSaved] = useState<AvatarOptions | null>(null);
  return (
    <AvatarPickerRoot name={name} unstyled className="cu" onSave={setSaved}>
      <CustomSide saved={saved} />
      <div className="cu-hive">
        <AvatarPickerSurface />
        <AvatarPickerMood />
      </div>
    </AvatarPickerRoot>
  );
}

function CustomSide({ saved }: { saved: AvatarOptions | null }) {
  const { expressionName } = useAvatarPicker();
  return (
    <div className="cu-side">
      <AvatarPickerPreview size={76} animate="all" />
      <b>Your avatar</b>
      <span className="cu-meta">{saved ? 'Saved' : expressionName.toLowerCase()}</span>
      <AvatarPickerBlush />
      <AvatarPickerReset />
      <AvatarPickerSave>Use this look</AvatarPickerSave>
    </div>
  );
}
