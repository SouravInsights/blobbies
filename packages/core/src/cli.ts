#!/usr/bin/env node
import { CliError, runCli } from './cli-core.js';

function main(): void {
  try {
    const result = runCli(process.argv.slice(2));
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  } catch (error) {
    if (error instanceof CliError) {
      process.stderr.write(`blobbies: ${error.message}\n\nRun \`blobbies --help\` for usage.\n`);
      process.exit(1);
    }
    throw error;
  }
}

main();
