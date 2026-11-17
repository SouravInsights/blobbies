#!/usr/bin/env node
/**
 * Run an example.
 *
 *   pnpm example vue
 *
 * Each example is a real app that consumes the packages through the workspace,
 * so it always runs the code in this repo. It is the fastest way to feel
 * whether something is right: the browser tests prove the behaviour matches,
 * and this is where you check whether it feels good.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../..');

const EXAMPLES = {
  react: 'the Avatar and the picker, as a React app uses them',
  vue: 'the same, in Vue',
  svelte: 'the same, in Svelte',
  html: 'one tag, no framework — the web component',
};

const name = process.argv[2];

if (!(name in EXAMPLES)) {
  console.log('\n  Which example?\n');
  for (const [key, what] of Object.entries(EXAMPLES)) {
    console.log(`    pnpm example ${key.padEnd(8)} ${what}`);
  }
  console.log();
  process.exit(name ? 1 : 0);
}

// An example consumes the built packages, because that is what a real app
// consumes — so the first run needs them built. Once, here, where nothing else
// is building: doing it from the example's own `build` script races CI's outer
// build, which rebuilds the same packages while other examples read them.
if (!existsSync(resolve(root, 'packages/core/dist/index.js'))) {
  console.log('\n  Building the packages first — an example imports them, not their source.\n');
  spawnSync('pnpm', ['build:packages'], { stdio: 'inherit', cwd: root });
}

spawn('pnpm', ['--filter', `blobbies-example-${name}`, 'dev'], { stdio: 'inherit' });
