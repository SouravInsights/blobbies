import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import Avatar from '../src/Avatar.svelte';

/** The browser half. */
describe('Avatar (Svelte, mounted)', () => {
  it('renders an svg at the requested size', () => {
    const { container } = render(Avatar, { props: { name: 'Ira', size: 64 } });
    const svg = container.querySelector('svg');

    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('64');
    expect(svg?.getAttribute('height')).toBe('64');
  });

  it('rounds when asked', () => {
    const { container } = render(Avatar, { props: { name: 'Ira', rounded: true } });
    const svg = container.querySelector('svg') as SVGSVGElement;

    expect(svg.style.borderRadius).toBe('50%');
  });

  it('passes extra attributes through to the svg', () => {
    const { container } = render(Avatar, {
      props: { name: 'Ira', 'data-testid': 'avatar' },
    });

    expect(container.querySelector('svg')?.getAttribute('data-testid')).toBe('avatar');
  });
});
