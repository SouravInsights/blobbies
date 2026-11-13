import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { markDataUri } from './ui';

import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/geist-mono';
import './styles.css';

import { App } from './App';
import { installSprings } from './motion/spring';

// Every spring the page uses, sampled into a CSS easing and written to :root
// once. A real spring then runs on the compositor, with no JS per frame.
installSprings(document.documentElement);

/**
 * The tab carries the same blobbie as the bar, drawn from the same constants —
 * no extra asset to keep in sync with the mark.
 */
const icon = document.createElement('link');
icon.rel = 'icon';
icon.type = 'image/svg+xml';
icon.href = markDataUri(64);
document.head.append(icon);

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
