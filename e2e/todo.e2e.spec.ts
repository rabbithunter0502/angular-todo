import { expect, test } from '@playwright/test';

/**
 * Runs against the production bundle (see `playwright.config.ts`). Each test gets a fresh
 * browser context — no shared `localStorage` — so `resource()`'s seed data (3 todos, the first
 * already `completed: true`) is exactly what's on screen at the start of every test.
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // The seed resource() has ~500ms of simulated latency; wait for it to actually land instead of
  // a fixed timeout, so this isn't flaky on a slower CI runner.
  await expect(page.locator('.row')).toHaveCount(3, { timeout: 5_000 });
});

test('resource() hydrates the seed list without a spurious completion toast', async ({ page }) => {
  await expect(page.locator('.toast')).toHaveCount(0);
  await expect(page.locator('.summary')).toContainText('1 đã xong');
  await expect(page.locator('.summary')).toContainText('3 tổng cộng');
});

test('addTodo() appends and computed() stats update in the same paint', async ({ page }) => {
  await page.locator('.add-input').fill('Việc mới từ Playwright');
  await page.locator('.add-button').click();

  await expect(page.locator('.row')).toHaveCount(4);
  await expect(page.locator('.summary')).toContainText('4 tổng cộng');
});

test('toggling an active todo fires the toast, which clears itself', async ({ page }) => {
  // Row 1 ("Viết TodoStore…") starts incomplete — row 0 is already done from the seed.
  await page.locator('.row').nth(1).locator('input[type=checkbox]').click();

  await expect(page.locator('.toast')).toHaveText('✔ Đã hoàn tất một việc!');
  await expect(page.locator('.toast')).toHaveCount(0, { timeout: 3_000 });
});

test('re-toggling the same todo fires the toast again each time', async ({ page }) => {
  const checkbox = page.locator('.row').nth(1).locator('input[type=checkbox]');

  await checkbox.click(); // complete
  await expect(page.locator('.toast')).toHaveCount(1);
  await checkbox.click(); // undo — no toast for un-completing
  await expect(page.locator('.toast')).toHaveCount(0, { timeout: 3_000 });
  await checkbox.click(); // complete again — must notify again, not be swallowed as "unchanged"
  await expect(page.locator('.toast')).toHaveCount(1);
});

test('linkedSignal draft: editable while active, discarded on Escape', async ({ page }) => {
  const title = page.locator('.title').nth(1);
  const original = await title.textContent();

  await title.dblclick();
  await page.locator('.edit-input').fill('Tên nháp sẽ bị huỷ');
  await page.keyboard.press('Escape');

  await expect(page.locator('.title').nth(1)).toHaveText(original ?? '');
});

test('linkedSignal draft: committed edit persists and exits edit mode', async ({ page }) => {
  await page.locator('.title').nth(1).dblclick();
  await page.locator('.edit-input').fill('Đổi tên qua linkedSignal');
  await page.keyboard.press('Enter');

  await expect(page.locator('.edit-input')).toHaveCount(0);
  await expect(page.locator('.title').nth(1)).toHaveText('Đổi tên qua linkedSignal');
});

test('filtering to "Hoàn tất" only shows completed todos', async ({ page }) => {
  await page.locator('.filter-button').nth(2).click(); // "Hoàn tất"

  const rows = page.locator('.row');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toHaveClass(/completed/);
});

test('clearCompleted removes every completed todo', async ({ page }) => {
  await page.locator('.clear-button').click();

  await expect(page.locator('.row.completed')).toHaveCount(0);
  await expect(page.locator('.row')).toHaveCount(2);
});
