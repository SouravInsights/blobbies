/**
 * Export the machine-readable capability manifest.
 *
 * This is the file a non-JavaScript port (Swift, Kotlin, Dart) and an AI agent
 * read to know exactly what Blobbies can do — every shape, every expression,
 * every colour, the layout constants and the contract version — without reading
 * the TypeScript source.
 *
 * It is generated from the same constants the renderer uses, and a test
 * regenerates and compares it, so it can never quietly fall out of date.
 *
 * Run `pnpm export:manifest` from `packages/core` after changing any authored
 * data, then commit the regenerated file.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTRACT_VERSION } from '../src/contract.js';
import { BLUSH_COLOR, BLUSH_OPACITY, COLORS, BACKDROP_COLOR, INK_COLOR } from '../src/palette.js';
import {
  EXPRESSION_DEFS,
  EXPRESSIONS,
  LAYOUT,
  SHAPES,
  SHAPE_GEOMETRY,
} from '../src/parts.js';
import { INK_WIDTH, LETTER_BOX, LETTER_PATHS, STROKE_WIDTH } from '../src/letters.js';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../manifest.json');

export function buildManifest(): Record<string, unknown> {
  const pkg = JSON.parse(readFileSync(resolve(here, '../package.json'), 'utf8')) as {
    version: string;
  };

  return {
    engine: 'blobbies',
    version: pkg.version,
    contract: CONTRACT_VERSION,
    viewBox: '0 0 100 100',
    colors: {
      backdrop: BACKDROP_COLOR,
      ink: INK_COLOR,
      blush: BLUSH_COLOR,
      blushOpacity: BLUSH_OPACITY,
    },
    palette: Object.entries(COLORS).map(([name, value]) => ({ name, value })),
    letters: LETTER_PATHS,
    letterBox: LETTER_BOX,
    strokeWidth: STROKE_WIDTH,
    inkWidth: INK_WIDTH,
    shapes: SHAPES.map((name, i) => {
      const geometry = SHAPE_GEOMETRY[i];
      return { name, ...geometry };
    }),
    expressions: EXPRESSIONS.map((key, i) => {
      const def = EXPRESSION_DEFS[i];
      return { key, name: def?.name, mouth: def?.mouth, brow: def?.brow, ...(def?.eye ? { eye: def.eye } : {}), ...(def?.squint ? { squint: def.squint } : {}) };
    }),
    layout: LAYOUT,
  };
}

function main(): void {
  const manifest = buildManifest();
  writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  process.stdout.write(`wrote manifest → ${OUT}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
