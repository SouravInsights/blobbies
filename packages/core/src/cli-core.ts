/**
 * The testable half of the CLI. No `process.exit`, no global streams — it takes
 * arguments and returns output, so a test can call it directly. `cli.ts` is the
 * thin entry that wires this to the terminal.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { renderAvatarSvg } from './render.js';
import { EXPRESSIONS, EXPRESSION_NAMES, SHAPES } from './parts.js';
import { COLORS } from './palette.js';
import type { AvatarExpression, AvatarOptions, AvatarShape } from './types.js';

export class CliError extends Error {}

const HELP = `blobbies — avatars from a name

Usage
  blobbies render <name> [options]     Print the avatar's SVG
  blobbies expressions                 List the moods
  blobbies shapes                      List the egg shapes
  blobbies palette                     List the built-in colours
  blobbies manifest                    Print the machine-readable manifest

Render options
  --color <hex|name>     Colour, e.g. #6CC8FF or "sky"
  --shape <name>         ${SHAPES.join(', ')}
  --expression <name>    ${EXPRESSIONS.join(', ')}
  --variant <n>          A different body for the same name (default 0)
  --size <n>             Rendered width/height in px (default 48)
  --tilt <n>             Tilt in degrees, -8..8
  --animate <mode>       all | blink | follow (default: static)
  --rounded              Round the corners
  --title                Add an accessible <title>
  --no-blush             Turn blush off
  --out <file>           Write to a file instead of stdout

Examples
  blobbies render "Sourav Nanda" > avatar.svg
  blobbies render "Ira" --expression wink --color sky --animate all
`;

/** Options that never take a value, so the next token is never eaten. */
const BOOLEAN_FLAGS = new Set(['rounded', 'title', 'no-blush', 'animate', 'help', 'h']);

export interface Parsed {
  positional: string[];
  flags: Record<string, string | true>;
}

export function parse(argv: readonly string[]): Parsed {
  const positional: string[] = [];
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string;
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!BOOLEAN_FLAGS.has(key) && next !== undefined && !next.startsWith('--')) {
      flags[key] = next;
      i++;
    } else {
      flags[key] = true;
    }
  }
  return { positional, flags };
}

function fail(message: string): never {
  throw new CliError(message);
}

function stringFlag(flags: Parsed['flags'], key: string): string | undefined {
  const value = flags[key];
  return typeof value === 'string' ? value : undefined;
}

function numberFlag(flags: Parsed['flags'], key: string): number | undefined {
  const value = stringFlag(flags, key);
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) fail(`--${key} expects a number, got "${value}"`);
  return n;
}

/** Turn parsed flags into `AvatarOptions`, validating the enumerable ones. */
export function buildOptions(flags: Parsed['flags']): AvatarOptions {
  const options: AvatarOptions = {};

  const color = stringFlag(flags, 'color');
  if (color !== undefined) options.color = (COLORS as Record<string, string>)[color] ?? color;

  const shape = stringFlag(flags, 'shape');
  if (shape !== undefined) {
    if (!SHAPES.includes(shape as AvatarShape)) fail(`unknown shape "${shape}"`);
    options.shape = shape as AvatarShape;
  }

  const expression = stringFlag(flags, 'expression');
  if (expression !== undefined) {
    if (!EXPRESSIONS.includes(expression as AvatarExpression)) {
      fail(`unknown expression "${expression}"`);
    }
    options.expression = expression as AvatarExpression;
  }

  const variant = numberFlag(flags, 'variant');
  if (variant !== undefined) options.variant = variant;
  const size = numberFlag(flags, 'size');
  if (size !== undefined) options.size = size;
  const tilt = numberFlag(flags, 'tilt');
  if (tilt !== undefined) options.tilt = tilt;

  const animate = flags.animate;
  if (animate === true) options.animate = 'all';
  else if (typeof animate === 'string') options.animate = animate as AvatarOptions['animate'];

  if (flags.rounded) options.rounded = true;
  if (flags.title) options.title = true;
  if (flags['no-blush']) options.blush = false;

  return options;
}

export interface CliResult {
  stdout: string;
  stderr?: string;
}

function list(title: string, items: readonly string[]): string {
  return `${title}\n${items.map((item) => `  ${item}`).join('\n')}\n`;
}

function render(args: readonly string[]): CliResult {
  const { positional, flags } = parse(args);
  const name = positional.join(' ');
  if (!name) fail('render needs a name, e.g. `blobbies render "Sourav Nanda"`');

  const svg = renderAvatarSvg(name, buildOptions(flags));
  const out = stringFlag(flags, 'out');
  if (out) {
    writeFileSync(out, svg, 'utf8');
    return { stdout: '', stderr: `wrote ${out}\n` };
  }
  return { stdout: svg + '\n' };
}

export function runCli(argv: readonly string[]): CliResult {
  const command = argv[0];
  if (!command || command === 'help') {
    return { stdout: HELP };
  }
  switch (command) {
    case 'render':
      return render(argv.slice(1));
    case 'expressions':
      return {
        stdout: list(
          'Expressions',
          EXPRESSIONS.map((key, i) => `${key} — ${EXPRESSION_NAMES[i]}`),
        ),
      };
    case 'shapes':
      return { stdout: list('Shapes', SHAPES) };
    case 'palette':
      return {
        stdout: list(
          'Palette',
          Object.entries(COLORS).map(([name, value]) => `${name} — ${value}`),
        ),
      };
    case 'manifest':
      return {
        stdout: readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'),
      };
    default:
      fail(`unknown command "${command}"`);
  }
}
