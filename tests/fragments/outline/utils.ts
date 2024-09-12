import { expect, type Locator, type Page } from '@playwright/test';
import { pressEnter, type } from 'utils/actions/keyboard.js';
import { getEditorHostLocator } from 'utils/actions/misc.js';

export async function getVerticalCenterFromLocator(locator: Locator) {
  const rect = await locator.boundingBox();
  return rect!.y + rect!.height / 2;
}

export async function createHeadingsWithGap(page: Page) {
  // heading 1 to 6
  const editor = getEditorHostLocator(page);

  const headings: Locator[] = [];
  await pressEnter(page, 10);
  for (let i = 1; i <= 6; i++) {
    await type(page, `${'#'.repeat(i)} `);
    await type(page, `Heading ${i}`);
    const heading = editor.locator(`.h${i}`);
    await expect(heading).toBeVisible();
    headings.push(heading);
    await pressEnter(page, 10);
  }
  await pressEnter(page, 10);

  return headings;
}
