import { useEffect, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Popover from '@radix-ui/react-popover';
import { toast } from 'sonner';
import {
  Avatar,
  AvatarPicker,
  AvatarPickerBlush,
  AvatarPickerCancel,
  AvatarPickerMood,
  AvatarPickerPreview,
  AvatarPickerReset,
  AvatarPickerRoot,
  AvatarPickerSave,
  AvatarPickerSurface,
  useAvatarPicker,
  PALETTE,
} from '@blobbies/react';
import type { AvatarOptions } from '@blobbies/react';
import { CheckCircle, EditPencil } from 'iconoir-react';
import { Code, CopyButton, Mark } from '../ui';
import { Lead } from './Lead';

/**
 * The picker, in the places products actually put one.
 *
 * `blobbies` ships no dialog, popover or sign-up — deliberately. What it ships
 * is a panel that fits whatever box you hand it, so the same component drops
 * into a modal, an inline settings row, a popover, or a layout you build from
 * its parts.
 *
 * Every stage is the real component inside a real product surface, and the
 * product's own avatar always shows the live look. Pan the map and the face in
 * the app bar changes with it, so the section is a demonstration rather than a
 * screenshot.
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
              <CopyButton
                className="btn small"
                text={place?.code ?? ''}
                label="Copy"
              />
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
    <AvatarPickerPreview size={64} />
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
  onChange={setLive}
  onSave={(look) => setPhoto(look)}
/>`,
  },
  {
    id: 'popover',
    label: 'In a popover',
    note: 'A quick change from the composer, without leaving the thread.',
    file: 'AvatarPopover.tsx',
    code: `<Popover>
  <Popover.Trigger asChild>
    <button className="composer-avatar">
      <Avatar name={user.name} {...live} />
    </button>
  </Popover.Trigger>
  <Popover.Content side="top" align="start" sideOffset={10}>
    <AvatarPickerRoot name={user.name} onSave={save}>
      <div className="head">Your avatar</div>
      <AvatarPickerSurface />
      <div className="foot">
        <AvatarPickerReset />
        <AvatarPickerSave>Save</AvatarPickerSave>
      </div>
    </AvatarPickerRoot>
  </Popover.Content>
</Popover>`,
  },
  {
    id: 'signup',
    label: 'Onboarding',
    note: 'Let people pick a face as part of onboarding.',
    file: 'Onboarding.tsx',
    code: `<AvatarPicker
  name={user.name}
  title=""
  description=""
  saveLabel="Continue"
  onChange={setLive}
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

/** The look the map opens on: its centre cell. */
const START: AvatarOptions = { color: PALETTE[2], expression: 'smirk', blush: true };

/** True below a breakpoint, so a popover can become a sheet on a phone. */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (): void => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** A small product surface, so the picker is seen inside an actual app. */
function AppFrame({
  name,
  look,
  crumb,
  tall = false,
  children,
}: {
  name: string;
  look: AvatarOptions;
  crumb: string;
  tall?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={tall ? 'app tall' : 'app'}>
      <header className="app-bar">
        <span className="app-brand">
          <Mark size={16} />
          <b>NoteMap</b>
        </span>
        <span className="app-crumb">{crumb}</span>
        <span className="app-me">
          <Avatar name={name} {...look} size={28} animate="all" />
          <i aria-hidden="true" />
        </span>
      </header>
      <div className="app-body">{children}</div>
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

/** The app's avatar, always live: blink plus cursor follow. */
function Photo({
  name,
  look,
  size = 44,
}: {
  name: string;
  look: AvatarOptions;
  size?: number;
}) {
  return <Avatar name={name} {...look} size={size} animate="all" />;
}

/* ----------------------------------------------------------- 1. in a dialog */

function InDialog({ name }: { name: string }) {
  const [saved, setSaved] = useState<AvatarOptions | null>(null);
  const [live, setLive] = useState<AvatarOptions>(START);
  const [open, setOpen] = useState(true);
  const [holder, setHolder] = useState<HTMLDivElement | null>(null);

  const close = (): void => {
    setLive(saved ?? START);
    setOpen(false);
  };

  return (
    <div className="win-scene" data-open={open ? '1' : undefined} ref={setHolder}>
      <AppFrame name={name} look={live} crumb="Settings / Profile">
        <Row label="Profile photo" hint="Upload a photo or pick an avatar.">
          <div className="win-anchor">
            <button
              type="button"
              className="win-photo"
              onClick={() => setOpen(true)}
              aria-label="Change profile photo"
            >
              <Photo name={name} look={live} />
              <span className="win-edit">
                <EditPencil width={18} height={18} aria-hidden="true" />
              </span>
            </button>
            {!open && <span className="win-ping" aria-hidden="true" />}
          </div>
        </Row>
        <Row label="Full name">
          <span className="win-field">Maya Chen</span>
        </Row>
        <Row label="Email" last>
          <span className="win-field">maya@notemap.com</span>
        </Row>
      </AppFrame>

      <Dialog.Root
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : close())}
        modal={false}
      >
        <Dialog.Portal container={holder}>
          <Dialog.Overlay className="dlg-overlay" />
          <Dialog.Content
            className="dlg-content"
            aria-describedby={undefined}
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <Dialog.Title className="sr-only">Choose an avatar</Dialog.Title>
            <AvatarPicker
              name={name}
              className="blobbies-picker"
              defaultValue={saved ?? START}
              onChange={setLive}
              onSave={(look) => {
                setSaved(look);
                setLive(look);
                setOpen(false);
                toast.success('Profile photo updated');
              }}
              onCancel={close}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/* ------------------------------------------------------------ 2. on the page */

function OnPage({ name }: { name: string }) {
  const [live, setLive] = useState<AvatarOptions>(START);

  return (
    <AppFrame name={name} look={live} crumb="Settings / Profile">
      <div className="page-head">
        <div className="page-copy">
          <b>Avatar</b>
          <p>Pick the face you use across NoteMap. It updates in comments, mentions and your profile.</p>
        </div>
        <div className="page-current">
          <Photo name={name} look={live} size={44} />
        </div>
      </div>

      <div className="pd-inline">
        <AvatarPicker
          name={name}
          className="blobbies-picker flat"
          title=""
          description=""
          defaultValue={START}
          onChange={setLive}
          onSave={(look) => {
            setLive(look);
            toast.success('Avatar updated');
          }}
        />
      </div>

      <div className="page-preview">
        <span className="group-label">Preview</span>
        <div className="preview-row">
          <span className="preview-item">
            <Avatar name={name} {...live} size={22} animate="all" />
            <span>Comment</span>
          </span>
          <span className="preview-item">
            <Avatar name={name} {...live} size={32} animate="all" />
            <span>Mention</span>
          </span>
          <span className="preview-item">
            <Avatar name={name} {...live} size={44} animate="all" />
            <span>Profile</span>
          </span>
        </div>
      </div>
    </AppFrame>
  );
}

/* ----------------------------------------------------------- 3. in a popover */

const THREAD = [
  { name: 'Priya Nair', text: 'The new look map is so much faster.', when: '2h' },
  { name: 'Omar Haddad', text: 'Seconded — the faces finally look like us.', when: '1h' },
] as const;

function InPopover({ name }: { name: string }) {
  const [saved, setSaved] = useState<AvatarOptions | null>(null);
  const [live, setLive] = useState<AvatarOptions>(START);
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 820px)');

  const close = (): void => {
    setLive(saved ?? START);
    setOpen(false);
  };

  const onOpenChange = (next: boolean): void => {
    if (next) setOpen(true);
    else close();
  };

  const save = (look: AvatarOptions): void => {
    setSaved(look);
    setLive(look);
    setOpen(false);
    toast.success('Avatar updated');
  };

  const sheetPicker = (
    <AvatarPicker
      name={name}
      className="blobbies-picker"
      title=""
      description=""
      defaultValue={saved ?? START}
      onChange={setLive}
      onSave={save}
      onCancel={close}
    />
  );

  /* A popover wants a compact surface: the map and a single action row, not
     the full preset with its header, mood row and toggles. */
  const popoverPicker = (
    <AvatarPickerRoot
      name={name}
      className="blobbies-picker compact-picker"
      defaultValue={saved ?? START}
      onChange={setLive}
      onCancel={close}
      onSave={save}
    >
      <div className="compact-head">Your avatar</div>
      <AvatarPickerSurface />
      <div className="compact-foot">
        <AvatarPickerReset />
        <span className="bb-picker-grow" />
        <AvatarPickerCancel />
        <AvatarPickerSave>Save</AvatarPickerSave>
      </div>
    </AvatarPickerRoot>
  );

  const trigger = (
    <button type="button" className="composer-avatar" aria-label="Choose your avatar">
      <Avatar name={name} {...live} size={34} animate="all" />
    </button>
  );

  return (
    <AppFrame name={name} look={live} crumb="Thread" tall>
      <div className="thread">
        <div className="thread-list">
          {THREAD.map((comment) => (
            <div className="cmt" key={comment.name}>
              <Avatar name={comment.name} size={30} animate="all" />
              <div className="cmt-main">
                <b>
                  {comment.name} <span>· {comment.when}</span>
                </b>
                <p>{comment.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="composer">
          <div className="pd-anchor">
            {isMobile ? (
              <Dialog.Root open={open} onOpenChange={onOpenChange}>
                <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="sheet-scrim" />
                  <Dialog.Content
                    className="sheet"
                    aria-describedby={undefined}
                    onOpenAutoFocus={(event) => event.preventDefault()}
                  >
                    <Dialog.Title className="sr-only">Choose your avatar</Dialog.Title>
                    <span className="sheet-handle" aria-hidden="true" />
                    {sheetPicker}
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            ) : (
              <Popover.Root open={open} onOpenChange={onOpenChange}>
                <Popover.Trigger asChild>{trigger}</Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    className="pd-pop"
                    side="top"
                    align="start"
                    sideOffset={10}
                    collisionPadding={16}
                    onOpenAutoFocus={(event) => event.preventDefault()}
                  >
                    {popoverPicker}
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            )}
            {!open && <span className="win-ping" aria-hidden="true" />}
          </div>
          <div className="composer-box">Write a comment…</div>
          <button type="button" className="composer-post">
            Post
          </button>
        </div>
      </div>
    </AppFrame>
  );
}

/* ------------------------------------------------------------- 4. sign-up */

function SignUp({ name }: { name: string }) {
  const [live, setLive] = useState<AvatarOptions>(START);
  const [done, setDone] = useState(false);

  return (
    <div className="su">
      <div className="su-steps" aria-hidden="true">
        <i className="on" />
        <i className="on" />
        <i className={done ? 'on' : undefined} />
      </div>
      <div className="su-ask">
        <h4>{done ? 'You are all set' : 'Pick your look'}</h4>
        <p>
          {done
            ? 'Welcome to NoteMap. You can change it later.'
            : 'Step 2 of 3. You can change it later.'}
        </p>
      </div>

      <div className="cmt cmt-preview">
        <Photo name={name} look={live} size={30} />
        <div className="cmt-main">
          <b>
            You <span>· {done ? 'ready' : 'preview'}</span>
          </b>
          <p>
            {done
              ? 'First comment in the new workspace.'
              : 'This is how you will show up in comments.'}
          </p>
        </div>
      </div>

      <AvatarPicker
        name={name}
        className="blobbies-picker flat"
        title=""
        description=""
        saveLabel={done ? 'Saved' : 'Continue'}
        defaultValue={START}
        onChange={setLive}
        onSave={(look) => {
          setLive(look);
          setDone(true);
          toast.success('Welcome, Maya');
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------ 5. your colours */

const BRAND = ['#6d28d9', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444'];
const BRAND_START: AvatarOptions = { color: BRAND[2], expression: 'smirk', blush: true };

function Themed({ name }: { name: string }) {
  const [saved, setSaved] = useState(false);
  const [live, setLive] = useState<AvatarOptions>(BRAND_START);
  return (
    <div className="th-app">
      <header className="th-bar">
        <span className="th-brand">
          <i aria-hidden="true" />
          Acme
        </span>
        <Avatar name={name} {...live} size={28} animate="all" />
      </header>
      <div className="th-body">
        <AvatarPicker
          name={name}
          className="blobbies-picker th-picker"
          palette={BRAND}
          defaultValue={BRAND_START}
          saveLabel={saved ? 'Saved' : 'Save'}
          onChange={(look) => {
            setLive(look);
            setSaved(false);
          }}
          onSave={() => {
            setSaved(true);
            toast.success('Brand avatar saved');
          }}
        />
        <div className="th-comment">
          <Avatar name={name} {...live} size={26} animate="all" />
          <span>
            <b>You</b> in an Acme comment
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------- 6. your own layout */

function Custom({ name }: { name: string }) {
  const [saved, setSaved] = useState<AvatarOptions | null>(null);
  return (
    <AvatarPickerRoot
      name={name}
      unstyled
      className="cu"
      onSave={(look) => {
        setSaved(look);
        toast.success('Look saved');
      }}
    >
      <CustomSide saved={saved} />
      <div className="cu-hive">
        <AvatarPickerSurface />
        <AvatarPickerMood />
      </div>
    </AvatarPickerRoot>
  );
}

function CustomSide({ saved }: { saved: AvatarOptions | null }) {
  const { name, value, expressionName } = useAvatarPicker();
  return (
    <div className="cu-side">
      <AvatarPickerPreview size={64} animate="all" />
      <b>Your avatar</b>
      <span className="cu-meta">{saved ? 'Saved' : expressionName.toLowerCase()}</span>
      <div className="cu-comment">
        <Avatar name={name} {...value} size={22} animate="all" />
        <span>Looks good in comments.</span>
      </div>
      <AvatarPickerBlush />
      <AvatarPickerReset />
      <AvatarPickerSave>Use this look</AvatarPickerSave>
    </div>
  );
}