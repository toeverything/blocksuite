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
  zoomResetByKeyboard,
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
  await assertEdgelessSelectedRect(page, [130, 200, 112.875, 167.6]);
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

test('auto wrap text by dragging left and right edge', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await zoomResetByKeyboard(page);

  await setEdgelessTool(page, 'default');

  await page.mouse.dblclick(130, 140);
  await waitForVirgoStateUpdated(page);
  await waitNextFrame(page);

  await type(page, 'helloworld');
  await assertEdgelessCanvasText(page, 'helloworld');
  await assertEdgelessTool(page, 'default');

  // quit edit mode
  await page.mouse.click(120, 140);

  // select text element
  await page.mouse.click(150, 140);
  await assertEdgelessSelectedRect(page, [130, 140, 100, 38]);

  // move cursor to the right edge and drag it to resize the width of text element
  await page.mouse.move(230, 160);
  await page.mouse.down();
  await page.mouse.move(190, 160, {
    steps: 10,
  });
  await page.mouse.up();

  // the text should be wrapped, so check the height of text element
  await assertEdgelessSelectedRect(page, [130, 140, 60, 76]);
  await page.mouse.dblclick(140, 160);
  await waitForVirgoStateUpdated(page);
  await waitNextFrame(page);
  await assertEdgelessCanvasText(page, 'helloworld');

  // quit edit mode
  await page.mouse.click(120, 140);

  // select text element
  await page.mouse.click(150, 140);
  await assertEdgelessSelectedRect(page, [130, 140, 60, 76]);

  // move cursor to the left edge and drag it to resize the width of text element
  await page.mouse.move(130, 160);
  await page.mouse.down();
  await page.mouse.move(90, 160, {
    steps: 10,
  });
  await page.mouse.up();

  // the text should be unwrapped, check the height of text element
  await assertEdgelessSelectedRect(page, [90, 140, 100, 38]);
  await page.mouse.dblclick(100, 160);
  await waitForVirgoStateUpdated(page);
  await waitNextFrame(page);
  await assertEdgelessCanvasText(page, 'helloworld');
});

test('text element should have maxWidth after adjusting width by dragging left or right edge', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await zoomResetByKeyboard(page);

  await setEdgelessTool(page, 'default');

  await page.mouse.dblclick(130, 140);
  await waitForVirgoStateUpdated(page);
  await waitNextFrame(page);

  await type(page, 'helloworld');
  await assertEdgelessCanvasText(page, 'helloworld');
  await assertEdgelessTool(page, 'default');

  // quit edit mode
  await page.mouse.click(120, 140);

  // select text element
  await page.mouse.click(150, 140);
  await assertEdgelessSelectedRect(page, [130, 140, 100, 38]);

  // move cursor to the right edge and drag it to resize the width of text element
  await page.mouse.move(230, 160);
  await page.mouse.down();
  await page.mouse.move(190, 160, {
    steps: 10,
  });
  await page.mouse.up();

  // the text should be wrapped, so check the height of text element
  await assertEdgelessSelectedRect(page, [130, 140, 60, 76]);

  // enter edit mode
  await page.mouse.dblclick(185, 200);
  await waitForVirgoStateUpdated(page);
  await waitNextFrame(page);
  await type(page, 'helloworld');
  await assertEdgelessCanvasText(page, 'helloworldhelloworld');

  // quit edit mode
  await page.mouse.click(120, 140);

  // select text element
  await page.mouse.click(150, 140);
  // the width of the text element should be the same as before, but the height should be changed
  await assertEdgelessSelectedRect(page, [130, 140, 60, 152]);
});
