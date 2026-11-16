import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CONTRACT_VERSION } from '../src/contract.js';
import { buildFixture } from '../scripts/export-fixtures.js';

/**
 * The committed fixture is the cross-platform contract. This test replays the
 * live engine and asserts the file still matches, so the fixture can never rot
 * silently. If an intentional engine change makes this fail, run
 * `pnpm export:fixtures` and commit the regenerated file.
 */
const FIXTURE_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../fixtures/avatar-conformance.json');

describe('conformance fixture', () => {
  const committed = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as {
    contract: number;
    cases: unknown[];
  };
  const live = buildFixture();

  it('records the current contract version', () => {
    expect(committed.contract).toBe(CONTRACT_VERSION);
    expect(live.contract).toBe(CONTRACT_VERSION);
  });

  it('matches the live engine byte-for-byte', () => {
    // Deep-equal the whole record: traits, blink, body and full svg per case.
    expect(committed).toEqual(live);
  });

  it('covers a spread of names and look overrides', () => {
    expect(committed.cases.length).toBeGreaterThanOrEqual(20);
  });
});
