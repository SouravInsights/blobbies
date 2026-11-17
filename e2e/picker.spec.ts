import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * The picker, in a real browser, against both example apps.
 *
 * Everything here is something jsdom cannot answer: the size of a cell once the
 * panel has a real width, whether the lens actually enlarges the focused face,
 * whether a throw carries, whether a 2px wobble is a tap. The runtime's own
 * tests cover the logic; these cover the thing the logic is for.
 */

/** The centre of the map, which is where the picker opens. */
async function surfaceBox(page: Page) {
  const box = await page.locator('.bb-picker-surface').boundingBox();
  if (!box) throw new Error('the map has no box');
  return box;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.bb-picker')).toBeVisible();
  // The map is appended on mount and measured after; wait for a cell to exist
  // before measuring anything.
  await expect(page.locator('.bb-picker-cell').first()).toBeVisible();
});

test('lays the map out at a real size', async ({ page }) => {
  const cell = page.locator('.bb-picker-cell').first();
  const box = await cell.boundingBox();

  // In jsdom this is 24px, the floor, because there is no layout to measure.
  // A real panel is 460px wide and the cells should be near the ceiling.
  expect(box?.width ?? 0).toBeGreaterThan(40);
  expect(box?.height ?? 0).toBe(box?.width ?? 0);

  // 5x3 visible, plus the one-cell buffer ring on every side.
  await expect(page.locator('.bb-picker-cell')).toHaveCount(7 * 5);
});

test('enlarges the face under the cursor, and holds it still', async ({ page }) => {
  const box = await surfaceBox(page);

  // Nothing is being looked at yet, so every option is at full clarity.
  const opacity = (n: number) =>
    page.locator('.bb-picker-cell').nth(n).evaluate((el) => el.style.opacity);
  expect(await opacity(0)).toBe('1');

  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.25);
  await expect(page.locator('.bb-picker-cell[data-focus]')).toHaveCount(1);

  // The lens holds the focused face and fades the ones moving away — which is
  // a screen-distance calculation, so it only exists where there is a screen.
  expect(Number(await opacity(0))).toBeLessThan(1);
});

test('picks the cell under a tap', async ({ page }) => {
  const box = await surfaceBox(page);
  const before = await page.locator('.bb-picker-mood-name').textContent();

  // The top-left cell of the visible grid, away from the centre the picker opens on.
  await page.mouse.click(box.x + box.width * 0.22, box.y + box.height * 0.26);

  // The mood changed, so the tap landed on a different cell rather than the one
  // already chosen.
  await expect(page.locator('.bb-picker-check[data-on]')).toHaveCount(1);
  const after = await page.locator('.bb-picker-mood-name').textContent();
  expect(after).not.toBe(before);
});

/**
 * The colour of the chosen look.
 *
 * Not the check's *position*: the check marks the cell holding the current
 * value, and with nothing pinned that is always the centre column — the colours
 * wrap underneath it. So a colour drag moves the palette past a fixed mark, and
 * the way to see it is to read the face that is standing on the mark.
 */
async function checkedColour(page: Page): Promise<string | null> {
  return page
    .locator('.bb-picker-check[data-on]')
    .locator('xpath=..')
    .locator('.bb-blob path')
    .first()
    .getAttribute('fill');
}

test('pans the map on a drag, and does not mistake it for a tap', async ({ page }) => {
  const box = await surfaceBox(page);
  const before = await checkedColour(page);
  const startX = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX - 30, y, { steps: 3 });
  // Past the slop, so this is a drag and the map knows it while it happens.
  await expect(page.locator('.bb-picker-surface')).toHaveAttribute('data-dragging', '1');
  await page.mouse.move(startX - 120, y, { steps: 8 });
  await page.mouse.up();

  // The map moved a colour over, so the face standing on the mark is a
  // different one. It did not choose the cell under the finger at lift, which
  // is what a tap would have done.
  await expect.poll(() => checkedColour(page)).not.toBe(before);
});

test('moves the moods on a vertical drag, not the colours', async ({ page }) => {
  const box = await surfaceBox(page);
  const colourBefore = await checkedColour(page);
  const moodBefore = await page.locator('.bb-picker-mood-name').textContent();
  const x = box.x + box.width / 2;

  await page.mouse.move(x, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, box.y + box.height / 2 - 120, { steps: 8 });
  await page.mouse.up();

  // Down the map is mood and across it is colour, so a vertical drag changes the
  // mood and leaves the colour alone. Which axis is which is the whole point of
  // a two-dimensional map, and it is the easiest thing to get backwards.
  await expect.poll(() => page.locator('.bb-picker-mood-name').textContent()).not.toBe(moodBefore);
  expect(await checkedColour(page)).toBe(colourBefore);
});

test('treats a wobble as a tap, not a drag', async ({ page }) => {
  const box = await surfaceBox(page);
  const x = box.x + box.width * 0.22;
  const y = box.y + box.height * 0.26;

  await page.mouse.move(x, y);
  await page.mouse.down();
  // Two pixels. A mouse's slop is 3, so this is still a tap — and the check must
  // land on the cell that was under it at press.
  await page.mouse.move(x + 2, y);
  await page.mouse.up();

  await expect(page.locator('.bb-picker-check[data-on]')).toHaveCount(1);
});

test('keeps the map a whole number of cells across a reload', async ({ page }) => {
  const box = await surfaceBox(page);
  const { x, y } = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 140, y, { steps: 10 });
  await page.mouse.up();

  // A throw keeps going, so the world offset settles back to zero once it comes
  // to rest — which is the runtime folding whole pitches into the origin.
  await expect
    .poll(async () => page.locator('.bb-picker-world').evaluate((el) => el.style.transform))
    .toMatch(/translate3d\(0(?:\.0+)?px, 0(?:\.0+)?px, 0(?:\.0+)?px\)/);

  await page.goto('/');
  await expect(page.locator('.bb-picker-check[data-on]')).toHaveCount(1);
});

test('toggles blush and reports it', async ({ page }) => {
  const blush = page.locator('[data-part="blush"]');
  await expect(blush).toHaveAttribute('aria-pressed', 'true');

  await blush.click();
  await expect(blush).toHaveAttribute('aria-pressed', 'false');

  // Reset comes alive once there is something to reset.
  await expect(page.locator('[data-part="reset"]')).toBeEnabled();
});

test('saves the look it is showing', async ({ page }) => {
  await page.locator('[data-part="blush"]').click();
  await page.locator('[data-part="save"]').click();

  // The example records the save and closes. If the picker reported the wrong
  // value, the header avatar would keep showing the old one.
  await expect(page.locator('.bb-picker')).toHaveCount(0);
  await expect(page.getByText('saved')).toBeVisible();
});
