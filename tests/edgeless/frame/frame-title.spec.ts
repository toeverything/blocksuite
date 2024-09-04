import { expect, type Page } from '@playwright/test';
import {
  createFrame as _createFrame,
  autoFit,
  dragBetweenViewCoords,
  edgelessCommonSetup,
  zoomOutByKeyboard,
  zoomResetByKeyboard,
} from 'utils/actions/edgeless.js';
import { pressEnter, type } from 'utils/actions/keyboard.js';
import { assertEdgelessCanvasText } from 'utils/asserts.js';

import { test } from '../../utils/playwright.js';

const createFrame = async (
  page: Page,
  coord1: [number, number],
  coord2: [number, number]
) => {
  await _createFrame(page, coord1, coord2);
  await autoFit(page);
};

test.beforeEach(async ({ page }) => {
  await edgelessCommonSetup(page);
  await zoomResetByKeyboard(page);
});

test.describe('edit frame title', () => {
  const enterFrameTitleEditor = async (page: Page) => {
    const frameTitle = page.locator('.affine-frame-title');
    await frameTitle.dblclick();

    const frameTitleEditor = page.locator('edgeless-frame-title-editor');
    await frameTitleEditor.waitFor({
      state: 'attached',
    });
    return frameTitleEditor;
  };

  test('edit frame title by db-click title', async ({ page }) => {
    await createFrame(page, [50, 50], [150, 150]);

    await enterFrameTitleEditor(page);

    await type(page, 'ABC');
    await assertEdgelessCanvasText(page, 'ABC');
  });

  test('should not display frame title component when title is empty', async ({
    page,
  }) => {
    await createFrame(page, [50, 50], [150, 150]);
    await enterFrameTitleEditor(page);

    await type(page, '');
    const frameTitle = page.locator('.affine-frame-title');
    await expect(frameTitle).toHaveCount(0);
  });

  test('edit frame after zoom', async ({ page }) => {
    await createFrame(page, [50, 50], [150, 150]);
    await autoFit(page);
    await zoomOutByKeyboard(page);
    await enterFrameTitleEditor(page);
    await type(page, 'ABC');
    await assertEdgelessCanvasText(page, 'ABC');
  });

  test('edit frame title after drag', async ({ page }) => {
    await createFrame(page, [50, 50], [150, 150]);
    await dragBetweenViewCoords(page, [50 + 10, 50 + 10], [50 + 20, 50 + 20]);

    await enterFrameTitleEditor(page);
    await type(page, 'ABC');
    await assertEdgelessCanvasText(page, 'ABC');
  });

  test('blur unmount frame editor', async ({ page }) => {
    await createFrame(page, [50, 50], [150, 150]);
    const frameTitleEditor = await enterFrameTitleEditor(page);
    await page.mouse.click(10, 10);
    await expect(frameTitleEditor).toHaveCount(0);
  });

  test('enter unmount frame editor', async ({ page }) => {
    await createFrame(page, [50, 50], [150, 150]);
    const frameTitleEditor = await enterFrameTitleEditor(page);
    await pressEnter(page);
    await expect(frameTitleEditor).toHaveCount(0);
  });
});
