/**
 * A very small syntax highlighter.
 *
 * Written for the handful of snippets on this page, and for the same reason the
 * glyphs are hand-drawn: a general-purpose highlighter is a large dependency
 * and a theme we would then have to fight into our palette. This is one pass
 * over one alternation, and the classes map straight onto our own colour
 * tokens.
 *
 * The order of the alternatives is the whole design: a comment or a string
 * wins over everything inside it, so `// import 'x'` stays a comment and
 * `'import'` stays a string.
 */

export interface Token {
  text: string;
  /** The class to paint it with, or undefined for plain ink. */
  cls?: 'c' | 's' | 'k' | 'l' | 'n' | 't' | 'f' | 'p';
}

const RULES: ReadonlyArray<readonly [Token['cls'], RegExp]> = [
  // 1. comments
  ['c', /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
  // 2. strings, including a template literal
  ['s', /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/],
  // 3. keywords
  [
    'k',
    /\b(?:import|from|export|default|const|let|var|function|return|new|await|async|if|else|for|of|in|type|interface|as|extends|implements|class|typeof|instanceof|delete|void|yield|throw|try|catch|finally)\b/,
  ],
  // 4. literals
  ['l', /\b(?:true|false|null|undefined|this)\b/],
  // 5. numbers
  ['n', /\b\d[\d_]*(?:\.\d+)?\b/],
  // 6. a type: a capitalised word, or one of the primitives
  ['t', /\b[A-Z][A-Za-z0-9_$]*\b|\b(?:string|number|boolean|object|unknown|never|symbol|bigint)\b/],
  // 7. a lowercase word about to be called
  ['f', /\b[a-z_$][\w$]*(?=\s*\()/],
  // 8. punctuation and operators
  ['p', /[{}()[\];,.:=<>+\-*/!?|&]+/],
];

const TOKEN = new RegExp(RULES.map(([, re]) => `(${re.source})`).join('|'), 'g');

export function highlight(code: string): Token[] {
  const out: Token[] = [];
  let at = 0;
  TOKEN.lastIndex = 0;

  for (let match = TOKEN.exec(code); match; match = TOKEN.exec(code)) {
    if (match.index > at) out.push({ text: code.slice(at, match.index) });
    // Exactly one group is populated per match, and the group index is the
    // rule index, so the class comes straight off the table.
    const which = match.findIndex((g, i) => i > 0 && g !== undefined) - 1;
    out.push({ text: match[0], cls: RULES[which]?.[0] });
    at = match.index + match[0].length;
  }

  if (at < code.length) out.push({ text: code.slice(at) });
  return out;
}

/** A command line: the tool and its subcommand, then flags, then packages. */
const TOOLS = new Set(['npm', 'pnpm', 'npx', 'yarn', 'bun', 'node', 'tsx']);
const SUBS = new Set(['i', 'install', 'add', 'create', 'run', 'exec', 'dlx', 'init', 'test', 'build']);

export function highlightShell(code: string): Token[] {
  const out: Token[] = [];
  let at = 0;

  for (const match of code.matchAll(/\S+/g)) {
    const start = match.index;
    if (start > at) out.push({ text: code.slice(at, start) });
    const word = match[0];
    const cls: Token['cls'] = TOOLS.has(word) || SUBS.has(word) ? 'k' : word.startsWith('-') ? 'l' : 't';
    out.push({ text: word, cls });
    at = start + word.length;
  }

  if (at < code.length) out.push({ text: code.slice(at) });
  return out;
}
