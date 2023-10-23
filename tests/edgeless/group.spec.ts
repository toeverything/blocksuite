import { expect, type Page } from '@playwright/test';
import { captureHistory } from 'utils/actions/misc.js';
import { groupRootId } from 'utils/constants.js';

import { clickView } from '../utils/actions/click.js';
import {
  createShapeElement,
  dragBetweenViewCoords,
  edgelessCommonSetup,
  getIds,
  Shape,
  shiftClickView,
  triggerComponentToolbarAction,
} from '../utils/actions/edgeless.js';
import {
  pressBackspace,
  redoByKeyboard,
  selectAllByKeyboard,
  SHORT_KEY,
  undoByKeyboard,
} from '../utils/actions/keyboard.js';
import {
  assertEdgelessNonSelectedRect,
  assertGroupChildrenIds,
  assertGroupIds,
  assertPhasorElementsCount,
  assertSelectedBound,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test.describe('group', () => {
  async function init(page: Page) {
    await edgelessCommonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [100, 0], [200, 100], Shape.Square);
  }

  test.describe('group create', () => {
    test.beforeEach(async ({ page }) => {
      await init(page);
    });

    test('create group button not show when single select', async ({
      page,
    }) => {
      await clickView(page, [50, 50]);
      await expect(page.locator('edgeless-component-toolbar')).toBeVisible();
      await expect(page.locator('edgeless-add-group-button')).not.toBeVisible();
    });

    test('create button show up when multi select', async ({ page }) => {
      await selectAllByKeyboard(page);
      await expect(page.locator('edgeless-add-group-button')).toBeVisible();
    });

    test('create group by component toolbar', async ({ page }) => {
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
      await assertSelectedBound(page, [0, 0, 200, 100]);
    });

    test('create group by shortcut mod + G', async ({ page }) => {
      await selectAllByKeyboard(page);
      await page.keyboard.press(`${SHORT_KEY}+g`);
      await assertSelectedBound(page, [0, 0, 200, 100]);
    });

    test('create group and undo, redo', async ({ page }) => {
      await selectAllByKeyboard(page);
      await captureHistory(page);
      await page.keyboard.press(`${SHORT_KEY}+g`);
      await assertSelectedBound(page, [0, 0, 200, 100]);
      await undoByKeyboard(page);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await redoByKeyboard(page);
      await assertSelectedBound(page, [0, 0, 200, 100]);
    });
  });

  test.describe('ungroup', () => {
    test.beforeEach(async ({ page }) => {
      await init(page);
    });

    test('ungroup by component toolbar', async ({ page }) => {
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
      await assertSelectedBound(page, [0, 0, 200, 100]);
      await triggerComponentToolbarAction(page, 'unGroup');
      await assertEdgelessNonSelectedRect(page);
    });

    test('ungroup by shortcut mod + shift + G', async ({ page }) => {
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
      await assertSelectedBound(page, [0, 0, 200, 100]);
      await page.keyboard.press(`${SHORT_KEY}+Shift+g`);
      await assertEdgelessNonSelectedRect(page);
    });

    test('ungroup and undo, redo', async ({ page }) => {
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
      await assertSelectedBound(page, [0, 0, 200, 100]);
      await captureHistory(page);
      await page.keyboard.press(`${SHORT_KEY}+Shift+g`);
      await assertEdgelessNonSelectedRect(page);
      await undoByKeyboard(page);
      await assertSelectedBound(page, [0, 0, 200, 100]);
      await redoByKeyboard(page);
      await assertEdgelessNonSelectedRect(page);
    });
  });

  test.describe('drag group', () => {
    test.beforeEach(async ({ page }) => {
      await init(page);
    });

    test('drag group to move', async ({ page }) => {
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
      await dragBetweenViewCoords(page, [100, 50], [110, 50]);
      await assertSelectedBound(page, [10, 0, 200, 100]);
    });
  });

  test.describe('select', () => {
    test.beforeEach(async ({ page }) => {
      await init(page);
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
    });

    test('select group by click', async ({ page }) => {
      await page.pause();
      await clickView(page, [300, -100]);
      await assertEdgelessNonSelectedRect(page);
      await clickView(page, [50, 50]);
      await assertSelectedBound(page, [0, 0, 200, 100]);
    });

    test('select sub-element by first select group', async ({ page }) => {
      await clickView(page, [50, 50]);
      await assertSelectedBound(page, [0, 0, 100, 100]);
    });

    test('select element when enter gorup', async ({ page }) => {
      await clickView(page, [50, 50]);
      await assertSelectedBound(page, [0, 0, 100, 100]);
      await clickView(page, [150, 50]);
      await assertSelectedBound(page, [100, 0, 100, 100]);
    });
  });

  test.describe('group and ungroup in group', () => {
    test.beforeEach(async ({ page }) => {
      await init(page);
      await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
    });

    test('group in group', async ({ page }) => {
      await clickView(page, [50, 50]);
      await shiftClickView(page, [150, 50]);
      await captureHistory(page);
      await triggerComponentToolbarAction(page, 'addGroup');
      await assertSelectedBound(page, [0, 0, 200, 100]);
      const ids = await getIds(page);
      await assertGroupIds(page, [ids[4], ids[4], ids[3], groupRootId, ids[3]]);
      await assertGroupChildrenIds(page, [ids[2], ids[4]]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]], 1);

      await undoByKeyboard(page);
      await assertGroupIds(page, [ids[3], ids[3], ids[3], groupRootId]);
      await assertGroupChildrenIds(page, [ids[0], ids[1], ids[2]]);

      await redoByKeyboard(page);
      await assertGroupIds(page, [ids[4], ids[4], ids[3], groupRootId, ids[3]]);
      await assertGroupChildrenIds(page, [ids[2], ids[4]]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]], 1);
    });

    test('ungroup in group', async ({ page }) => {
      await clickView(page, [50, 50]);
      await shiftClickView(page, [150, 50]);
      await triggerComponentToolbarAction(page, 'addGroup');
      await captureHistory(page);
      const ids = await getIds(page);
      await triggerComponentToolbarAction(page, 'unGroup');
      await assertGroupIds(page, [ids[3], ids[3], ids[3], groupRootId]);
      await assertGroupChildrenIds(page, [ids[0], ids[1], ids[2]]);

      await undoByKeyboard(page);
      await assertGroupIds(page, [ids[4], ids[4], ids[3], groupRootId, ids[3]]);
      await assertGroupChildrenIds(page, [ids[2], ids[4]]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]], 1);

      await redoByKeyboard(page);
      await assertGroupIds(page, [ids[3], ids[3], ids[3], groupRootId]);
      await assertGroupChildrenIds(page, [ids[0], ids[1], ids[2]]);
    });
  });

  test.describe('release from group', () => {
    test.beforeEach(async ({ page }) => {
      await init(page);
      await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
    });

    test('release element from group', async ({ page }) => {
      await clickView(page, [50, 50]);
      await captureHistory(page);
      await triggerComponentToolbarAction(page, 'releaseFromGroup');
      const ids = await getIds(page);
      await assertGroupIds(page, [groupRootId, ids[3], ids[3], groupRootId]);
      await assertGroupChildrenIds(page, [ids[1], ids[2]]);
      await assertSelectedBound(page, [0, 0, 100, 100]);

      await undoByKeyboard(page);
      await assertGroupIds(page, [ids[3], ids[3], ids[3], groupRootId]);
      await assertGroupChildrenIds(page, [ids[0], ids[1], ids[2]]);
      await assertSelectedBound(page, [0, 0, 100, 100]);

      await redoByKeyboard(page);
      await assertGroupIds(page, [groupRootId, ids[3], ids[3], groupRootId]);
      await assertGroupChildrenIds(page, [ids[1], ids[2]]);
      await assertSelectedBound(page, [0, 0, 100, 100]);
    });

    test('release group from group', async ({ page }) => {
      await clickView(page, [50, 50]);
      await shiftClickView(page, [150, 50]);
      await triggerComponentToolbarAction(page, 'addGroup');
      await captureHistory(page);

      const ids = await getIds(page);
      await assertGroupIds(page, [ids[4], ids[4], ids[3], groupRootId, ids[3]]);
      await assertGroupChildrenIds(page, [ids[2], ids[4]]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]], 1);

      await triggerComponentToolbarAction(page, 'releaseFromGroup');
      await assertGroupIds(page, [
        ids[4],
        ids[4],
        ids[3],
        groupRootId,
        groupRootId,
      ]);
      await assertGroupChildrenIds(page, [ids[2]]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]], 1);

      await undoByKeyboard(page);
      await assertGroupIds(page, [ids[4], ids[4], ids[3], groupRootId, ids[3]]);
      await assertGroupChildrenIds(page, [ids[2], ids[4]]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]], 1);

      await redoByKeyboard(page);
      await assertGroupIds(page, [
        ids[4],
        ids[4],
        ids[3],
        groupRootId,
        groupRootId,
      ]);
      await assertGroupChildrenIds(page, [ids[2]]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]], 1);
    });
  });

  test.describe('delete', () => {
    test.beforeEach(async ({ page }) => {
      await init(page);
    });

    test('delete root group', async ({ page }) => {
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
      const ids = await getIds(page);
      await captureHistory(page);
      await pressBackspace(page);
      await assertPhasorElementsCount(page, 0);

      await undoByKeyboard(page);
      await assertPhasorElementsCount(page, 3);
      await assertGroupIds(page, [ids[2], ids[2], groupRootId]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]]);

      await redoByKeyboard(page);
      await assertPhasorElementsCount(page, 0);
    });

    test('delete sub-element in group', async ({ page }) => {
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
      const ids = await getIds(page);
      await captureHistory(page);
      await clickView(page, [50, 50]);
      await pressBackspace(page);
      await assertPhasorElementsCount(page, 2);
      await assertGroupIds(page, [ids[2], groupRootId]);
      await assertGroupChildrenIds(page, [ids[1]]);

      await undoByKeyboard(page);
      await assertPhasorElementsCount(page, 3);
      await assertGroupIds(page, [ids[2], groupRootId, ids[2]]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]]);

      await redoByKeyboard(page);
      await assertPhasorElementsCount(page, 2);
      await assertGroupIds(page, [ids[2], groupRootId]);
      await assertGroupChildrenIds(page, [ids[1]]);
    });

    test('delete group in group', async ({ page }) => {
      await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
      await clickView(page, [50, 50]);
      await shiftClickView(page, [150, 50]);
      await triggerComponentToolbarAction(page, 'addGroup');
      await captureHistory(page);

      const ids = await getIds(page);
      await pressBackspace(page);
      await assertPhasorElementsCount(page, 2);
      await assertGroupIds(page, [ids[3], groupRootId]);
      await assertGroupChildrenIds(page, [ids[2]]);

      await undoByKeyboard(page);
      await assertPhasorElementsCount(page, 5);
      await assertGroupIds(page, [ids[3], groupRootId, ids[4], ids[4], ids[3]]);
      await assertGroupChildrenIds(page, [ids[2], ids[4]]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]], 1);

      await redoByKeyboard(page);
      await assertPhasorElementsCount(page, 2);
      await assertGroupIds(page, [ids[3], groupRootId]);
      await assertGroupChildrenIds(page, [ids[2]]);
    });
  });

  // test('edit frame title', async ({ page }) => {
  //   await autoFit(page);
  //   expect(await page.locator('edgeless-frame-title-editor').count()).toBe(0);
  //   await dblclickView(page, [-300 + 5, -270 - 20]);
  //   await page.locator('edgeless-frame-title-editor').waitFor({
  //     state: 'attached',
  //   });
  //   await type(page, 'ABC');
  //   await assertEdgelessCanvasText(page, 'ABC');
  // });

  // test('blur unmount frame editor', async ({ page }) => {
  //   await autoFit(page);
  //   await dblclickView(page, [-300 + 5, -270 - 20]);
  //   await page.locator('edgeless-frame-title-editor').waitFor({
  //     state: 'attached',
  //   });
  //   await page.mouse.click(10, 10);
  //   expect(await page.locator('edgeless-frame-title-editor').count()).toBe(0);
  // });

  // test('enter unmount frame editor', async ({ page }) => {
  //   await autoFit(page);
  //   await dblclickView(page, [-300 + 5, -270 - 20]);
  //   await page.locator('edgeless-frame-title-editor').waitFor({
  //     state: 'attached',
  //   });
  //   await pressEnter(page);
  //   expect(await page.locator('edgeless-frame-title-editor').count()).toBe(0);
  // });
});
