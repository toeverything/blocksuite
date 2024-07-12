import type { Page } from '@playwright/test';

import { NoteDisplayMode } from '@blocks/_common/types.js';

import {
  addNote,
  changeNoteDisplayModeWithId,
  edgelessCommonSetup,
  getSelectedBound,
  selectNoteInEdgeless,
} from '../utils/actions/edgeless.js';
import { assertSelectedBound } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test.describe('auto-connect', () => {
  async function init(page: Page) {
    await edgelessCommonSetup(page);
  }
  test('navigator', async ({ page }) => {
    await init(page);
    const id1 = await addNote(page, 'page1', 200, 300);
    const id2 = await addNote(page, 'page2', 300, 500);
    const id3 = await addNote(page, 'page3', 400, 700);

    await page.mouse.click(200, 50);
    // Notes added in edgeless mode only visible in edgeless mode
    // To use index label navigator, we need to change display mode to PageAndEdgeless
    await changeNoteDisplayModeWithId(
      page,
      id1,
      NoteDisplayMode.DocAndEdgeless
    );
    await changeNoteDisplayModeWithId(
      page,
      id2,
      NoteDisplayMode.DocAndEdgeless
    );
    await changeNoteDisplayModeWithId(
      page,
      id3,
      NoteDisplayMode.DocAndEdgeless
    );

    await selectNoteInEdgeless(page, id1);
    const bound = await getSelectedBound(page, 0);
    await page.locator('.edgeless-index-label').nth(0).click();
    await assertSelectedBound(page, bound);

    await page.locator('.edgeless-auto-connect-next-button').click();
    bound[0] += 100;
    bound[1] += 200;
    await assertSelectedBound(page, bound);

    await page.locator('.edgeless-auto-connect-next-button').click();
    bound[0] += 100;
    bound[1] += 200;
    await assertSelectedBound(page, bound);
  });
});
