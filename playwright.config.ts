import { defineConfig, devices } from '@playwright/test';

/**
 * The picker, in a real browser.
 *
 * The runtime's tests run in jsdom, which has no layout: `gridMetrics` floors to
 * its minimums, `getBoundingClientRect` has to be stubbed, and the cell widths
 * the tests see are nothing like the cell widths anyone using the picker sees.
 * They prove the logic and they prove nothing about the feel.
 *
 * That is the wrong instrument for a control whose whole value is physical —
 * drag, momentum, lens, touch slop — and it is the one thing the libraries that
 * do this well make plain: Sonner tests with Playwright, not jsdom.
 *
 * So this runs against the two example apps, in Chromium, with real pointer
 * events and real geometry. One spec, two projects: if the picker behaves the
 * same in Vue and Svelte, that is not an assertion, it is the same file passing
 * twice.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm --filter blobbies-example-vue dev',
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
      cwd: '.',
    },
    {
      command: 'pnpm --filter blobbies-example-svelte dev',
      url: 'http://localhost:5175',
      reuseExistingServer: !process.env.CI,
      cwd: '.',
    },
  ],
  projects: [
    {
      name: 'vue',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5174' },
    },
    {
      name: 'svelte',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5175' },
    },
    // WebKit as well as Chromium, because pointer capture is the one thing here
    // that engines genuinely disagree about, and it is load-bearing: it is what
    // keeps a drag owned by one finger when a second one touches down.
    {
      name: 'vue-webkit',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Safari'], baseURL: 'http://localhost:5174' },
    },
    {
      name: 'svelte-webkit',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Safari'], baseURL: 'http://localhost:5175' },
    },
  ],
});
