import { expect, type Page } from '@playwright/test';

import { clickView } from '../../utils/actions/click.js';
import {
  createFrame as _createFrame,
  addNote,
  autoFit,
  createShapeElement,
  dragBetweenViewCoords,
  edgelessCommonSetup,
  setEdgelessTool,
  Shape,
  shiftClickView,
  toViewCoord,
  triggerComponentToolbarAction,
  zoomResetByKeyboard,
} from '../../utils/actions/edgeless.js';
import {
  pressBackspace,
  pressEscape,
  selectAllByKeyboard,
  SHORT_KEY,
} from '../../utils/actions/keyboard.js';
import { assertSelectedBound } from '../../utils/asserts.js';
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

test.describe('add a frame then drag to move', () => {
  const createThreeShapesAndSelectTowShape = async (page: Page) => {
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [100, 0], [200, 100], Shape.Square);
    await createShapeElement(page, [200, 0], [300, 100], Shape.Square);

    await clickView(page, [50, 50]);
    await shiftClickView(page, [150, 50]);
  };

  const assertFrameHasTwoShapeChildren = async (page: Page) => {
    await page.waitForTimeout(500);
    await dragBetweenViewCoords(page, [50, 50], [100, 50]);

    await selectAllByKeyboard(page);
    await assertSelectedBound(page, [50, 0, 100, 100], 0);
    await assertSelectedBound(page, [150, 0, 100, 100], 1);
    // the third shape should not be moved
    await assertSelectedBound(page, [200, 0, 100, 100], 2);
  };

  test('multi select and add frame by shortcut F', async ({ page }) => {
    await createThreeShapesAndSelectTowShape(page);
    await page.keyboard.press('f');

    await expect(page.locator('affine-frame')).toHaveCount(1);
    await assertSelectedBound(page, [-300, -270, 800, 640]);

    await assertFrameHasTwoShapeChildren(page);
  });

  test('multi select and add frame by component toolbar', async ({ page }) => {
    await createThreeShapesAndSelectTowShape(page);
    await triggerComponentToolbarAction(page, 'addFrame');

    await expect(page.locator('affine-frame')).toHaveCount(1);
    await assertSelectedBound(page, [-300, -270, 800, 640]);

    await assertFrameHasTwoShapeChildren(page);
  });

  test('multi select and add frame by more option create frame', async ({
    page,
  }) => {
    await createThreeShapesAndSelectTowShape(page);
    await triggerComponentToolbarAction(page, 'createFrameOnMoreOption');

    await expect(page.locator('affine-frame')).toHaveCount(1);
    await assertSelectedBound(page, [-300, -270, 800, 640]);

    await assertFrameHasTwoShapeChildren(page);
  });

  test('multi select add frame by edgeless toolbar', async ({ page }) => {
    await createThreeShapesAndSelectTowShape(page);
    await autoFit(page);
    await setEdgelessTool(page, 'frame');
    const frameMenu = page.locator('edgeless-frame-menu');
    await expect(frameMenu).toBeVisible();
    const button = page.locator('.frame-add-button[data-name="1:1"]');
    await button.click();
    await assertSelectedBound(page, [-450, -550, 1200, 1200]);

    await dragBetweenViewCoords(page, [50, 50], [100, 50]);

    await selectAllByKeyboard(page);
    await assertSelectedBound(page, [50, 0, 100, 100], 0);
    await assertSelectedBound(page, [150, 0, 100, 100], 1);
    // the third shape should be moved
    await assertSelectedBound(page, [250, 0, 100, 100], 2);
  });

  test('add frame by dragging with shortcut F', async ({ page }) => {
    await createThreeShapesAndSelectTowShape(page);
    await pressEscape(page); // unselect

    await page.keyboard.press('f');
    await dragBetweenViewCoords(page, [-10, -10], [210, 110]);

    await expect(page.locator('affine-frame')).toHaveCount(1);
    await assertSelectedBound(page, [-10, -10, 220, 120]);

    await assertFrameHasTwoShapeChildren(page);
  });
});

test.describe('add element to frame and then move frame', () => {
  test.describe('add single element', () => {
    test('element should be moved since it is created in frame', async ({
      page,
    }) => {
      await createFrame(page, [50, 50], [550, 550]);
      await createShapeElement(page, [100, 100], [200, 200], Shape.Square);
      const noteCoord = await toViewCoord(page, [200, 200]);
      await addNote(page, '', noteCoord[0], noteCoord[1]);
      await pressEscape(page);

      await clickView(page, [60, 60]);
      await dragBetweenViewCoords(page, [60, 60], [110, 110]);

      await selectAllByKeyboard(page);
      await assertSelectedBound(page, [150, 150, 100, 100], 0); // shape
      await assertSelectedBound(page, [100, 100, 500, 500], 1); // frame
      await assertSelectedBound(page, [220, 210, 448, 92], 2); // note
    });

    test('element should be not moved since it is created not in frame', async ({
      page,
    }) => {
      await createFrame(page, [50, 50], [550, 550]);
      await createShapeElement(page, [600, 600], [500, 500], Shape.Square);
      await pressEscape(page);

      await clickView(page, [60, 60]);
      await dragBetweenViewCoords(page, [60, 60], [110, 110]);

      await selectAllByKeyboard(page);
      await assertSelectedBound(page, [500, 500, 100, 100], 0); // shape
      await assertSelectedBound(page, [100, 100, 500, 500], 1); // frame
    });
  });

  test.describe('add group', () => {
    // Group
    // |<150px>|
    // ┌────┐    ─
    // │  ┌─┼──┐ 150 px
    // └──┼─┘  │ |
    //    └────┘ ─

    test('group should be moved since it is fully contained in frame', async ({
      page,
    }) => {
      await createFrame(page, [50, 50], [550, 550]);
      await createShapeElement(page, [100, 100], [200, 200], Shape.Square);
      await createShapeElement(page, [150, 150], [250, 250], Shape.Square);
      await pressEscape(page);

      await shiftClickView(page, [110, 110]);
      await shiftClickView(page, [160, 160]);
      await page.keyboard.press(`${SHORT_KEY}+g`);
      await pressEscape(page);

      await clickView(page, [60, 60]);
      await dragBetweenViewCoords(page, [60, 60], [110, 110]);

      await selectAllByKeyboard(page);
      await assertSelectedBound(page, [150, 150, 150, 150], 0); // group
      await assertSelectedBound(page, [100, 100, 500, 500], 1); // frame
    });
    test('group should be moved since its center is in frame', async ({
      page,
    }) => {
      await createFrame(page, [50, 50], [550, 550]);
      await createShapeElement(page, [450, 450], [550, 550], Shape.Square);
      await createShapeElement(page, [500, 500], [600, 600], Shape.Square);
      await pressEscape(page);

      await shiftClickView(page, [460, 460]);
      await shiftClickView(page, [510, 510]);
      await page.keyboard.press(`${SHORT_KEY}+g`);
      await pressEscape(page);

      await clickView(page, [60, 60]);
      await dragBetweenViewCoords(page, [60, 60], [110, 110]);

      await selectAllByKeyboard(page);
      // since the new group center is in the frame, so the group is not child of frame
      await assertSelectedBound(page, [500, 500, 150, 150], 0); // group
      await assertSelectedBound(page, [100, 100, 500, 500], 1); // frame
    });

    test('group should not be moved since its center is not in frame', async ({
      page,
    }) => {
      await createFrame(page, [50, 50], [550, 550]);
      await createShapeElement(page, [500, 500], [600, 600], Shape.Square);
      await createShapeElement(page, [550, 550], [650, 650], Shape.Square);
      await pressEscape(page);

      await shiftClickView(page, [510, 510]);
      await shiftClickView(page, [560, 560]);
      await page.keyboard.press(`${SHORT_KEY}+g`);

      await clickView(page, [60, 60]);
      await dragBetweenViewCoords(page, [60, 60], [110, 110]);

      await selectAllByKeyboard(page);
      // since the new group center is not in the frame, so the group is not child of frame
      await assertSelectedBound(page, [500, 500, 150, 150], 0); // group
      await assertSelectedBound(page, [100, 100, 500, 500], 1); // frame
    });
  });

  test.describe('add inner frame', () => {
    test('the inner frame and its children should be moved since it is fully contained in frame', async ({
      page,
    }) => {
      await createFrame(page, [50, 50], [550, 550]);
      await pressEscape(page);
      await createFrame(page, [100, 100], [300, 300]);
      await pressEscape(page);
      await createShapeElement(page, [150, 150], [250, 250], Shape.Square);
      await pressEscape(page);

      await clickView(page, [60, 60]);
      await dragBetweenViewCoords(page, [60, 60], [110, 110]);

      await selectAllByKeyboard(page);
      await assertSelectedBound(page, [200, 200, 100, 100], 0); // shape
      await assertSelectedBound(page, [100, 100, 500, 500], 1); // frame
      await assertSelectedBound(page, [150, 150, 200, 200], 2); // inner frame
    });

    test('the inner frame and its children should  be moved since its center is in frame', async ({
      page,
    }) => {
      await createFrame(page, [50, 50], [550, 550]);
      await pressEscape(page);
      await createFrame(page, [400, 400], [600, 600]);
      await pressEscape(page);
      await createShapeElement(page, [550, 550], [600, 600], Shape.Square);
      await pressEscape(page);

      await clickView(page, [60, 60]);
      await dragBetweenViewCoords(page, [60, 60], [110, 110]);

      await selectAllByKeyboard(page);
      await assertSelectedBound(page, [600, 600, 50, 50], 0); // shape
      await assertSelectedBound(page, [100, 100, 500, 500], 1); // frame
      await assertSelectedBound(page, [450, 450, 200, 200], 2); // inner frame
    });

    test('the inner frame and its children should also be moved even though its center is not in frame', async ({
      page,
    }) => {
      await createFrame(page, [50, 50], [550, 550]);
      await pressEscape(page);
      await createFrame(page, [500, 500], [600, 600]);
      await pressEscape(page);
      await createShapeElement(page, [550, 550], [600, 600], Shape.Square);
      await pressEscape(page);

      await clickView(page, [60, 60]);
      await dragBetweenViewCoords(page, [60, 60], [110, 110]);

      await selectAllByKeyboard(page);
      await assertSelectedBound(page, [600, 600, 50, 50], 0); // shape
      await assertSelectedBound(page, [100, 100, 500, 500], 1); // frame
      await assertSelectedBound(page, [550, 550, 100, 100], 2); // inner frame
    });
  });
});

test.describe('resize frame then move ', () => {
  test('resize frame to warp shape', async ({ page }) => {
    await createFrame(page, [50, 50], [150, 150]);
    await createShapeElement(page, [200, 200], [300, 300], Shape.Square);
    await pressEscape(page);

    await clickView(page, [60, 60]);
    await dragBetweenViewCoords(page, [150, 150], [450, 450]);

    await dragBetweenViewCoords(page, [60, 60], [110, 110]);

    await selectAllByKeyboard(page);
    await assertSelectedBound(page, [250, 250, 100, 100], 0); // shape
    await assertSelectedBound(page, [100, 100, 400, 400], 1); // frame
  });

  test('resize frame to unwrap shape', async ({ page }) => {
    await createFrame(page, [50, 50], [450, 450]);
    await createShapeElement(page, [200, 200], [300, 300], Shape.Square);
    await pressEscape(page);

    await clickView(page, [60, 60]);
    await dragBetweenViewCoords(page, [450, 450], [150, 150]);

    await dragBetweenViewCoords(page, [60, 60], [110, 110]);

    await selectAllByKeyboard(page);
    await assertSelectedBound(page, [200, 200, 100, 100], 0); // shape
    await assertSelectedBound(page, [100, 100, 100, 100], 1); // frame
  });
});

test('delete frame', async ({ page }) => {
  await createFrame(page, [50, 50], [450, 450]);
  await createShapeElement(page, [200, 200], [300, 300], Shape.Square);
  await pressEscape(page);

  await clickView(page, [60, 60]);
  await pressBackspace(page);
  await expect(page.locator('affine-frame')).toHaveCount(0);

  await selectAllByKeyboard(page);
  await assertSelectedBound(page, [200, 200, 100, 100], 0);
});
