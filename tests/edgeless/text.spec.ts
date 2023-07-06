import { expect } from '@playwright/test';

import {
  assertEdgelessTool,
  enterPlaygroundRoom,
  initEmptyEdgelessState,
  setEdgelessTool,
  SHORT_KEY,
  switchEditorMode,
  type,
  waitForVirgoStateUpdated,
  waitNextFrame,
} from '../utils/actions/index.js';
import { assertEdgelessText } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('add text element in default mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setEdgelessTool(page, 'default');

  await page.mouse.dblclick(130, 140);
  await waitForVirgoStateUpdated(page);

  await type(page, 'hello');
  await assertEdgelessText(page, 'hello');
  await assertEdgelessTool(page, 'default');

  await page.mouse.click(120, 140);

  expect(await page.locator('edgeless-text-editor').count()).toBe(0);

  await page.mouse.dblclick(145, 155);
  await page.locator('edgeless-text-editor').waitFor({
    state: 'attached',
  });
  await type(page, 'hello');
  await assertEdgelessText(page, 'hellohello');

  await page.mouse.click(145, 155);
  await type(page, 'ddd\n');
  await assertEdgelessText(page, 'hddd\nellohello');
});

test('add text element in text mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setEdgelessTool(page, 'text');

  await page.mouse.click(130, 140);
  await waitForVirgoStateUpdated(page);

  await type(page, 'hello');
  await assertEdgelessText(page, 'hello');
  await assertEdgelessTool(page, 'default');

  await page.mouse.click(120, 140);

  expect(await page.locator('edgeless-text-editor').count()).toBe(0);

  await page.mouse.dblclick(145, 155);
  await page.locator('edgeless-text-editor').waitFor({
    state: 'attached',
  });
  await type(page, 'hello');
  await assertEdgelessText(page, 'hellohello');

  await page.mouse.click(145, 155);
  await type(page, 'ddd\n');
  await assertEdgelessText(page, 'hddd\nellohello');
});

test('copy and paste', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setEdgelessTool(page, 'default');

  await page.mouse.dblclick(130, 140);
  await waitForVirgoStateUpdated(page);

  await type(page, 'hello');
  await assertEdgelessText(page, 'hello');
  await assertEdgelessTool(page, 'default');

  await page.mouse.move(145, 155);
  await page.mouse.down();
  await page.mouse.move(165, 155, {
    steps: 10,
  });
  await page.mouse.up();
  await waitNextFrame(page, 200);
  await page.keyboard.press(`${SHORT_KEY}+c`);

  await waitNextFrame(page, 200);
  await type(page, 'ddd');
  await waitNextFrame(page, 200);
  await assertEdgelessText(page, 'hdddo');

  await page.keyboard.press(`${SHORT_KEY}+v`);
  await assertEdgelessText(page, 'hdddello');
});
