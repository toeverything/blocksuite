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
import {
  assertEdgelessCanvasText,
  assertEdgelessSelectedRect,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('add text element in default mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setEdgelessTool(page, 'default');

  await page.mouse.dblclick(130, 140);
  await waitForVirgoStateUpdated(page);

  await type(page, 'hello');
  await assertEdgelessCanvasText(page, 'hello');
  await assertEdgelessTool(page, 'default');

  await page.mouse.click(120, 140);

  expect(await page.locator('edgeless-text-editor').count()).toBe(0);

  await page.mouse.dblclick(145, 155);
  await page.locator('edgeless-text-editor').waitFor({
    state: 'attached',
  });
  await type(page, 'hello');
  await assertEdgelessCanvasText(page, 'hellohello');

  await page.mouse.click(145, 155);
  await type(page, 'ddd\n');
  await assertEdgelessCanvasText(page, 'hddd\nellohello');
});

test('add text element in text mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setEdgelessTool(page, 'text');

  await page.mouse.click(130, 140);
  await waitNextFrame(page);

  await type(page, 'hello');
  await assertEdgelessCanvasText(page, 'hello');
  await assertEdgelessTool(page, 'default');

  await page.mouse.click(120, 140);

  expect(await page.locator('edgeless-text-editor').count()).toBe(0);

  await page.mouse.dblclick(145, 155);
  await page.locator('edgeless-text-editor').waitFor({
    state: 'attached',
  });
  await type(page, 'hello');
  await assertEdgelessCanvasText(page, 'hellohello');

  await page.mouse.click(145, 155);
  await type(page, 'ddd\n');
  await assertEdgelessCanvasText(page, 'hddd\nellohello');
});

test('copy and paste', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setEdgelessTool(page, 'default');

  await page.mouse.dblclick(130, 140);
  await waitNextFrame(page);

  await type(page, 'hello');
  await assertEdgelessCanvasText(page, 'hello');
  await assertEdgelessTool(page, 'default');

  await page.mouse.move(145, 155);
  await page.mouse.down();
  await page.mouse.move(165, 155, {
    steps: 10,
  });
  await page.mouse.up();
  // h|ell|o
  await waitNextFrame(page, 200);
  await page.keyboard.press(`${SHORT_KEY}+c`);

  await waitNextFrame(page, 200);
  await type(page, 'ddd', 100);
  await waitNextFrame(page, 200);
  await assertEdgelessCanvasText(page, 'hdddo');

  await page.keyboard.press(`${SHORT_KEY}+v`);
  await assertEdgelessCanvasText(page, 'hdddello');
});

test('normalize text element rect after change its font', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setEdgelessTool(page, 'text');

  await page.mouse.click(130, 160);
  await waitNextFrame(page);

  await type(page, 'aaa\nbbbbbbbb\n\ncc');
  await assertEdgelessCanvasText(page, 'aaa\nbbbbbbbb\n\ncc');
  await assertEdgelessTool(page, 'default');
  await page.mouse.click(120, 160);

  await page.mouse.click(145, 175);
  await assertEdgelessSelectedRect(page, [130, 160, 106, 156]);

  const fontButton = page.locator('.text-font-family-button');
  await fontButton.click();
  const generalTextFont = page.getByText('General');
  await generalTextFont.click();
  await assertEdgelessSelectedRect(page, [130, 160, 106.7, 108]);

  await fontButton.click();
  const scibbledTextFont = page.getByText('Scibbled');
  await scibbledTextFont.click();
  await assertEdgelessSelectedRect(page, [130, 160, 104, 156]);
});
