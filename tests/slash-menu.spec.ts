import { expect, test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
} from 'utils/actions/misc.js';
import { assertStoreMatchJSX } from 'utils/asserts.js';

test('slash menu should show and hide correctly', async ({ page }) => {
  await enterPlaygroundRoom(page, { enable_slash_menu: true });
  const { paragraphId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  const slashMenu = page.locator(`.slash-menu`);

  await page.keyboard.type('/');
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

  // Pressing the whitespace key should close the slash menu
  await focusRichText(page);
  await page.keyboard.type('/');
  await expect(slashMenu).toBeVisible();
  await page.keyboard.type(' ');
  await expect(slashMenu).not.toBeVisible();

  // Pressing the backspace key should close the slash menu
  await page.keyboard.type('/');
  await expect(slashMenu).toBeVisible();
  await page.keyboard.press('Backspace');
  await expect(slashMenu).not.toBeVisible();

  // Typing something that does not match should close the slash menu
  await page.keyboard.type('/');
  await expect(slashMenu).toBeVisible();
  await page.keyboard.type('_');
  await expect(slashMenu).not.toBeVisible();

  // Pressing the slash key again should close the old slash menu and open new one
  await page.keyboard.type('/');
  await expect(slashMenu).toBeVisible();
  await page.keyboard.type('/');
  await expect(slashMenu).toBeVisible();
  await expect(slashMenu).toHaveCount(1);
  // You may need to press Esc twice in a real browser
  await page.keyboard.press('Escape');
  await expect(slashMenu).not.toBeVisible();

  // Left/right arrow should close the slash menu
  await page.keyboard.type('/');
  await expect(slashMenu).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(slashMenu).not.toBeVisible();
  await page.keyboard.type('/');
  await expect(slashMenu).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(slashMenu).not.toBeVisible();

  // TODO fix snapshot
  // await assertStoreMatchJSX(page, ``, paragraphId);
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
