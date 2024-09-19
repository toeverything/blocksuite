import type { Page } from '@playwright/test';

import { clickView, moveView } from 'utils/actions/click.js';
import {
  createFrame as _createFrame,
  autoFit,
  createShapeElement,
  dragBetweenViewCoords,
  edgelessCommonSetup,
  Shape,
  shiftClickView,
  triggerComponentToolbarAction,
  zoomResetByKeyboard,
} from 'utils/actions/edgeless.js';
import {
  copyByKeyboard,
  pasteByKeyboard,
  pressBackspace,
  pressEscape,
  selectAllByKeyboard,
} from 'utils/actions/keyboard.js';
import { assertSelectedBound } from 'utils/asserts.js';

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

test.describe('frame copy and paste', () => {
  test('copy of frame should keep relationship of child elements', async ({
    page,
  }) => {
    await createFrame(page, [50, 50], [450, 450]);
    await createShapeElement(page, [200, 200], [300, 300], Shape.Square);
    await pressEscape(page);

    await clickView(page, [60, 60]);
    await copyByKeyboard(page);

    await moveView(page, [500, 500]); // center copy
    await pasteByKeyboard(page);

    await selectAllByKeyboard(page);
    await assertSelectedBound(page, [200, 200, 100, 100], 0); // shape
    await assertSelectedBound(page, [450, 450, 100, 100], 1); // shape
    await assertSelectedBound(page, [50, 50, 400, 400], 2); // frame
    await assertSelectedBound(page, [300, 300, 400, 400], 3); // frame
    await pressEscape(page);

    await clickView(page, [60, 60]);
    await dragBetweenViewCoords(page, [60, 60], [10, 10]);

    await clickView(page, [360, 360]);
    await dragBetweenViewCoords(page, [360, 360], [310, 310]);

    await selectAllByKeyboard(page);
    await assertSelectedBound(page, [150, 150, 100, 100], 0); // shape
    await assertSelectedBound(page, [400, 400, 100, 100], 1); // shape
    await assertSelectedBound(page, [0, 0, 400, 400], 2); // frame
    await assertSelectedBound(page, [250, 250, 400, 400], 3); // frame
  });

  test('copy of frame by alt/option dragging should keep relationship of child elements', async ({
    page,
  }) => {
    await createFrame(page, [50, 50], [450, 450]);
    await createShapeElement(page, [200, 200], [300, 300], Shape.Square);
    await createShapeElement(page, [250, 250], [350, 350], Shape.Square);
    await createShapeElement(page, [300, 300], [400, 400], Shape.Square);
    await pressEscape(page);

    await shiftClickView(page, [260, 260]);
    await shiftClickView(page, [310, 310]);
    await triggerComponentToolbarAction(page, 'addGroup');
    await pressEscape(page);

    await clickView(page, [60, 60]);
    await page.keyboard.down('Alt');
    await dragBetweenViewCoords(page, [60, 60], [460, 460]);

    await page.keyboard.up('Alt');
    await pressEscape(page);

    await shiftClickView(page, [60, 60]);
    await shiftClickView(page, [250, 250]);
    await shiftClickView(page, [350, 350]);
    await pressBackspace(page);

    await selectAllByKeyboard(page);
    await assertSelectedBound(page, [600, 600, 100, 100], 0); // shape
    await assertSelectedBound(page, [650, 650, 150, 150], 1); // group
    await assertSelectedBound(page, [450, 450, 400, 400], 2); // frame

    await clickView(page, [460, 460]);
    await dragBetweenViewCoords(page, [460, 460], [510, 510]);

    await selectAllByKeyboard(page);
    await assertSelectedBound(page, [650, 650, 100, 100], 0); // shape
    await assertSelectedBound(page, [700, 700, 150, 150], 1); // group
    await assertSelectedBound(page, [500, 500, 400, 400], 2); // frame
  });

  test('duplicate element in frame', async ({ page }) => {
    await createFrame(page, [50, 50], [450, 450]);
    await createShapeElement(page, [100, 100], [200, 200], Shape.Square);
    await pressEscape(page);

    await clickView(page, [60, 60]);
    await page.locator('edgeless-more-button').click();
    await page.locator('editor-menu-action', { hasText: 'Duplicate' }).click();
    await pressEscape(page);

    await shiftClickView(page, [60, 60]);
    await shiftClickView(page, [150, 150]);
    await pressBackspace(page);

    await selectAllByKeyboard(page);
    await assertSelectedBound(page, [510, 100, 100, 100], 0); // shape
    await assertSelectedBound(page, [460, 50, 400, 400], 1); // frame
  });

  test('copy of element by alt/option dragging in frame should belong to frame', async ({
    page,
  }) => {
    await createFrame(page, [50, 50], [450, 450]);
    await createShapeElement(page, [100, 100], [200, 200], Shape.Square);
    await pressEscape(page);

    await clickView(page, [150, 150]);
    await page.keyboard.down('Alt');
    await dragBetweenViewCoords(page, [150, 150], [250, 250]);

    await page.keyboard.up('Alt');

    await selectAllByKeyboard(page);
    await assertSelectedBound(page, [100, 100, 100, 100], 0); // shape
    await assertSelectedBound(page, [200, 200, 100, 100], 1); // shape
    await assertSelectedBound(page, [50, 50, 400, 400], 2); // frame

    await clickView(page, [60, 60]);
    await dragBetweenViewCoords(page, [60, 60], [110, 110]);

    await selectAllByKeyboard(page);
    await assertSelectedBound(page, [150, 150, 100, 100], 0); // shape
    await assertSelectedBound(page, [250, 250, 100, 100], 1); // shape
    await assertSelectedBound(page, [100, 100, 400, 400], 2); // frame
  });

  test('copy of element by alt/option dragging out of frame should not belong to frame', async ({
    page,
  }) => {
    await createFrame(page, [50, 50], [450, 450]);
    await createShapeElement(page, [100, 100], [200, 200], Shape.Square);
    await pressEscape(page);

    await clickView(page, [150, 150]);
    await page.keyboard.down('Alt');
    await dragBetweenViewCoords(page, [150, 150], [550, 550]);

    await page.keyboard.up('Alt');

    await selectAllByKeyboard(page);
    await assertSelectedBound(page, [100, 100, 100, 100], 0); // shape
    await assertSelectedBound(page, [500, 500, 100, 100], 1); // shape
    await assertSelectedBound(page, [50, 50, 400, 400], 2); // frame

    await clickView(page, [60, 60]);
    await dragBetweenViewCoords(page, [60, 60], [110, 110]);

    await selectAllByKeyboard(page);
    await assertSelectedBound(page, [150, 150, 100, 100], 0); // shape
    await assertSelectedBound(page, [500, 500, 100, 100], 1); // shape
    await assertSelectedBound(page, [100, 100, 400, 400], 2); // frame
  });
});
