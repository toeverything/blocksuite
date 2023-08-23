import {
  copyByKeyboard,
  pasteByKeyboard,
  pressEnter,
  pressEscape,
  type,
} from '../utils/actions/keyboard.js';
import {
  enterPlaygroundRoom,
  focusRichText,
  initDatabaseDynamicRowWithData,
  initEmptyDatabaseWithParagraphState,
} from '../utils/actions/misc.js';
import { assertRichTexts } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';
import { getDatabaseBodyCell, initDatabaseColumn } from './actions.js';

test.describe('copy&paste when editing', () => {
  test('should support copy&paste of the title column', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseWithParagraphState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '', true);
    await pressEscape(page);

    const titleColumn = getDatabaseBodyCell(page, {
      rowIndex: 0,
      columnIndex: 0,
    });
    await titleColumn.click();
    await type(page, 'abc123');
    await pressEscape(page);

    await pressEnter(page);
    await page.keyboard.down('Shift');
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');
    await copyByKeyboard(page);
    await pressEscape(page);

    await focusRichText(page);
    await pasteByKeyboard(page);
    await assertRichTexts(page, ['c123']);
  });
});
