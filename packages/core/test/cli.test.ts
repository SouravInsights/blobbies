import { describe, expect, it } from 'vitest';
import { CliError, buildOptions, parse, runCli } from '../src/cli-core.js';

describe('blobbies cli', () => {
  it('renders an svg for a name', () => {
    const { stdout } = runCli(['render', 'Sourav Nanda']);
    expect(stdout.startsWith('<svg')).toBe(true);
    expect(stdout).toContain('aria-label="Sourav Nanda"');
  });

  it('maps flags onto avatar options', () => {
    const { flags } = parse([
      'render',
      'Ira',
      '--expression',
      'wink',
      '--color',
      'sky',
      '--size',
      '64',
      '--no-blush',
    ]);
    const options = buildOptions(flags);
    expect(options.expression).toBe('wink');
    expect(options.color).toBe('#6CC8FF');
    expect(options.size).toBe(64);
    expect(options.blush).toBe(false);
  });

  it('rejects an unknown shape with a usage error', () => {
    expect(() => buildOptions({ shape: 'triangle' })).toThrow(CliError);
  });

  it('lists its capabilities', () => {
    expect(runCli(['shapes']).stdout).toContain('tall');
    expect(runCli(['expressions']).stdout).toContain('smile');
    expect(runCli(['palette']).stdout).toContain('#FFD43B');
  });

  it('prints the manifest that ships with the package', () => {
    const manifest = JSON.parse(runCli(['manifest']).stdout) as { engine: string };
    expect(manifest.engine).toBe('blobbies');
  });
});
