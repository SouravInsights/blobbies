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
import { spawn } from 'node:child_process';

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

spawn('pnpm', ['--filter', `blobbies-example-${name}`, 'dev'], { stdio: 'inherit' });
