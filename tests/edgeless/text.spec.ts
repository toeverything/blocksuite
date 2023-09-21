import { expect, type Page } from '@playwright/test';

import {
  assertEdgelessTool,
  enterPlaygroundRoom,
  initEmptyEdgelessState,
  pressArrowLeft,
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

async function assertTextFont(page: Page, font: 'General' | 'Scribbled') {
  const fontButton = page.locator('.text-font-family-button');
  const fontPanel = page.locator('edgeless-font-family-panel');
  const isFontPanelShow = await fontPanel.isVisible();
  if (!isFontPanelShow) {
    if (!fontButton.isVisible())
      throw new Error('edgeless change text toolbar is not visible');

    await fontButton.click();
  }

  const generalButton = fontPanel.locator('.general-button');
  const scibbledButton = fontPanel.locator('.scibbled-button');
  if (font === 'General') {
    await expect(
      generalButton.locator('.active-mode-background[active]')
    ).toBeVisible();
    return;
  }
  if (font === 'Scribbled') {
    await expect(
      scibbledButton.locator('.active-mode-background[active]')
    ).toBeVisible();
  }
}

// it's flaky
test('add text element in default mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);
  await setEdgelessTool(page, 'default');

  await page.mouse.dblclick(130, 140);
  await waitForVirgoStateUpdated(page);
  await waitNextFrame(page);

  await type(page, 'hello');
  await assertEdgelessCanvasText(page, 'hello');
  await assertEdgelessTool(page, 'default');

  await page.mouse.click(120, 140);

  expect(await page.locator('edgeless-text-editor').count()).toBe(0);

  await page.mouse.dblclick(145, 155);
  await waitNextFrame(page);
  await page.locator('edgeless-text-editor').waitFor({
    state: 'attached',
  });
  await type(page, 'hello');
  await assertEdgelessCanvasText(page, 'hhelloello');

  await pressArrowLeft(page, 5);
  await type(page, 'ddd\n');
  await assertEdgelessCanvasText(page, 'hddd\nhelloello');
});

// it's also a little flaky
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

  await page.mouse.click(145, 145);
  await page.mouse.click(145, 145);

  await page.locator('edgeless-text-editor').waitFor({
    state: 'attached',
  });
  await type(page, 'hello');
  await page.waitForTimeout(100);
  await assertEdgelessCanvasText(page, 'hhelloello');

  await page.mouse.click(145, 155);
  await type(page, 'ddd\n');
  await assertEdgelessCanvasText(page, 'hddd\nhelloello');
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
  await page.mouse.move(170, 155, {
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

  await page.mouse.click(130, 200);
  await waitNextFrame(page);

  await type(page, 'aaa\nbbbbbbbb\n\ncc');
  await assertEdgelessCanvasText(page, 'aaa\nbbbbbbbb\n\ncc');
  await assertEdgelessTool(page, 'default');
  await page.mouse.click(10, 100);

  await page.mouse.click(140, 210);
  await waitNextFrame(page);
  await assertEdgelessSelectedRect(page, [130, 200, 113.9, 167.6]);
  const fontButton = page.locator('.text-font-family-button');
  await fontButton.click();

  // Default is Scribbled
  await assertTextFont(page, 'Scribbled');
  const generalTextFont = page.getByText('General');
  await generalTextFont.click();
  await waitNextFrame(page);
  await assertEdgelessSelectedRect(page, [130, 200, 114.7, 116]);
  await fontButton.click();
  await assertTextFont(page, 'General');
  const scribbledTextFont = page.getByText('Scribbled');
  await scribbledTextFont.click();
  await waitNextFrame(page);
  await assertEdgelessSelectedRect(page, [130, 200, 111.7, 167.6]);
});
