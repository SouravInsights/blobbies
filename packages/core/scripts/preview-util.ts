import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Repo-root apps/demo/preview directory. */
export const PREVIEW_DIR = resolve(here, '../../../apps/demo/preview');

export function writePreview(fileName: string, html: string): string {
  mkdirSync(PREVIEW_DIR, { recursive: true });
  const out = resolve(PREVIEW_DIR, fileName);
  writeFileSync(out, html, 'utf8');
  return out;
}

export function page(title: string, body: string, extraCss = ''): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background: #0e0e0e; color: #eee; }
  h1 { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
  p.sub { color: #888; margin: 0 0 24px; font-size: 13px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #999; margin: 32px 0 12px; }
  .grid { display: grid; gap: 14px; }
  .cell { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .cell small { color: #777; font-size: 10px; }
  .light { background: #f5f5f5; padding: 20px; border-radius: 12px; }
  ${extraCss}
</style>
</head>
<body>
${body}
</body>
</html>`;
}
