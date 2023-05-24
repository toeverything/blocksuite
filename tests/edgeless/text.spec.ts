import {
  enterPlaygroundRoom,
  initEmptyEdgelessState,
  setMouseMode,
  switchEditorMode,
  type,
  waitForVirgoStateUpdated,
} from '../utils/actions/index.js';
import { assertEdgelessText } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('add Text in default mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setMouseMode(page, 'default');

  await page.mouse.dblclick(30, 40);
  await waitForVirgoStateUpdated(page);

  await type(page, 'hello');
  await assertEdgelessText(page, 'hello');
});

test('add Text in text mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setMouseMode(page, 'text');

  await page.mouse.click(30, 40);
  await waitForVirgoStateUpdated(page);

  await type(page, 'hello');
  await assertEdgelessText(page, 'hello');
});
