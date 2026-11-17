import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * The three frameworks, compared to each other.
 *
 * The other spec proves the picker *behaves* the same — the same eighteen
 * assertions pass against every project. This proves something stronger and
 * simpler: that the markup each one renders is **identical**, character for
 * character. Three separate suites passing could still hide three pickers that
 * happen to satisfy the same tests; this cannot.
 *
 * It works because the map is not rendered by any framework. `createPicker` in
 * the core builds the same element, fills it with the same avatars, and writes
 * the same positions — React, Vue and Svelte only decide where it goes.
 */

const APPS = [
  ['react', 'http://localhost:5177'],
  ['vue', 'http://localhost:5174'],
  ['svelte', 'http://localhost:5175'],
] as const;

/** The markup that should not depend on the framework in front of it. */
async function capture(page: Page): Promise<Record<string, string>> {
  return {
    map: await page.locator('.bb-picker-surface').evaluate((el) => el.outerHTML),
    surfaceBox: await page
      .locator('.bb-picker-surface')
      .evaluate((el) => `${(el as HTMLElement).style.width} x ${(el as HTMLElement).style.height}`),
    mood: (await page.locator('.bb-picker-mood-name').textContent()) ?? '',
    footer: await page.locator('[data-part="footer"]').evaluate((el) =>
      [...el.querySelectorAll('button')].map((b) => b.textContent?.trim()).join('|'),
    ),
    cells: String(await page.locator('.bb-picker-cell').count()),
  };
}

test('every framework renders the same picker, character for character', async ({ page }) => {
  const captures = new Map<string, Record<string, string>>();

  for (const [name, url] of APPS) {
    await page.goto(url);
    await expect(page.locator('.bb-picker-surface')).toBeVisible();
    // Let the runtime measure and write the first frame before reading the DOM.
    await expect(page.locator('.bb-picker-cell').first()).toBeVisible();
    captures.set(name, await capture(page));
  }

  const [first, ...rest] = [...captures.entries()];
  const [reference, expected] = first as [string, Record<string, string>];

  for (const [name, actual] of rest) {
    for (const [what, value] of Object.entries(expected)) {
      expect(actual[what], `${name}'s ${what} differs from ${reference}'s`).toBe(value);
    }
  }
});

test('and it moves the same way when dragged', async ({ page }) => {
  const after: string[] = [];

  for (const [, url] of APPS) {
    await page.goto(url);
    const box = await page.locator('.bb-picker-surface').boundingBox();
    if (!box) throw new Error('the map has no box');

    // The same gesture, from the same place, in each of them.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();

    // The colour standing on the mark once it settles. If one framework ran a
    // different runtime, this is where it would show.
    const colour = await page
      .locator('.bb-picker-check[data-on]')
      .locator('xpath=..')
      .locator('.bb-blob path')
      .first()
      .getAttribute('fill');
    after.push(colour ?? '');
  }

  expect(after[1], `vue differs from react`).toBe(after[0]);
  expect(after[2], `svelte differs from react`).toBe(after[0]);
});
