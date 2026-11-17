import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Avatar, AvatarPicker } from '@blobbies/react';
import type { AvatarOptions } from '@blobbies/react';
import './styles.css';

/**
 * Blobbies in a React app.
 *
 * Two things worth reading, because they are the two things a React app
 * actually does with the library: render an avatar anywhere, and let someone
 * choose their own.
 */
function App() {
  const [name, setName] = useState('Sourav Nanda');
  const [saved, setSaved] = useState<AvatarOptions | null>(null);
  const [live, setLive] = useState<AvatarOptions | null>(null);
  const [open, setOpen] = useState(true);

  return (
    <div className="page">
      <header className="head">
        <div className="me">
          {/* The header avatar follows the picker as it is dragged, so the
              choice is visible in the place it will actually be used. */}
          <Avatar name={name} {...(live ?? saved ?? {})} size={44} animate="all" />
          <div>
            <b>{name}</b>
            <span>{live ? 'choosing…' : saved ? 'saved' : ''}</span>
          </div>
        </div>
        <button className="btn" onClick={() => setOpen((v) => !v)}>
          {open ? 'Close' : 'Choose an avatar'}
        </button>
      </header>

      <label className="field">
        <span>Name</span>
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setSaved(null);
            setLive(null);
          }}
        />
      </label>

      {open && (
        <AvatarPicker
          name={name}
          defaultValue={saved ?? undefined}
          onChange={setLive}
          onSave={(value) => {
            setSaved(value);
            setLive(null);
            setOpen(false);
          }}
          onCancel={() => {
            setLive(null);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

createRoot(document.querySelector('#root') as HTMLElement).render(<App />);
