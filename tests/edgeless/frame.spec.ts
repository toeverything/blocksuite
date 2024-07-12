import { type Page, expect } from '@playwright/test';
import { waitNextFrame } from 'utils/actions/misc.js';

import { dblclickView } from '../utils/actions/click.js';
import {
  Shape,
  addNote,
  autoFit,
  createShapeElement,
  dragBetweenViewCoords,
  edgelessCommonSetup,
  setEdgelessTool,
  toViewCoord,
  triggerComponentToolbarAction,
  zoomOutByKeyboard,
} from '../utils/actions/edgeless.js';
import {
  pressEnter,
  selectAllByKeyboard,
  type,
} from '../utils/actions/keyboard.js';
import {
  assertEdgelessCanvasText,
  assertRichTexts,
  assertSelectedBound,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test.describe('frame', () => {
  async function init(page: Page) {
    await edgelessCommonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [100, 0], [200, 100], Shape.Square);
    await selectAllByKeyboard(page);
  }

  async function addFrame(page: Page) {
    await init(page);
    await triggerComponentToolbarAction(page, 'addFrame');
  }
  test.describe('add frame', () => {
    test('multi select add frame by component toolbar', async ({ page }) => {
      await addFrame(page);
      await assertSelectedBound(page, [-300, -270, 800, 640]);
    });

    test('add frame by shortcut F', async ({ page }) => {
      await init(page);
      await page.keyboard.press('f');
      await assertSelectedBound(page, [-300, -270, 800, 640]);
    });

    test('add frame by more option create frame', async ({ page }) => {
      await init(page);
      await triggerComponentToolbarAction(page, 'createFrameOnMoreOption');
      await assertSelectedBound(page, [-300, -270, 800, 640]);
    });

    test('add frame by edgeless toolbar', async ({ page }) => {
      await init(page);
      await autoFit(page);
      await setEdgelessTool(page, 'frame');
      const frameMenu = page.locator('edgeless-frame-menu');
      await expect(frameMenu).toBeVisible();
      const button = page.locator('.frame-add-button[data-name="1:1"]');
      await button.click();
      await assertSelectedBound(page, [-500, -550, 1200, 1200]);
    });
  });

  test('drag frame to move', async ({ page }) => {
    await addFrame(page);
    await autoFit(page);
    await dragBetweenViewCoords(page, [100, 50], [120, 70]);
    await selectAllByKeyboard(page);
    await assertSelectedBound(page, [20, 20, 100, 100], 0);
    await assertSelectedBound(page, [120, 20, 100, 100], 1);
  });

  test('edit frame title', async ({ page }) => {
    await addFrame(page);
    await autoFit(page);
    expect(await page.locator('edgeless-frame-title-editor').count()).toBe(0);
    await dblclickView(page, [-300 + 5, -270 - 20]);
    await page.locator('edgeless-frame-title-editor').waitFor({
      state: 'attached',
    });
    await type(page, 'ABC');
    await assertEdgelessCanvasText(page, 'ABC');
  });

  test('edit frame after zoom', async ({ page }) => {
    await addFrame(page);
    await autoFit(page);
    await zoomOutByKeyboard(page);
    expect(await page.locator('edgeless-frame-title-editor').count()).toBe(0);
    await dblclickView(page, [-300 + 5, -270 - 20]);
    await page.locator('edgeless-frame-title-editor').waitFor({
      state: 'attached',
    });
    await type(page, 'ABC');
    await assertEdgelessCanvasText(page, 'ABC');
  });

  test('edit frame title after drag', async ({ page }) => {
    await addFrame(page);
    await autoFit(page);
    await dragBetweenViewCoords(page, [100, 50], [120, 70]);
    await selectAllByKeyboard(page);
    await dblclickView(page, [-300 + 5 + 20, -270 - 20 + 20]);
    await page.locator('edgeless-frame-title-editor').waitFor({
      state: 'attached',
    });
    await type(page, 'ABC');
    await assertEdgelessCanvasText(page, 'ABC');
  });

  test('edit title of the frame that created by tool ', async ({ page }) => {
    await edgelessCommonSetup(page);
    await setEdgelessTool(page, 'frame');

    await dragBetweenViewCoords(page, [0, 0], [200, 100]);
    await dblclickView(page, [65, -20]);
    await page.locator('edgeless-frame-title-editor').waitFor({
      state: 'attached',
    });
    await type(page, 'ABC');
    await assertEdgelessCanvasText(page, 'ABC');
  });

  test('blur unmount frame editor', async ({ page }) => {
    await addFrame(page);
    await autoFit(page);
    await dblclickView(page, [-300 + 5, -270 - 20]);
    await page.locator('edgeless-frame-title-editor').waitFor({
      state: 'attached',
    });
    await page.mouse.click(10, 10);
    expect(await page.locator('edgeless-frame-title-editor').count()).toBe(0);
  });

  test('enter unmount frame editor', async ({ page }) => {
    await addFrame(page);
    await autoFit(page);
    await dblclickView(page, [-300 + 5, -270 - 20]);
    await page.locator('edgeless-frame-title-editor').waitFor({
      state: 'attached',
    });
    await pressEnter(page);
    expect(await page.locator('edgeless-frame-title-editor').count()).toBe(0);
  });

  test('dom inside frame can be selected and edited', async ({ page }) => {
    await init(page);
    const noteCoord = await toViewCoord(page, [0, 200]);
    await addNote(page, '', noteCoord[0], noteCoord[1]);
    await page.mouse.click(noteCoord[0] - 80, noteCoord[1]);
    await selectAllByKeyboard(page);
    await waitNextFrame(page);
    await triggerComponentToolbarAction(page, 'addFrame');
    await autoFit(page);

    await dblclickView(page, [50, 250]);
    await type(page, 'hello');
    await assertRichTexts(page, ['hello']);
  });
});
