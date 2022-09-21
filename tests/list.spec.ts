import { test } from '@playwright/test';
import { assertBlockCount, assertTextBlocks } from './utils/asserts';
import { addListByClick, enterPlaygroundRoom } from './utils/actions';

test('add new list block by click', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await addListByClick(page);
  await addListByClick(page);
  await assertTextBlocks(page, ['\n', '\n', '\n']);
  await assertBlockCount(page, 'list', 2);
});
