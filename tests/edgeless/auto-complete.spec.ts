import { expect, type Page } from '@playwright/test';
import { waitForVirgoStateUpdated, waitNextFrame } from 'utils/actions/misc.js';

import { clickView } from '../utils/actions/click.js';
import {
  addNote,
  createShapeElement,
  dragBetweenViewCoords,
  edgelessCommonSetup,
  getEdgelessSelectedRectModel,
  Shape,
  toViewCoord,
} from '../utils/actions/edgeless.js';
import {
  assertEdgelessCanvasText,
  assertRichTexts,
  assertSelectedBound,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

function getAutoCompletePanelButton(page: Page, type: string) {
  return page
    .locator('.auto-complete-panel-container')
    .locator('edgeless-tool-icon-button')
    .filter({ hasText: `${type}` });
}

test.describe('auto-complete', () => {
  test.describe('click on auto-complete button', () => {
    test('click on right auto-complete button', async ({ page }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await clickView(page, [120, 50]);
      await assertSelectedBound(page, [200, 0, 100, 100]);
    });
    test('click on bottom auto-complete button', async ({ page }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await clickView(page, [50, 120]);
      await assertSelectedBound(page, [0, 200, 100, 100]);
    });
    test('click on left auto-complete button', async ({ page }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await clickView(page, [-20, 50]);
      await assertSelectedBound(page, [-200, 0, 100, 100]);
    });
    test('click on top auto-complete button', async ({ page }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await clickView(page, [50, -20]);
      await assertSelectedBound(page, [0, -200, 100, 100]);
    });

    test('click on note auto-complete button', async ({ page }) => {
      await edgelessCommonSetup(page);
      await addNote(page, 'note', 100, 100);
      await page.mouse.click(300, 50);
      await page.mouse.click(150, 120);
      const rect = await getEdgelessSelectedRectModel(page);
      await clickView(page, [rect[0] + rect[2] + 10, rect[1] + rect[3] / 2]);
      const newRect = await getEdgelessSelectedRectModel(page);
      expect(rect[0]).not.toEqual(newRect[0]);
      expect(rect[1]).toEqual(newRect[1]);
      expect(rect[2]).toEqual(newRect[2]);
      expect(rect[3]).toEqual(newRect[3]);
    });
  });

  test.describe('drag on auto-complete button', () => {
    test('drag on right auto-complete button to add shape', async ({
      page,
    }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await dragBetweenViewCoords(page, [120, 50], [200, 0]);

      const ellipseButton = getAutoCompletePanelButton(page, 'ellipse');
      await expect(ellipseButton).toBeVisible();
      await ellipseButton.click();

      await assertSelectedBound(page, [200, -50, 100, 100]);
    });

    test('drag on right auto-complete button to add canvas text', async ({
      page,
    }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await dragBetweenViewCoords(page, [120, 50], [200, 0]);

      const canvasTextButton = getAutoCompletePanelButton(page, 'text');
      await expect(canvasTextButton).toBeVisible();
      await canvasTextButton.click();

      await waitForVirgoStateUpdated(page);
      await waitNextFrame(page);
      await page.keyboard.type('hello');
      await assertEdgelessCanvasText(page, 'hello');
    });

    test('drag on right auto-complete button to add note', async ({ page }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await dragBetweenViewCoords(page, [120, 50], [200, 0]);

      const noteButton = getAutoCompletePanelButton(page, 'note');
      await expect(noteButton).toBeVisible();
      await noteButton.click();
      await waitNextFrame(page);

      expect(await page.locator('affine-note').count()).toBe(1);
      const [x, y] = await toViewCoord(page, [240, 0]);
      await page.mouse.click(x, y);
      await page.keyboard.type('hello');
      await waitNextFrame(page);
      await assertRichTexts(page, ['hello']);
    });

    test('drag on right auto-complete button to add frame', async ({
      page,
    }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await dragBetweenViewCoords(page, [120, 50], [200, 0]);

      expect(await page.locator('.affine-frame-container').count()).toBe(0);

      const frameButton = getAutoCompletePanelButton(page, 'frame');
      await expect(frameButton).toBeVisible();
      await frameButton.click();

      expect(await page.locator('.affine-frame-container').count()).toBe(1);
    });
  });
});
