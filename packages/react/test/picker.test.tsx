// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AvatarPicker } from '../src/AvatarPicker.js';

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  });
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AvatarPicker', () => {
  it('renders the map, the mood and the actions', () => {
    const { getByRole, getByText, getByLabelText } = render(
      <AvatarPicker name="Sourav Nanda" />,
    );
    expect(getByRole('group')).toBeTruthy();
    expect(getByText('Choose an avatar')).toBeTruthy();
    expect(getByText('Smirk')).toBeTruthy();
    expect(getByLabelText('Next expression')).toBeTruthy();
    expect(getByText('Save')).toBeTruthy();
  });

  it('saves the current look', () => {
    const onSave = vi.fn();
    const { getByText } = render(<AvatarPicker name="Sourav Nanda" onSave={onSave} />);
    fireEvent.click(getByText('Save'));
    expect(onSave).toHaveBeenCalledTimes(1);
    const value = onSave.mock.calls[0]?.[0];
    expect(value).toBeTruthy();
    expect(typeof value?.color).toBe('string');
    expect(typeof value?.expression).toBe('string');
    expect(typeof value?.blush).toBe('boolean');
  });

  it('reports the blush toggle through onChange', () => {
    const onChange = vi.fn();
    const { getByText } = render(<AvatarPicker name="Sourav Nanda" onChange={onChange} />);
    fireEvent.click(getByText('Blush'));
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]?.blush).toBe(false);
  });
});
