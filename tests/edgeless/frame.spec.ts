import type { Page } from '@playwright/test';
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
import { waitNextFrame } from '../utils/actions/misc.js';
import {
  assertEdgelessCanvasText,
  assertSelectedBound,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test.describe('frame', () => {
  async function addFrame(page: Page) {
    await edgelessCommonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [100, 0], [200, 100], Shape.Square);
    await selectAllByKeyboard(page);
    await triggerComponentToolbarAction(page, 'addFrame');
  }

  test('add frame', async ({ page }) => {
    await addFrame(page);
    await assertSelectedBound(page, [-40, -270, 880, 640]);
  });

  test('drag frame to move', async ({ page }) => {
    await addFrame(page);
    await autoFit(page);

    await assertSelectedBound(page, [-40, -270, 880, 640]);
    await dragBetweenViewCoords(page, [100, 50], [200, 50]);
    await assertSelectedBound(page, [60, -270, 880, 640]);
  });

  test('edit frame title', async ({ page }) => {
    await addFrame(page);
    await autoFit(page);

    expect(await page.locator('edgeless-frame-title-editor').count()).toBe(0);
    await dblclickView(page, [-40 + 5, -270 - 20]);
    await waitNextFrame(page);
    await type(page, 'ABC');
    await assertEdgelessCanvasText(page, 'Frame 1ABC');
  });

  test('blur unmount frame editor', async ({ page }) => {
    await addFrame(page);
    await autoFit(page);

    expect(await page.locator('edgeless-frame-title-editor').count()).toBe(0);
    await dblclickView(page, [-40 + 5, -270 - 20]);
    expect(await page.locator('edgeless-frame-title-editor').count()).toBe(1);
    await page.mouse.click(10, 10);
    expect(await page.locator('edgeless-frame-title-editor').count()).toBe(0);
  });

  test('enter unmount frame editor', async ({ page }) => {
    await addFrame(page);
    await autoFit(page);

    expect(await page.locator('edgeless-frame-title-editor').count()).toBe(0);
    await dblclickView(page, [-40 + 5, -270 - 20]);
    expect(await page.locator('edgeless-frame-title-editor').count()).toBe(1);
    await pressEnter(page);
    await waitNextFrame(page);
    expect(await page.locator('edgeless-frame-title-editor').count()).toBe(0);
  });
});
