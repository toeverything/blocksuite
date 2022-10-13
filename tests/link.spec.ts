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
  await selectAllByKeyboard(page);
  await pressCreateLinkShortCut(page);

  const editLinkPanelLocator = page.locator('.edit-link-panel-input');
  await editLinkPanelLocator.isVisible();
  await editLinkPanelLocator.fill(link);
  // await page.keyboard.type(link);
  // await page.locator(`text="Confirm"`).click();
  await pressEnter(page);

  const linkLocator = page.locator(`text="${linkText}"`);
  await expect(linkLocator).toHaveAttribute('href', link);
});
