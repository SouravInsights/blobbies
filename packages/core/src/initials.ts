/**
 * Extract the two "eye" characters from a name.
 *
 * Rules:
 *  - "Sourav Nanda"  → "SN"  (first letter of first + last word)
 *  - "Ira"           → "IR"  (first two letters of a single word)
 *  - "@souravinsights" → "SO"  (punctuation ignored)
 *  - Extra spaces, punctuation, emoji and combining marks are ignored.
 *  - Non-Latin letters are preserved (rendered via the <text> fallback).
 *  - Empty / no letter-like characters → "?".
 */

const LETTER_OR_NUMBER = /[\p{L}\p{N}]/u;

/** Split a string into user-perceived grapheme clusters. */
function graphemes(input: string): string[] {
  const Segmenter = (
    typeof Intl !== 'undefined'
      ? (Intl as unknown as { Segmenter?: new (locale?: string, opts?: object) => { segment(s: string): Iterable<{ segment: string }> } })
          .Segmenter
      : undefined
  );

  if (typeof Segmenter === 'function') {
    try {
      const seg = new Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(seg.segment(input), (s) => s.segment);
    } catch {
      /* fall through to code-point split */
    }
  }
  return Array.from(input);
}

function firstMeaningfulGrapheme(word: string): string | null {
  for (const g of graphemes(word)) {
    if (LETTER_OR_NUMBER.test(g)) return g;
  }
  return null;
}

export function getInitials(name: string): string {
  if (typeof name !== 'string') return '?';

  const words = name
    .normalize('NFC')
    .trim()
    .split(/\s+/u)
    .filter(Boolean);

  if (words.length === 0) return '?';

  // Collect the first meaningful grapheme of each word, dropping words that
  // contain nothing letter-like (pure emoji / punctuation).
  const heads: string[] = [];
  for (const word of words) {
    const head = firstMeaningfulGrapheme(word);
    if (head !== null) heads.push(head);
  }

  if (heads.length === 0) return '?';

  let raw: string;
  if (heads.length >= 2) {
    const first = heads[0] as string;
    const last = heads[heads.length - 1] as string;
    raw = first + last;
  } else {
    // Single meaningful word: take its first two letter-like graphemes.
    const only = words.find((w) => firstMeaningfulGrapheme(w) !== null) ?? '';
    const letters = graphemes(only).filter((g) => LETTER_OR_NUMBER.test(g));
    raw = letters.slice(0, 2).join('');
  }

  const upper = raw.toLocaleUpperCase();
  if (upper.length === 0) return '?';
  return upper;
}
