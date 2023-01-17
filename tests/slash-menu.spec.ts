import { expect, test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
} from 'utils/actions/misc.js';
import { assertStoreMatchJSX } from 'utils/asserts.js';

test('should slash menu show and hide', async ({ page }) => {
  await enterPlaygroundRoom(page, { enable_slash_menu: true });
  const { paragraphId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('/');
  const slashMenu = page.locator(`.slash-menu`);
  await expect(slashMenu).toBeVisible();

  const box = await slashMenu.boundingBox();
  if (!box) {
    throw new Error("slashMenu doesn't exist");
  }
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

  // Type space should close slash menu
  await focusRichText(page);
  await page.keyboard.type('/');
  await expect(slashMenu).toBeVisible();
  await page.keyboard.type(' ');
  await expect(slashMenu).not.toBeVisible();

  // Type backspace should close slash menu
  await page.keyboard.type('/');
  await expect(slashMenu).toBeVisible();
  await page.keyboard.press('Backspace');
  await expect(slashMenu).not.toBeVisible();

  // Type something not match should close slash menu
  await page.keyboard.type('/');
  await expect(slashMenu).toBeVisible();
  await page.keyboard.type('_');
  await expect(slashMenu).not.toBeVisible();

  // Type slash again should close old slash menu and open new one
  await page.keyboard.type('/');
  await expect(slashMenu).toBeVisible();
  await page.keyboard.type('/');
  await expect(slashMenu).toBeVisible();
  await expect(slashMenu).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(slashMenu).not.toBeVisible();

  // TODO fix snapshot
  // await assertStoreMatchJSX(page, ``, paragraphId);
});
