import { type Page } from '@playwright/test';

import {
  initThreeOverlapFilledShapes,
  initThreeOverlapNotes,
  switchEditorMode,
  triggerComponentToolbarAction,
} from '../utils/actions/edgeless.js';
import {
  enterPlaygroundRoom,
  initEmptyEdgelessState,
  waitNextFrame,
} from '../utils/actions/index.js';
import { assertEdgelessSelectedRect } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test.describe('reordering shapes', () => {
  async function init(page: Page) {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);
    await initThreeOverlapFilledShapes(page);
    await page.mouse.click(0, 0);
  }

  test('bring to front', async ({ page }) => {
    await init(page);

    // should be rect2
    await page.mouse.click(180, 180);
    await assertEdgelessSelectedRect(page, [160, 160, 100, 100]);

    // click outside to clear selection
    await page.mouse.click(50, 50);

    // should be rect1
    await page.mouse.click(150, 150);
    await assertEdgelessSelectedRect(page, [130, 130, 100, 100]);

    // should be rect0
    await page.mouse.click(110, 130);
    await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);

    // bring rect0 to front
    await triggerComponentToolbarAction(page, 'bringToFront');

    // click outside to clear selection
    await page.mouse.click(50, 50);

    // should be rect0
    await page.mouse.click(180, 180);
    await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
  });

  test('bring forward', async ({ page }) => {
    await init(page);

    // should be rect0
    await page.mouse.click(120, 120);
    await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);

    // bring rect0 forward
    await triggerComponentToolbarAction(page, 'bringForward');

    // click outside to clear selection
    await page.mouse.click(50, 50);

    // should be rect0
    await page.mouse.click(150, 150);
    await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
  });

  test('send backward', async ({ page }) => {
    await init(page);

    // should be rect2
    await page.mouse.click(180, 180);
    await assertEdgelessSelectedRect(page, [160, 160, 100, 100]);

    // bring rect2 backward
    await triggerComponentToolbarAction(page, 'sendBackward');

    // click outside to clear selection
    await page.mouse.click(50, 50);

    // should be rect1
    await page.mouse.click(180, 180);
    await assertEdgelessSelectedRect(page, [130, 130, 100, 100]);
  });

  test('send to back', async ({ page }) => {
    await init(page);

    // should be rect2
    await page.mouse.click(180, 180);
    await assertEdgelessSelectedRect(page, [160, 160, 100, 100]);

    // bring rect2 to back
    await triggerComponentToolbarAction(page, 'sendToBack');

    // click outside to clear selection
    await page.mouse.click(50, 50);

    // should be rect1
    await page.mouse.click(180, 180);
    await assertEdgelessSelectedRect(page, [130, 130, 100, 100]);

    // send rect1 to back
    await triggerComponentToolbarAction(page, 'sendToBack');

    // click outside to clear selection
    await page.mouse.click(50, 50);

    // should be rect0
    await page.mouse.click(180, 180);
    await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);
  });
});

test.describe('reordering notes', () => {
  async function init(page: Page) {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);
    await initThreeOverlapNotes(page);
    await waitNextFrame(page);
    await page.mouse.click(0, 0);
  }

  test('bring to front', async ({ page }) => {
    await init(page);

    // click outside to clear selection
    await page.mouse.click(50, 50);

    // should be note2
    await page.mouse.click(180, 140);
    await assertEdgelessSelectedRect(page, [160, 100, 448, 80]);

    // click outside to clear selection
    await page.mouse.click(50, 50);

    // should be note1
    await page.mouse.click(150, 140);
    await assertEdgelessSelectedRect(page, [130, 100, 448, 80]);

    // should be note0
    await page.mouse.click(120, 140);
    await assertEdgelessSelectedRect(page, [100, 100, 448, 80]);

    // bring note0 to front
    await triggerComponentToolbarAction(page, 'bringToFront');

    // click outside to clear selection
    await page.mouse.click(50, 50);

    // should be note0
    await page.mouse.click(180, 140);
    await assertEdgelessSelectedRect(page, [100, 100, 448, 80]);
  });

  test('bring forward', async ({ page }) => {
    await init(page);

    // click outside to clear selection
    await page.mouse.click(50, 50);

    // should be note0
    await page.mouse.click(120, 140);
    await assertEdgelessSelectedRect(page, [100, 100, 448, 80]);

    // bring note0 forward
    await triggerComponentToolbarAction(page, 'bringForward');

    // click outside to clear selection
    await page.mouse.click(50, 50);

    // should be rect0
    await page.mouse.click(150, 140);
    await assertEdgelessSelectedRect(page, [100, 100, 448, 80]);
  });

  test('send backward', async ({ page }) => {
    await init(page);

    // click outside to clear selection
    await page.mouse.click(50, 50);

    // should be note2
    await page.mouse.click(180, 140);
    await assertEdgelessSelectedRect(page, [160, 100, 448, 80]);

    // bring note2 backward
    await triggerComponentToolbarAction(page, 'sendBackward');

    // click outside to clear selection
    await page.mouse.click(50, 50);

    // should be note1
    await page.mouse.click(180, 140);
    await assertEdgelessSelectedRect(page, [130, 100, 448, 80]);
  });

  test('send to back', async ({ page }) => {
    await init(page);

    // click outside to clear selection
    await page.mouse.click(50, 50);

    // should be note2
    await page.mouse.click(180, 140);
    await assertEdgelessSelectedRect(page, [160, 100, 448, 80]);

    // bring note2 to back
    await triggerComponentToolbarAction(page, 'sendToBack');

    // click outside to clear selection
    await page.mouse.click(50, 50);

    // should be note1
    await page.mouse.click(180, 140);
    await assertEdgelessSelectedRect(page, [130, 100, 448, 80]);

    // send note1 to back
    await triggerComponentToolbarAction(page, 'sendToBack');

    // click outside to clear selection
    await page.mouse.click(50, 50);

    // should be note0
    await page.mouse.click(180, 140);
    await assertEdgelessSelectedRect(page, [100, 100, 448, 80]);
  });
});
