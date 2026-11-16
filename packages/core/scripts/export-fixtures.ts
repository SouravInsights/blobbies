/**
 * Export the cross-platform conformance fixture.
 *
 * The TypeScript core is the *oracle*. This writes the exact resolved output
 * for a fixed set of names and options to
 * `packages/core/fixtures/avatar-conformance.json`. Every platform port — React
 * Native, SwiftUI, a hosted HTTP API — replays these cases and asserts
 * equality, so a port cannot drift from the reference without CI failing.
 *
 * Run `pnpm export:fixtures` from `packages/core` after any intentional change
 * to the engine, and commit the regenerated file.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTRACT_VERSION } from '../src/contract.js';
import { renderAvatarBody, renderAvatarSvg } from '../src/render.js';
import type { AvatarOptions } from '../src/types.js';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../fixtures/avatar-conformance.json');

export interface ConformanceCase {
  id: string;
  name: string;
  options: AvatarOptions;
}

/** Names chosen to exercise ASCII, unicode, emoji, punctuation and edge input. */
const NAMES: readonly string[] = [
  'Sourav Nanda',
  'Ira',
  'Ada Lovelace',
  'Grace Hopper',
  '田中太郎',
  '李 雷',
  '😀',
  '',
  '   ',
  'A',
  'Zed 9',
  "O'Brien",
  '@souravinsights',
  'Ångström',
  'María José',
  'X Æ A-12',
  'a',
  'A B C D',
];

/** Option variants, each applied to a representative name. */
const VARIANTS: ReadonlyArray<{ id: string; name: string; options: AvatarOptions }> = [
  { id: 'explicit-look', name: 'Sourav Nanda', options: { color: '#0FA3B1', shape: 'round', expression: 'smirk', blush: true } },
  { id: 'variant-3', name: 'Sourav Nanda', options: { variant: 3 } },
  { id: 'tilt', name: 'Ada Lovelace', options: { tilt: -6 } },
  { id: 'blink', name: 'Grace Hopper', options: { animate: 'blink' } },
  { id: 'custom-palette', name: 'Ira', options: { palette: ['#0FA3B1', '#FFD166', '#EF476F'] } },
  { id: 'chrome', name: 'Ira', options: { size: 64, rounded: true, className: 'mine', title: true } },
];

export function conformanceCases(): ConformanceCase[] {
  const cases: ConformanceCase[] = NAMES.map((name) => ({ id: `base:${name}`, name, options: {} }));
  for (const v of VARIANTS) {
    cases.push({ id: v.id, name: v.name, options: v.options });
  }
  return cases;
}

export function buildFixture(): Record<string, unknown> {
  const pkg = JSON.parse(
    readFileSync(resolve(here, '../package.json'), 'utf8'),
  ) as { version: string };

  const cases = conformanceCases().map(({ id, name, options }) => {
    const resolved = renderAvatarBody(name, options);
    return {
      id,
      name,
      options,
      expected: {
        letters: resolved.letters,
        prefix: resolved.prefix,
        traits: resolved.traits,
        blink: resolved.blink,
        body: resolved.body,
        svg: renderAvatarSvg(name, options),
      },
    };
  });

  return {
    contract: CONTRACT_VERSION,
    engine: 'blobbies',
    version: pkg.version,
    cases,
  };
}

function main(): void {
  const fixture = buildFixture();
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(fixture, null, 2) + '\n', 'utf8');
  const count = (fixture.cases as unknown[]).length;
  process.stdout.write(`wrote ${count} cases → ${OUT}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
