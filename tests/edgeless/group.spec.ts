import { expect, type Page } from '@playwright/test';
import { captureHistory } from 'utils/actions/misc.js';

import { clickView, dblclickView } from '../utils/actions/click.js';
import {
  createShapeElement,
  dragBetweenViewCoords,
  edgelessCommonSetup,
  getIds,
  getSelectedBound,
  Shape,
  shiftClickView,
  toViewCoord,
  triggerComponentToolbarAction,
} from '../utils/actions/edgeless.js';
import {
  copyByKeyboard,
  pasteByKeyboard,
  pressBackspace,
  pressEnter,
  redoByKeyboard,
  selectAllByKeyboard,
  SHORT_KEY,
  type,
  undoByKeyboard,
} from '../utils/actions/keyboard.js';
import {
  assertCanvasElementsCount,
  assertEdgelessCanvasText,
  assertEdgelessNonSelectedRect,
  assertGroupChildrenIds,
  assertGroupIds,
  assertSelectedBound,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

export const GROUP_ROOT_ID = 'GROUP_ROOT';

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
      await triggerComponentToolbarAction(page, 'ungroup');
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
      await assertGroupIds(page, [
        ids[4],
        ids[4],
        ids[3],
        GROUP_ROOT_ID,
        ids[3],
      ]);
      await assertGroupChildrenIds(page, [ids[2], ids[4]]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]], 1);

      await undoByKeyboard(page);
      await assertGroupIds(page, [ids[3], ids[3], ids[3], GROUP_ROOT_ID]);
      await assertGroupChildrenIds(page, [ids[0], ids[1], ids[2]]);

      await redoByKeyboard(page);
      await assertGroupIds(page, [
        ids[4],
        ids[4],
        ids[3],
        GROUP_ROOT_ID,
        ids[3],
      ]);
      await assertGroupChildrenIds(page, [ids[2], ids[4]]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]], 1);
    });

    test('ungroup in group', async ({ page }) => {
      await clickView(page, [50, 50]);
      await shiftClickView(page, [150, 50]);
      await triggerComponentToolbarAction(page, 'addGroup');
      await captureHistory(page);
      const ids = await getIds(page);
      await triggerComponentToolbarAction(page, 'ungroup');
      await assertGroupIds(page, [ids[3], ids[3], ids[3], GROUP_ROOT_ID]);
      await assertGroupChildrenIds(page, [ids[0], ids[1], ids[2]]);

      await undoByKeyboard(page);
      await assertGroupIds(page, [
        ids[4],
        ids[4],
        ids[3],
        GROUP_ROOT_ID,
        ids[3],
      ]);
      await assertGroupChildrenIds(page, [ids[2], ids[4]]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]], 1);

      await redoByKeyboard(page);
      await assertGroupIds(page, [ids[3], ids[3], ids[3], GROUP_ROOT_ID]);
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
      await assertGroupIds(page, [
        GROUP_ROOT_ID,
        ids[3],
        ids[3],
        GROUP_ROOT_ID,
      ]);
      await assertGroupChildrenIds(page, [ids[1], ids[2]]);
      await assertSelectedBound(page, [0, 0, 100, 100]);

      await undoByKeyboard(page);
      await assertGroupIds(page, [ids[3], ids[3], ids[3], GROUP_ROOT_ID]);
      await assertGroupChildrenIds(page, [ids[0], ids[1], ids[2]]);
      await assertSelectedBound(page, [0, 0, 100, 100]);

      await redoByKeyboard(page);
      await assertGroupIds(page, [
        GROUP_ROOT_ID,
        ids[3],
        ids[3],
        GROUP_ROOT_ID,
      ]);
      await assertGroupChildrenIds(page, [ids[1], ids[2]]);
      await assertSelectedBound(page, [0, 0, 100, 100]);
    });

    test('release group from group', async ({ page }) => {
      await clickView(page, [50, 50]);
      await shiftClickView(page, [150, 50]);
      await triggerComponentToolbarAction(page, 'addGroup');
      await captureHistory(page);

      const ids = await getIds(page);
      await assertGroupIds(page, [
        ids[4],
        ids[4],
        ids[3],
        GROUP_ROOT_ID,
        ids[3],
      ]);
      await assertGroupChildrenIds(page, [ids[2], ids[4]]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]], 1);

      await triggerComponentToolbarAction(page, 'releaseFromGroup');
      await assertGroupIds(page, [
        ids[4],
        ids[4],
        ids[3],
        GROUP_ROOT_ID,
        GROUP_ROOT_ID,
      ]);
      await assertGroupChildrenIds(page, [ids[2]]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]], 1);

      await undoByKeyboard(page);
      await assertGroupIds(page, [
        ids[4],
        ids[4],
        ids[3],
        GROUP_ROOT_ID,
        ids[3],
      ]);
      await assertGroupChildrenIds(page, [ids[2], ids[4]]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]], 1);

      await redoByKeyboard(page);
      await assertGroupIds(page, [
        ids[4],
        ids[4],
        ids[3],
        GROUP_ROOT_ID,
        GROUP_ROOT_ID,
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
      await assertCanvasElementsCount(page, 0);

      await undoByKeyboard(page);
      await assertCanvasElementsCount(page, 3);
      await assertGroupIds(page, [ids[2], ids[2], GROUP_ROOT_ID]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]]);

      await redoByKeyboard(page);
      await assertCanvasElementsCount(page, 0);
    });

    test('delete sub-element in group', async ({ page }) => {
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
      const ids = await getIds(page);
      await captureHistory(page);
      await clickView(page, [50, 50]);
      await pressBackspace(page);
      await assertCanvasElementsCount(page, 2);
      await assertGroupIds(page, [ids[2], GROUP_ROOT_ID]);
      await assertGroupChildrenIds(page, [ids[1]]);

      await undoByKeyboard(page);
      await assertCanvasElementsCount(page, 3);
      await assertGroupIds(page, [ids[2], GROUP_ROOT_ID, ids[2]]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]]);

      await redoByKeyboard(page);
      await assertCanvasElementsCount(page, 2);
      await assertGroupIds(page, [ids[2], GROUP_ROOT_ID]);
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
      await assertCanvasElementsCount(page, 2);
      await assertGroupIds(page, [ids[3], GROUP_ROOT_ID]);
      await assertGroupChildrenIds(page, [ids[2]]);

      await undoByKeyboard(page);
      await assertCanvasElementsCount(page, 5);
      await assertGroupIds(page, [
        ids[3],
        GROUP_ROOT_ID,
        ids[4],
        ids[4],
        ids[3],
      ]);
      await assertGroupChildrenIds(page, [ids[2], ids[4]]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]], 1);

      await redoByKeyboard(page);
      await assertCanvasElementsCount(page, 2);
      await assertGroupIds(page, [ids[3], GROUP_ROOT_ID]);
      await assertGroupChildrenIds(page, [ids[2]]);
    });
  });

  test.describe('group title', () => {
    test.beforeEach(async ({ page }) => {
      await init(page);
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
    });

    test('edit group title by component toolbar', async ({ page }) => {
      expect(await page.locator('edgeless-group-title-editor').count()).toBe(0);

      await triggerComponentToolbarAction(page, 'renameGroup');
      await page.locator('edgeless-group-title-editor').waitFor({
        state: 'attached',
      });
    });

    test('edit group title by dbclick', async ({ page }) => {
      expect(await page.locator('edgeless-group-title-editor').count()).toBe(0);

      const bound = await getSelectedBound(page);
      await dblclickView(page, [bound[0] + 10, bound[1] - 10]);
      await page.locator('edgeless-group-title-editor').waitFor({
        state: 'attached',
      });
      await type(page, 'ABC');
      await assertEdgelessCanvasText(page, 'ABC');
    });

    test('blur unmount group editor', async ({ page }) => {
      const bound = await getSelectedBound(page);
      await dblclickView(page, [bound[0] + 10, bound[1] - 10]);

      await page.locator('edgeless-group-title-editor').waitFor({
        state: 'attached',
      });
      await page.mouse.click(10, 10);
      expect(await page.locator('edgeless-group-title-editor').count()).toBe(0);
    });

    test('enter unmount group editor', async ({ page }) => {
      const bound = await getSelectedBound(page);
      await dblclickView(page, [bound[0] + 10, bound[1] - 10]);

      await page.locator('edgeless-group-title-editor').waitFor({
        state: 'attached',
      });
      await pressEnter(page);
      expect(await page.locator('edgeless-group-title-editor').count()).toBe(0);
    });
  });

  test.describe('clipboard', () => {
    test('copy and paste group', async ({ page }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await createShapeElement(page, [100, 0], [200, 100], Shape.Square);
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');

      await copyByKeyboard(page);
      const move = await toViewCoord(page, [100, -50]);
      await page.mouse.click(move[0], move[1]);
      await pasteByKeyboard(page, false);

      const ids = await getIds(page);
      await assertGroupIds(page, [
        ids[2],
        ids[2],
        GROUP_ROOT_ID,
        ids[5],
        ids[5],
        GROUP_ROOT_ID,
      ]);
      await assertGroupChildrenIds(page, [ids[0], ids[1]]);
      await assertGroupChildrenIds(page, [ids[3], ids[4]], 1);
    });
  });
});
