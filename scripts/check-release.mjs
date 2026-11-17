#!/usr/bin/env node
/**
 * Install what would be published, then use it.
 *
 * Every other check in this repo resolves through the workspace, and the
 * workspace has one of everything — one `blobbies`, one `@blobbies/vue`, all at
 * whatever version the source says. That is why none of them caught the day
 * `@blobbies/vue` shipped importing `createPicker` from a version of `blobbies`
 * that had never heard of it: there is no version skew in a workspace, and a
 * version skew is the only way that bug exists.
 *
 * So this packs the real tarballs, installs them into an empty project with
 * npm, and exercises the public API of each. It is slower than everything else
 * here and it is the only one that can see the class of bug that actually
 * reaches a user.
 *
 *   pnpm check:release
 *
 * `@blobbies/react-native` is left out because its peers are a 200MB native
 * toolchain, and it is checked by hand before it is published instead. Every
 * package that can be installed cheaply is in.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../..');

/** Directory name under `packages/`, and the name it publishes as. */
const PACKAGES = [
  ['core', 'blobbies'],
  ['react', '@blobbies/react'],
  ['vue', '@blobbies/vue'],
  ['svelte', '@blobbies/svelte'],
  ['element', '@blobbies/element'],
];

/** Peers come from the registry, because a tarball has none of its own. */
const PEERS = {
  '@blobbies/react': 'react react-dom',
  '@blobbies/vue': 'vue',
  '@blobbies/svelte': 'svelte',
};

/**
 * The public API, exercised.
 *
 * Not a smoke test for its own sake: each of these has been missing at least
 * once, or been asked for from a version that did not have it.
 */
const CHECKS = `
// A web component needs a document to define itself in, and a check that skips
// one of the packages is a check with a hole in it.
const { JSDOM } = await import('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.customElements = dom.window.customElements;

const fail = [];
const ok = [];
const check = (what, cond) => (cond ? ok : fail).push(what);

const core = await import('blobbies');
check('blobbies exports renderAvatarSvg', typeof core.renderAvatarSvg === 'function');
check('blobbies renders', core.renderAvatarSvg('Ira').startsWith('<svg'));

// The one that got out. The picker runtime lives on a subpath, and a subpath is
// easy to add in source and forget in a dependency range.
const picker = await import('blobbies/picker');
check('blobbies/picker exports createPicker', typeof picker.createPicker === 'function');
check('blobbies/picker exports staticSnapshot', typeof picker.staticSnapshot === 'function');
check('blobbies/picker exports injectPickerStyles', typeof picker.injectPickerStyles === 'function');

const react = await import('@blobbies/react');
check('@blobbies/react exports Avatar', typeof react.Avatar === 'function');
check('@blobbies/react exports AvatarPicker', typeof react.AvatarPicker === 'function');

const vue = await import('@blobbies/vue');
check('@blobbies/vue exports Avatar', typeof vue.Avatar === 'object' || typeof vue.Avatar === 'function');
check('@blobbies/vue exports AvatarPicker', vue.AvatarPicker !== undefined);
check('@blobbies/vue exports useAvatarPicker', typeof vue.useAvatarPicker === 'function');

const element = await import('@blobbies/element');
check('@blobbies/element exports TAG_NAME', element.TAG_NAME === 'blobbies-avatar');
check('@blobbies/element registers itself', customElements.get('blobbies-avatar') !== undefined);
// A custom element renders in its connectedCallback, so it has to be in a
// document before it has anything to show.
const avatar = element.createAvatarElement('Ira');
document.body.append(avatar);
check('@blobbies/element renders', avatar.innerHTML.startsWith('<svg'));
check(
  '@blobbies/element defaults to 48',
  avatar.querySelector('svg')?.getAttribute('width') === '48',
);
avatar.size = 96;
check('@blobbies/element reflects a property', avatar.querySelector('svg')?.getAttribute('width') === '96');

// Every specifier every package reaches for, resolved against the core that
// would actually be installed beside it. This is the half that does not need a
// bundler, and so it covers the Svelte package too — whose component Node
// cannot read, but whose imports this can.
for (const spec of JSON.parse(process.env.BLOBBLIES_SPECIFIERS)) {
  try {
    await import(spec);
    check(spec + ' resolves', true);
  } catch (error) {
    check(spec + ' resolves — ' + (error?.message ?? error), false);
  }
}

for (const line of ok) console.log('  ✓ ' + line);
for (const line of fail) console.log('  ✗ ' + line);
if (fail.length) process.exit(1);
`;

/** Every `blobbies` specifier any published file reaches for. */
async function collectSpecifiers(from) {
  const found = new Set();
  const pattern = /(?:from|require\()\s*['"](blobbies[^'"]*)['"]/g;

  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/\.(?:js|cjs|mjs|svelte)$/.test(entry.name)) {
        for (const match of (await readFile(path, 'utf8')).matchAll(pattern)) {
          found.add(match[1]);
        }
      }
    }
  }

  await walk(join(from, 'node_modules', 'blobbies'));
  await walk(join(from, 'node_modules', '@blobbies'));
  return [...found].sort();
}

const dir = mkdtempSync(join(tmpdir(), 'blobbies-release-'));
let failed = false;

try {
  console.log(`\npacking into ${dir}\n`);

  for (const [folder] of PACKAGES) {
    execFileSync('pnpm', ['pack', '--pack-destination', dir], {
      cwd: join(root, 'packages', folder),
      stdio: 'pipe',
    });
  }

  const tarballs = readdirSync(dir).filter((name) => name.endsWith('.tgz'));
  if (tarballs.length !== PACKAGES.length) {
    throw new Error(`packed ${tarballs.length} of ${PACKAGES.length} packages`);
  }

  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: 'release-check', private: true, type: 'module' }, null, 2),
  );

  // jsdom is the check's own dependency, not a peer of anything.
  const peers = [...Object.values(PEERS).join(' ').split(' '), 'jsdom'];
  console.log(`installing ${tarballs.length} packages and ${peers.length} peers\n`);

  execFileSync('npm', ['install', '--no-audit', '--no-fund', ...tarballs, ...peers], {
    cwd: dir,
    stdio: 'pipe',
  });

  const specifiers = await collectSpecifiers(dir);
  execFileSync('node', ['--input-type=module', '-e', CHECKS], {
    cwd: dir,
    stdio: 'inherit',
    env: { ...process.env, BLOBBLIES_SPECIFIERS: JSON.stringify(specifiers) },
  });
} catch (error) {
  failed = true;
  // npm's own output is the useful part when an install goes wrong, and it is
  // all captured, so print it rather than a stack trace.
  const detail = error instanceof Error ? error.message : String(error);
  // A failed child has already printed why; a failed install has not.
  if (!detail.startsWith('Command failed: node')) console.error(`\n${detail}\n`);
  const stderr = error?.stderr?.toString().trim();
  if (stderr) console.error(stderr.split('\n').slice(-25).join('\n'));
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log();
if (failed) {
  console.error('the packages that would be published do not work\n');
  process.exit(1);
}
console.log('every published package installs and works\n');
