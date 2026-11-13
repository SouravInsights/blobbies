import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { avatarDataUri } from 'blobbies';

import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/geist-mono';
import './styles.css';

import { App } from './App';

/**
 * The favicon is a blobbie, so the tab is already on-brand before the page
 * paints. Generated at runtime — no extra asset to keep in sync.
 */
const icon = document.createElement('link');
icon.rel = 'icon';
icon.type = 'image/svg+xml';
icon.href = avatarDataUri('Sourav Nanda', { size: 64 });
document.head.append(icon);

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
