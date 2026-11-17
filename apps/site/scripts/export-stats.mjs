#!/usr/bin/env node
/**
 * The numbers the landing page quotes about what we ship: each package's
 * version and gzipped size, how big one avatar is, and how many faces the
 * engine can draw. Measured rather than typed.
 *
 * Sizes, counts and versions are the things on that page that go stale, and
 * every one of them has gone stale at least once: Vue's size after the picker
 * landed, React's after it left, the brand version twice, a conformance fixture
 * after a version bump. They are all derivable, so they should be derived.
 *
 * This writes `src/stats.json` from the built packages.
 *
 *   pnpm --filter blobbies-site export:stats          # write
 *   pnpm --filter blobbies-site export:stats --check  # is it still true?
 *
 * `--check` is what CI runs, and it compares two kinds of number differently,
 * because they are two different kinds of thing. Versions and counts are exact
 * and are compared exactly. Sizes are not: gzip's output moves by a few bytes
 * between zlib versions, and the same file measured on Node 20 and Node 23
 * differs enough to change the rounded figure. So a size is allowed a tenth and
 * a version is not allowed anything.
 *
 * Run `pnpm build:packages` first: a size is a fact about the built artefact,
 * and an unbuilt package has no size to measure.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const here = resolve(fileURLToPath(import.meta.url), '..');
const repo = resolve(here, '../../..');

const PUBLISHED = ['core', 'react', 'vue', 'svelte', 'element', 'react-native'];

function gzipSize(path) {
  return gzipSync(readFileSync(path)).length;
}

function packageJson(folder) {
  return JSON.parse(readFileSync(join(repo, 'packages', folder, 'package.json'), 'utf8'));
}

/*
 * Svelte ships its components as source, so the package has no single entry to
 * measure. What a consumer pays is the compiled components, which is the thing
 * a reader is actually deciding about.
 */
async function svelteSize() {
  const { compile } = await import('svelte/compiler');
  const dist = join(repo, 'packages/svelte/dist');
  let total = 0;
  for (const file of ['Avatar.svelte', 'AvatarPicker.svelte']) {
    const out = compile(readFileSync(join(dist, file), 'utf8'), {
      generate: 'client',
      dev: false,
      runes: true,
      filename: file,
      css: 'injected',
    });
    total += gzipSync(Buffer.from(out.js.code)).length;
  }
  return total;
}

async function main() {
  const manifest = JSON.parse(readFileSync(join(repo, 'packages/core/manifest.json'), 'utf8'));

  // A size is a fact about the built artefact. Say so rather than writing a
  // number that is quietly about nothing.
  const missing = PUBLISHED.filter(
    (folder) => folder !== 'svelte' && !existsSync(join(repo, 'packages', folder, 'dist/index.js')),
  );
  if (missing.length) {
    console.error(`\n  Not built: ${missing.join(', ')}. Run \`pnpm build:packages\` first.\n`);
    process.exit(1);
  }

  const packages = {};
  for (const folder of PUBLISHED) {
    const meta = packageJson(folder);
    packages[meta.name] = {
      version: meta.version,
      gzip: folder === 'svelte' ? await svelteSize() : gzipSize(join(repo, 'packages', folder, 'dist/index.js')),
    };
  }

  // One avatar, gzipped — the number the hero quotes. Measured through the
  // published entry point, because that is what a reader will actually send.
  const core = await import(join(repo, 'packages/core/dist/index.js'));
  const sample = ['Ira', 'Sourav Nanda', 'Ada Lovelace', 'Zoe', 'Maya Chen'].map((name) =>
    gzipSync(Buffer.from(core.renderAvatarSvg(name))).length,
  );
  const avatarGzip = Math.round(sample.reduce((sum, n) => sum + n, 0) / sample.length);

  const eyePairs = Object.keys(manifest.letters).length ** 2;
  // Two blush states and four nudges per combination, which is what the page
  // has always claimed. `palette` is the list of colours, hence the `.length`.
  const palette = manifest.palette.length;
  const builds = palette * manifest.shapes.length * manifest.expressions.length * 2 * 4;

  const stats = {
    // Generated. Do not edit — run `pnpm --filter blobbies-site export:stats`.
    engine: {
      version: packages['blobbies'].version,
      contract: manifest.contract,
      shapes: manifest.shapes.length,
      expressions: manifest.expressions.length,
      palette: manifest.palette.length,
      letters: Object.keys(manifest.letters).length,
      builds,
      total: builds * eyePairs,
      avatarGzip,
    },
    packages,
  };

  const file = join(here, '../src/stats.json');

  if (process.argv.includes('--check')) {
    process.exit(check(stats, JSON.parse(readFileSync(file, 'utf8'))) ? 0 : 1);
  }

  writeFileSync(file, `${JSON.stringify(stats, null, 2)}\n`);
  console.log('wrote src/stats.json');
  for (const [name, info] of Object.entries(packages)) {
    console.log(`  ${name.padEnd(26)} ${info.version.padEnd(8)} ${(info.gzip / 1024).toFixed(1)} kB gz`);
  }
  console.log(`  ${'one avatar'.padEnd(26)} ${''.padEnd(8)} ${(avatarGzip / 1024).toFixed(1)} kB gz`);
  console.log(`  ${'the engine draws'.padEnd(26)} ${String(stats.engine.total).padEnd(8)} faces`);
}

/** A tenth either way, because a compressed size is not a fact about our code. */
const TOLERANCE = 0.1;

function check(fresh, committed) {
  const worse = [];
  const exact = (what, a, b) => {
    if (a !== b) worse.push(`${what}: page says ${b}, source says ${a}`);
  };
  const approx = (what, a, b) => {
    if (b === undefined || Math.abs(a - b) > Math.max(a, b) * TOLERANCE) {
      worse.push(`${what}: page says ${b}, source says ${a}`);
    }
  };

  for (const key of ['version', 'contract', 'shapes', 'expressions', 'palette', 'letters', 'builds', 'total']) {
    exact(`engine.${key}`, fresh.engine[key], committed.engine[key]);
  }
  approx('one avatar, in bytes', fresh.engine.avatarGzip, committed.engine.avatarGzip);

  for (const [name, info] of Object.entries(fresh.packages)) {
    exact(`${name}'s version`, info.version, committed.packages[name]?.version);
    approx(`${name}'s size`, info.gzip, committed.packages[name]?.gzip);
  }

  if (worse.length === 0) {
    console.log('\n  the page\'s numbers match the packages\n');
    return true;
  }
  console.error('\n  The page quotes numbers the packages no longer support:\n');
  for (const line of worse) console.error(`    ${line}`);
  console.error('\n  Run: pnpm --filter blobbies-site export:stats\n');
  return false;
}

await main();
