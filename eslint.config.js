import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import reactHooks from 'eslint-plugin-react-hooks';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Lint, for a library that ships types.
 *
 * `tsc` with `noUnusedLocals` already catches dead imports, and better than a
 * linter does, because it understands types. What it cannot catch is the rest:
 * a hook called conditionally, an `any` that erases a public signature, a
 * `console.log` left in a package, a `type` imported as a value.
 *
 * Only correctness rules are on. Formatting is not linted — a style rule that
 * argues with a formatter is a rule that gets turned off, and then the whole
 * config gets turned off with it.
 */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/dist-ssr/**',
      '**/.svelte-kit/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/*.d.ts',
      // Generated: the capability data, and the svgl marks.
      'packages/core/manifest.json',
      'apps/site/src/logos.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      // TypeScript reports these itself, and with types to hand.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // A library that ships types should not have holes in them.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },

  {
    // Only React files. `react-hooks` cannot tell a Vue composable called
    // `useAvatarPicker` from a React hook, and it has no business guessing.
    files: ['packages/react/**/*.{ts,tsx}', 'packages/react-native/**/*.{ts,tsx}', 'apps/site/**/*.{ts,tsx}', 'examples/with-react/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  ...vue.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['**/*.vue'],
  })),

  ...svelte.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['**/*.svelte'],
  })),
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
    rules: {
      // `let { ...rest } = $props()` is how props are destructured in Svelte 5.
      // They are never reassigned and the rule has no way to know that.
      'prefer-const': 'off',
    },
  },

  {
    // A CLI's output is the whole point of it.
    files: ['**/scripts/**'],
    rules: { 'no-console': 'off' },
  },

  {
    files: ['**/test/**', '**/*.test.*', 'e2e/**'],
    rules: {
      // A test may stub, log and reach for things production code may not.
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
