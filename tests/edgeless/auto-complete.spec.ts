import { clickView } from '../utils/actions/click.js';
import {
  createShapeElement,
  dragBetweenViewCoords,
  edgelessCommonSetup,
  Shape,
} from '../utils/actions/edgeless.js';
import { assertSelectedBound } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test.describe('auto-complete', () => {
  test.describe('click on auto-complete button', () => {
    test('click on right auto-complete button', async ({ page }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await clickView(page, [120, 50]);
      await assertSelectedBound(page, [200, 0, 100, 100]);
      await page.pause();
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
  });

  test.describe('drag on auto-complete button', () => {
    test('drag on right auto-complete button', async ({ page }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await dragBetweenViewCoords(page, [120, 50], [200, 0]);
      await assertSelectedBound(page, [200, -50, 100, 100]);
    });
  });
});
