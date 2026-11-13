import { describe, expect, it } from 'vitest';
import { getInitials } from '../src/initials.js';

describe('getInitials', () => {
  it('takes first + last word initials', () => {
    expect(getInitials('Sourav Nanda')).toBe('SN');
    expect(getInitials('Ada Lovelace King')).toBe('AK');
    expect(getInitials('grace hopper')).toBe('GH');
  });

  it('takes the first two letters of a single word', () => {
    expect(getInitials('Ira')).toBe('IR');
    expect(getInitials('kirby')).toBe('KI');
  });

  it('handles usernames with a leading @', () => {
    expect(getInitials('@souravinsights')).toBe('SO');
  });

  it('collapses extra whitespace', () => {
    expect(getInitials('   John     Doe  ')).toBe('JD');
    expect(getInitials('\tJane\nDoe')).toBe('JD');
  });

  it('ignores punctuation between words', () => {
    expect(getInitials('Jean-Luc Picard')).toBe('JP');
    expect(getInitials('!!!')).toBe('?');
  });

  it('handles emoji without crashing', () => {
    expect(getInitials('😀')).toBe('?');
    expect(getInitials('😀 😀')).toBe('?');
    expect(getInitials('Sourav 😀 Nanda')).toBe('SN');
  });

  it('handles non-Latin names', () => {
    expect(getInitials('Иван Петров')).toBe('ИП');
    expect(getInitials('田中')).toBe('田中');
  });

  it('handles empty / odd input', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials('   ')).toBe('?');
    expect(getInitials(null as unknown as string)).toBe('?');
    expect(getInitials(undefined as unknown as string)).toBe('?');
  });

  it('is stable and deterministic', () => {
    for (let i = 0; i < 50; i++) {
      expect(getInitials('Sourav Nanda')).toBe('SN');
    }
  });
});
