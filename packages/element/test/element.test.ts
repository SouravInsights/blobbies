// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
  BlobbiesAvatar,
  TAG_NAME,
  createAvatarElement,
  defineBlobbies,
} from '../src/index.js';

defineBlobbies();

afterEach(() => {
  document.body.innerHTML = '';
});

describe('<blobbies-avatar>', () => {
  it('is registered', () => {
    expect(customElements.get(TAG_NAME)).toBe(BlobbiesAvatar);
  });

  it('renders an svg from its name', () => {
    const el = document.createElement(TAG_NAME) as BlobbiesAvatar;
    el.setAttribute('name', 'Sourav Nanda');
    document.body.appendChild(el);

    const svg = el.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-label')).toBe('Sourav Nanda');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 100 100');
  });

  it('re-renders when an attribute changes', () => {
    const el = document.createElement(TAG_NAME) as BlobbiesAvatar;
    el.setAttribute('name', 'Ira');
    document.body.appendChild(el);
    expect(el.querySelector('svg')?.getAttribute('width')).toBe('48');

    el.setAttribute('size', '64');
    expect(el.querySelector('svg')?.getAttribute('width')).toBe('64');
  });

  it('reflects properties to attributes', () => {
    const el = createAvatarElement('Ada Lovelace', { size: 40, color: '#6CC8FF' });
    document.body.appendChild(el);

    expect(el.size).toBe(40);
    expect(el.color).toBe('#6CC8FF');

    el.size = 32;
    expect(el.getAttribute('size')).toBe('32');
    expect(el.querySelector('svg')?.getAttribute('width')).toBe('32');
  });

  it('does not attach the motion runtime unless it is asked for', () => {
    const staticEl = document.createElement(TAG_NAME) as BlobbiesAvatar;
    staticEl.setAttribute('name', 'Ira');
    document.body.appendChild(staticEl);
    expect(staticEl.querySelector('svg')?.classList.contains('bb-motion')).toBe(false);

    const animated = document.createElement(TAG_NAME) as BlobbiesAvatar;
    animated.setAttribute('name', 'Ira');
    animated.setAttribute('motion', 'all');
    document.body.appendChild(animated);
    expect(animated.querySelector('svg')?.classList.contains('bb-motion')).toBe(true);
  });

  it('cleans up motion when removed from the document', () => {
    const el = document.createElement(TAG_NAME) as BlobbiesAvatar;
    el.setAttribute('name', 'Ira');
    el.setAttribute('motion', 'all');
    document.body.appendChild(el);
    const svg = el.querySelector('svg');
    expect(svg?.classList.contains('bb-motion')).toBe(true);

    el.remove();
    expect(svg?.classList.contains('bb-motion')).toBe(false);
  });
});
