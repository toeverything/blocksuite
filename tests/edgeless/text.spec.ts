import {
  assertMouseMode,
  enterPlaygroundRoom,
  initEmptyEdgelessState,
  setMouseMode,
  switchEditorMode,
  type,
  waitForVirgoStateUpdated,
} from '../utils/actions/index.js';
import { assertEdgelessText } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('add text element in default mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setMouseMode(page, 'default');

  await page.mouse.dblclick(30, 40);
  await waitForVirgoStateUpdated(page);

  await type(page, 'hello');
  await assertEdgelessText(page, 'hello');
  await assertMouseMode(page, 'default');
});

test('add text element in text mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setMouseMode(page, 'text');

  await page.mouse.click(30, 40);
  await waitForVirgoStateUpdated(page);

  await type(page, 'hello');
  await assertEdgelessText(page, 'hello');
  await assertMouseMode(page, 'default');
});
