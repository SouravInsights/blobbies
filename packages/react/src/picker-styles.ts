import { useInsertionEffect } from 'react';

const ID = 'blobbies-picker-styles';

const CSS = `
.bb-picker {
  --bb-picker-panel: #ffffff;
  --bb-picker-ink: #18181b;
  --bb-picker-muted: #71717a;
  --bb-picker-line: #e4e4e7;
  --bb-picker-accent: #18181b;
  --bb-picker-accent-ink: #ffffff;
  --bb-picker-radius: 18px;
  --bb-picker-spring: cubic-bezier(0.3, 1.4, 0.5, 1);
  --bb-picker-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --bb-picker-fade: 150ms ease;
  --bb-picker-mono: var(--bb-picker-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);

  width: min(460px, 100%);
  display: grid;
  border: 1px solid var(--bb-picker-line);
  border-radius: var(--bb-picker-radius);
  background: var(--bb-picker-panel);
  color: var(--bb-picker-ink);
  overflow: hidden;
  box-shadow: var(--bb-picker-shadow, 0 1px 2px rgb(0 0 0 / 0.06));
  transition: background-color 0.5s ease;
  container-type: inline-size;
  font-size: 14px;
  line-height: 1.5;
}
.bb-picker * { box-sizing: border-box; }
.bb-picker button { font: inherit; cursor: pointer; }
.bb-picker h3 { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: -0.02em; }
.bb-picker p { margin: 0; }

.bb-picker-head { padding: 16px 20px 10px; }
.bb-picker-head p { margin-top: 3px; color: var(--bb-picker-muted); font-size: 13px; }

.bb-picker-surface {
  position: relative;
  justify-self: center;
  background: radial-gradient(70% 70% at 50% 42%, color-mix(in oklab, var(--bb-picker-ink) 6%, transparent), transparent 74%);
  overflow: hidden;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  outline: none;
}
.bb-picker-surface[data-dragging] { cursor: grabbing; }
.bb-picker-surface:not([data-dragging]) .bb-picker-cell { cursor: pointer; }
.bb-picker-surface:focus-visible { box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--bb-picker-ink) 24%, transparent); }

.bb-picker-viewport { position: absolute; inset: var(--bb-picker-pad, 8px); overflow: hidden; }
.bb-picker-world { position: absolute; left: 0; top: 0; will-change: transform; }

.bb-picker-cell {
  position: absolute;
  left: 0;
  top: 0;
  display: grid;
  place-items: center;
  transform-origin: center;
  transition: transform 0.3s var(--bb-picker-spring), opacity 0.2s ease, filter 0.18s var(--bb-picker-ease-out);
}
.bb-picker-lift { display: block; width: 70%; height: 70%; transition: transform 0.45s var(--bb-picker-spring); }
.bb-picker-lift svg { display: block; width: 100%; height: 100%; }
.bb-picker-ring {
  position: absolute;
  inset: 9%;
  border-radius: 50%;
  border: 2px solid var(--bb-picker-ink);
  opacity: 0;
  scale: 0.9;
  transition: opacity var(--bb-picker-fade), scale 0.28s var(--bb-picker-spring);
  pointer-events: none;
}
.bb-picker-cell[data-focus] .bb-picker-ring { opacity: 1; scale: 1; }

.bb-picker-check {
  position: absolute;
  top: 4%;
  right: 4%;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--bb-picker-accent);
  color: var(--bb-picker-accent-ink);
  box-shadow: 0 0 0 3px var(--bb-picker-panel);
  opacity: 0;
  scale: 0.5;
  z-index: 7;
  pointer-events: none;
  transition: opacity var(--bb-picker-fade), scale 0.24s var(--bb-picker-spring);
}
.bb-picker-check[data-on] { opacity: 1; scale: 1; }

.bb-picker-mood {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 20px 10px;
  border-top: 1px solid var(--bb-picker-line);
  margin-top: 10px;
}
.bb-picker-mood-name {
  width: 12ch;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  font: 11px/1 var(--bb-picker-mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bb-picker-muted);
  animation: bb-picker-mood-in 0.26s var(--bb-picker-spring);
}
.bb-picker-step {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--bb-picker-muted);
  transition: background-color var(--bb-picker-fade), color var(--bb-picker-fade), transform 160ms var(--bb-picker-ease-out);
}
.bb-picker-step:active { transform: scale(0.94); }
.bb-picker-step:hover { background: color-mix(in oklab, var(--bb-picker-ink) 8%, transparent); color: var(--bb-picker-ink); }
.bb-picker-step:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--bb-picker-panel), 0 0 0 3.5px var(--bb-picker-ink); }

.bb-picker-foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--bb-picker-line);
}
.bb-picker-grow { flex: 1; }

.bb-picker-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 11px;
  border: 0;
  border-radius: 8px;
  background: color-mix(in oklab, var(--bb-picker-ink) 8%, transparent);
  color: var(--bb-picker-ink);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: background-color var(--bb-picker-fade), transform 160ms var(--bb-picker-ease-out);
}
.bb-picker-btn:active { transform: scale(0.97); }
.bb-picker-btn:hover { background: color-mix(in oklab, var(--bb-picker-ink) 14%, transparent); }
.bb-picker-btn:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--bb-picker-panel), 0 0 0 3.5px var(--bb-picker-ink); }
.bb-picker-primary { background: var(--bb-picker-accent); color: var(--bb-picker-accent-ink); }
.bb-picker-primary:hover { background: color-mix(in oklab, var(--bb-picker-accent) 86%, var(--bb-picker-panel)); }

.bb-picker-reset {
  height: 28px;
  padding: 0 8px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--bb-picker-muted);
  font-size: 12px;
  font-weight: 500;
  transition: transform 160ms var(--bb-picker-ease-out);
}
.bb-picker-reset:active { transform: scale(0.97); }
.bb-picker-reset:hover { color: var(--bb-picker-ink); }
.bb-picker-reset:disabled { display: none; pointer-events: none; }

.bb-picker-blush,
.bb-picker-spotlight {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 28px;
  padding: 0 11px;
  border: 1px solid var(--bb-picker-line);
  border-radius: 99px;
  background: none;
  color: var(--bb-picker-muted);
  font-size: 12px;
  font-weight: 500;
  transition: border-color var(--bb-picker-fade), color var(--bb-picker-fade), transform 160ms var(--bb-picker-ease-out);
}
.bb-picker-blush:active,
.bb-picker-spotlight:active { transform: scale(0.97); }
.bb-picker-blush::before,
.bb-picker-spotlight::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  transition: background-color var(--bb-picker-fade), border-color var(--bb-picker-fade);
}
.bb-picker-blush:hover,
.bb-picker-spotlight:hover { border-color: var(--bb-picker-muted); color: var(--bb-picker-ink); }
.bb-picker-blush[data-on],
.bb-picker-spotlight[data-on] { color: var(--bb-picker-ink); border-color: color-mix(in oklab, var(--bb-picker-ink) 28%, transparent); }
.bb-picker-blush[data-on]::before,
.bb-picker-spotlight[data-on]::before { background: currentColor; }

@keyframes bb-picker-mood-in { from { opacity: 0; translate: 0 3px; } }

@container (max-width: 440px) {
  .bb-picker-head { padding: 14px 14px 8px; }
  .bb-picker-mood { padding: 6px 14px 8px; }
  .bb-picker-foot { padding: 10px 12px; }
  /* The grower becomes a full-width break, so Cancel and Save share the last
     row instead of being pushed past the edge of a phone-sized panel. */
  .bb-picker-foot .bb-picker-grow { flex-basis: 100%; height: 0; }
  .bb-picker-foot .bb-picker-btn { flex: 1 1 0; justify-content: center; }
}

@container (max-width: 360px) {
  .bb-picker-foot { gap: 6px; }
  .bb-picker-blush,
  .bb-picker-spotlight { padding: 0 9px; }
}

@media (prefers-reduced-motion: reduce) {
  .bb-picker { transition: none; }
  .bb-picker-world { will-change: auto; }
  .bb-picker-cell, .bb-picker-lift, .bb-picker-ring, .bb-picker-mood-name { transition: none; animation: none; }
}
`;

export function usePickerStyles(): void {
  useInsertionEffect(() => {
    if (typeof document === 'undefined' || document.getElementById(ID)) {
      return;
    }
    const style = document.createElement('style');
    style.id = ID;
    style.textContent = CSS;
    document.head.prepend(style);
  }, []);
}
