import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CONTRACT_VERSION } from '../src/contract.js';
import { buildManifest } from '../scripts/export-manifest.js';

/**
 * `manifest.json` is what a non-JavaScript port or an AI agent reads to know
 * what Blobbies can do. This test regenerates it and compares, so it can never
 * drift from the code it describes.
 */
const MANIFEST_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../manifest.json');

describe('capability manifest', () => {
  const committed = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as {
    contract: number;
    shapes: unknown[];
    expressions: unknown[];
    palette: unknown[];
  };
  const live = buildManifest();

  it('matches the live engine', () => {
    expect(committed).toEqual(live);
  });

  it('records the current contract version', () => {
    expect(committed.contract).toBe(CONTRACT_VERSION);
  });

  it('lists every shape, expression and colour', () => {
    expect(committed.shapes).toHaveLength(5);
    expect(committed.expressions).toHaveLength(22);
    expect(committed.palette).toHaveLength(9);
  });
});
