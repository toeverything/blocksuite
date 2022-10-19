/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, Page, test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  pressEnter,
  selectAllByKeyboard,
  withCtrlOrMeta,
} from './utils/actions';

const pressCreateLinkShortCut = async (page: Page) => {
  await withCtrlOrMeta(page, async () => {
    await page.keyboard.press('k');
    await page.keyboard.up('k');
  });
};

test('basic link', async ({ page }) => {
  const linkText = 'linkText';
  const link = 'http://example.com';
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type(linkText);

  // Create link
  await selectAllByKeyboard(page);
  await pressCreateLinkShortCut(page);

  const editLinkPopoverLocator = page.locator('.edit-link-panel-input');
  expect(await editLinkPopoverLocator.isVisible()).toBe(true);
  await editLinkPopoverLocator.fill(link);
  // await page.keyboard.type(link);
  // await page.locator(`text="Confirm"`).click();
  await pressEnter(page);
  expect(await editLinkPopoverLocator.isVisible()).toBe(false);

  const linkLocator = page.locator(`text="${linkText}"`);
  await expect(linkLocator).toHaveAttribute('href', link);

  // Hover link
  expect(await editLinkPopoverLocator.isVisible()).toBe(false);
  await linkLocator.hover();
  // wait for popover delay open
  await page.waitForTimeout(200);
  expect(await editLinkPopoverLocator.isVisible()).toBe(true);

  // TODO this action will changed
  // Edit link
  const link2 = 'http://example2.com';
  await editLinkPopoverLocator.fill(link2);
  await pressEnter(page);
  await expect(linkLocator).toHaveAttribute('href', link2);
});
