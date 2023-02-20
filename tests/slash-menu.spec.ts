import { expect, Locator, Page } from '@playwright/test';
import {
  pressEnter,
  SHORT_KEY,
  type,
  withPressKey,
} from 'utils/actions/keyboard.js';
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

import { test } from './utils/playwright.js';

test.describe('slash menu should show and hide correctly', () => {
  // See https://playwright.dev/docs/test-retries#reuse-single-page-between-tests
  test.describe.configure({ mode: 'serial' });
  let page: Page;
  let paragraphId: string;
  let slashMenu: Locator;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await enterPlaygroundRoom(page);
    const id = await initEmptyParagraphState(page);
    paragraphId = id.paragraphId;
    slashMenu = page.locator(`.slash-menu`);
  });

  test.beforeEach(async () => {
    await focusRichText(page);
    await type(page, '/');
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
    await type(page, ' ');
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
    await type(page, '_');
    await expect(slashMenu).not.toBeVisible();
    await assertRichTexts(page, ['/_']);

    // And pressing backspace immediately should reappear the slash menu
    await page.keyboard.press('Backspace');
    await expect(slashMenu).toBeVisible();

    await type(page, '__');
    await page.keyboard.press('Backspace');
    await expect(slashMenu).not.toBeVisible();
  });

  test('pressing the slash key again should close the old slash menu and open new one', async () => {
    await type(page, '/');
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

  test('should slash menu position correct', async () => {
    const box = await slashMenu.boundingBox();
    if (!box) {
      throw new Error("slashMenu doesn't exist");
    }
    const { x, y } = box;
    assertAlmostEqual(x, 95, 6);
    assertAlmostEqual(y, 180, 6);
  });

  test('left arrow should active left panel', async () => {
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowRight');
    await expect(slashMenu).toBeVisible();

    const slashItems = slashMenu.locator('format-bar-button');
    const activatedItem = slashItems.nth(-3);
    await expect(activatedItem).toHaveText(['Copy']);
    await expect(activatedItem).toHaveAttribute('hover', '');
    await assertRichTexts(page, ['/']);
  });

  test('press tab should move up and down', async () => {
    await page.keyboard.press('Tab');
    await expect(slashMenu).toBeVisible();

    const slashItems = slashMenu.locator('format-bar-button');
    const slashItem0 = slashItems.nth(0);
    const slashItem1 = slashItems.nth(1);
    await expect(slashItem0).not.toHaveAttribute('hover', '');
    await expect(slashItem1).toHaveAttribute('hover', '');

    await assertRichTexts(page, ['/']);
    await withPressKey(page, 'Shift', () => page.keyboard.press('Tab'));
    await expect(slashMenu).toBeVisible();
    await expect(slashItem0).toHaveAttribute('hover', '');
    await expect(slashItem1).not.toHaveAttribute('hover', '');
  });

  test('can input search input after click menu', async () => {
    const box = await slashMenu.boundingBox();
    if (!box) {
      throw new Error("slashMenu doesn't exist");
    }
    const { x, y, height } = box;
    await page.mouse.click(x + 10, y + height - 10);
    await type(page, 'a');
    await assertRichTexts(page, ['/a']);
  });
});

test('should slash menu search and keyboard works', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  const slashMenu = page.locator(`.slash-menu`);
  const slashItems = slashMenu.locator('format-bar-button');

  await type(page, '/');
  await expect(slashMenu).toBeVisible();
  // Update the snapshot if you add new slash commands
  await expect(slashItems).toHaveCount(21);
  await type(page, 'todo');
  await expect(slashItems).toHaveCount(1);
  await expect(slashItems).toHaveText(['To-do List']);
  await page.keyboard.press('Enter');
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
  <affine:list
    prop:checked={false}
    prop:type="todo"
  />
</affine:frame>`,
    frameId
  );

  await type(page, '/');
  await expect(slashMenu).toBeVisible();
  // first item should be selected by default
  await expect(slashItems.first()).toHaveAttribute('hover', '');

  // assert keyboard navigation works
  await page.keyboard.press('ArrowDown');
  await expect(slashItems.first()).not.toHaveAttribute('hover', '');
  await expect(slashItems.nth(1)).toHaveAttribute('hover', '');

  // search should reset the active item
  await type(page, 'co');
  await expect(slashItems).toHaveCount(2);
  await expect(slashItems).toHaveText(['Code Block', 'Copy']);
  await expect(slashItems.first()).toHaveAttribute('hover', '');
  await type(page, 'p');
  await expect(slashItems).toHaveCount(1);
  // assert backspace works
  await page.keyboard.press('Backspace');
  await expect(slashItems).toHaveCount(2);
});

// https://github.com/toeverything/blocksuite/issues/1126
test('should clean slash string after soft enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { paragraphId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await page.keyboard.press('Shift+Enter');
  await type(page, '/copy');
  await pressEnter(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:paragraph
  prop:text="hello\n"
  prop:type="text"
/>`,
    paragraphId
  );
});
