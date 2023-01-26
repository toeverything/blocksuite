import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { SHORT_KEY } from 'utils/actions/keyboard.js';
import {
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
} from 'utils/actions/misc.js';
import {
  assertAlmostEqual,
  assertRichTexts,
  assertStoreMatchJSX,
} from 'utils/asserts.js';

test.describe('slash menu should show and hide correctly', () => {
  // See https://playwright.dev/docs/test-retries#reuse-single-page-between-tests
  test.describe.configure({ mode: 'serial' });
  let page: Page;
  let paragraphId: string;
  let slashMenu: Locator;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await enterPlaygroundRoom(page, { enable_slash_menu: true });
    const id = await initEmptyParagraphState(page);
    paragraphId = id.paragraphId;
    slashMenu = page.locator(`.slash-menu`);
  });

  test.beforeEach(async () => {
    await focusRichText(page);
    await page.keyboard.type('/');
    await expect(slashMenu).toBeVisible();
  });

  test.afterEach(async () => {
    // Close the slash menu
    if (await slashMenu.isVisible()) {
      // Click outside
      await page.mouse.click(0, 50);
    }
    await focusRichText(page);
    // Clear input
    await page.keyboard.press(`${SHORT_KEY}+Backspace`);
  });

  test('slash menu should hide after click away', async () => {
    // Click outside should close slash menu
    await page.mouse.click(0, 50);
    await expect(slashMenu).not.toBeVisible();
    await assertStoreMatchJSX(
      page,
      `
<affine:paragraph
  prop:text="/"
  prop:type="text"
/>`,
      paragraphId
    );
  });

  test('slash menu should hide after input whitespace', async () => {
    await page.keyboard.type(' ');
    await expect(slashMenu).not.toBeVisible();
    await assertRichTexts(page, ['/ ']);
  });

  test('delete the slash symbol should close the slash menu', async () => {
    await page.keyboard.press('Backspace');
    await expect(slashMenu).not.toBeVisible();
    await assertStoreMatchJSX(
      page,
      `
<affine:paragraph
  prop:type="text"
/>`,
      paragraphId
    );
  });

  test('typing something that does not match should close the slash menu', async () => {
    await page.keyboard.type('_');
    await expect(slashMenu).not.toBeVisible();
    await assertRichTexts(page, ['/_']);
  });

  test('pressing the slash key again should close the old slash menu and open new one', async () => {
    await page.keyboard.type('/');
    await expect(slashMenu).toBeVisible();
    await expect(slashMenu).toHaveCount(1);
    await assertRichTexts(page, ['//']);
  });

  test('pressing esc should close the slash menu', async () => {
    // You may need to press Esc twice in a real browser
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(slashMenu).not.toBeVisible();
    await assertRichTexts(page, ['/']);
  });

  test('left arrow should close the slash menu', async () => {
    await page.keyboard.press('ArrowLeft');
    await expect(slashMenu).not.toBeVisible();
    await assertRichTexts(page, ['/']);
  });

  test('right arrow should close the slash menu', async () => {
    await page.keyboard.press('ArrowRight');
    await expect(slashMenu).not.toBeVisible();
    await assertRichTexts(page, ['/']);
  });

  test('should slash menu position correct', async () => {
    const box = await slashMenu.boundingBox();
    if (!box) {
      throw new Error("slashMenu doesn't exist");
    }
    const { x, y } = box;
    assertAlmostEqual(x, 122, 10);
    assertAlmostEqual(y, 180, 10);
  });
});

test('should slash menu search and keyboard works', async ({ page }) => {
  await enterPlaygroundRoom(page, { enable_slash_menu: true });
  const { frameId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  const slashMenu = page.locator(`.slash-menu`);
  const slashItems = slashMenu.locator('format-bar-button');

  await page.keyboard.type('/');
  await expect(slashMenu).toBeVisible();
  // Update the snapshot if you add new slash commands
  await expect(slashItems).toHaveCount(12);
  await page.keyboard.type('todo');
  await expect(slashItems).toHaveCount(1);
  await expect(slashItems).toHaveText(['To-do List']);
  await page.keyboard.press('Enter');
  await assertStoreMatchJSX(
    page,
    `
<affine:frame
  prop:xywh="[0,0,720,32]"
>
  <affine:list
    prop:checked={false}
    prop:type="todo"
  />
</affine:frame>`,
    frameId
  );

  await page.keyboard.type('/');
  await expect(slashMenu).toBeVisible();
  // first item should be selected by default
  await expect(slashItems.first()).toHaveAttribute('hover', '');

  // assert keyboard navigation works
  await page.keyboard.press('ArrowDown');
  await expect(slashItems.first()).not.toHaveAttribute('hover', '');
  await expect(slashItems.nth(1)).toHaveAttribute('hover', '');

  // search should reset the active item
  await page.keyboard.type('od');
  await expect(slashItems).toHaveCount(2);
  await expect(slashItems).toHaveText(['To-do List', 'Code Block']);
  await expect(slashItems.first()).toHaveAttribute('hover', '');
  await page.keyboard.type('o');
  await expect(slashItems).toHaveCount(1);
  // assert backspace works
  await page.keyboard.press('Backspace');
  await expect(slashItems).toHaveCount(2);
});
