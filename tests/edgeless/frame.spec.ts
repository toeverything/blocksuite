import { expect } from '@playwright/test';

import { dblclickView } from '../utils/actions/click.js';
import {
  autoFit,
  createShapeElement,
  dragBetweenViewCoords,
  edgelessCommonSetup,
  Shape,
  triggerComponentToolbarAction,
} from '../utils/actions/edgeless.js';
import {
  pressEnter,
  selectAllByKeyboard,
  type,
} from '../utils/actions/keyboard.js';
import {
  assertEdgelessCanvasText,
  assertSelectedBound,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test.describe('frame', () => {
  async function init(page) {
    await edgelessCommonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [100, 0], [200, 100], Shape.Square);
    await selectAllByKeyboard(page);
  }

  async function addFrame(page) {
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
  });

  test('drag frame to move', async ({ page }) => {
    await addFrame(page);
    await autoFit(page);

    await dragBetweenViewCoords(page, [100, 50], [200, 50]);
    await selectAllByKeyboard(page);
    await assertSelectedBound(page, [100, 0, 100, 100]);
    await assertSelectedBound(page, [200, 0, 100, 100], 1);
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
    await assertEdgelessCanvasText(page, 'Frame 1ABC');
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
});
