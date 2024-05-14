import { expect, type Page } from '@playwright/test';

import { clickView, dblclickView } from '../utils/actions/click.js';
import {
  createConnectorElement,
  createShapeElement,
  dragBetweenViewCoords,
  edgelessCommonSetup,
  getFirstGroupId,
  getIds,
  getSelectedBound,
  Shape,
  shiftClickView,
  toIdCountMap,
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
import { captureHistory, waitNextFrame } from '../utils/actions/misc.js';
import {
  assertCanvasElementsCount,
  assertEdgelessCanvasText,
  assertEdgelessNonSelectedRect,
  assertGroupChildren,
  assertGroupChildrenIds,
  assertGroupIds,
  assertSelectedBound,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

export const GROUP_ROOT_ID = 'GROUP_ROOT';

test.describe('group', () => {
  let initShapes: string[] = [];
  async function init(page: Page) {
    await edgelessCommonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [100, 0], [200, 100], Shape.Square);
    initShapes = await getIds(page);
  }

  test.describe('group create', () => {
    test.beforeEach(async ({ page }) => {
      await init(page);
    });

    test('create group button not show when single select', async ({
      page,
    }) => {
      await clickView(page, [50, 50]);
      await expect(
        page.locator('edgeless-element-toolbar-widget')
      ).toBeVisible();
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
    let outterGroupId: string;
    let newAddedShape: string;

    test.beforeEach(async ({ page }) => {
      await init(page);
      await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
      newAddedShape = (await getIds(page)).filter(
        id => !initShapes.includes(id)
      )[0];
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
      outterGroupId = await getFirstGroupId(page);
    });

    test('group in group', async ({ page }) => {
      await clickView(page, [50, 50]);
      await shiftClickView(page, [150, 50]);
      await captureHistory(page);
      await triggerComponentToolbarAction(page, 'addGroup');
      const groupId = await getFirstGroupId(page, [outterGroupId]);
      await assertSelectedBound(page, [0, 0, 200, 100]);
      await assertGroupIds(page, {
        [groupId]: 2,
        [outterGroupId]: 2,
        null: 1,
      });
      await assertGroupChildren(page, groupId, 2);
      await assertGroupChildren(page, outterGroupId, 2);

      // undo the creation
      await undoByKeyboard(page);
      await assertGroupIds(page, {
        [outterGroupId]: 3,
        null: 1,
      });
      await assertGroupChildren(page, outterGroupId, 3);

      // redo the creation
      await redoByKeyboard(page);
      await assertGroupIds(page, {
        [groupId]: 2,
        [outterGroupId]: 2,
        null: 1,
      });
      await assertGroupChildren(page, groupId, 2);
      await assertGroupChildren(page, outterGroupId, 2);
    });

    test('ungroup in group', async ({ page }) => {
      await clickView(page, [50, 50]);
      await shiftClickView(page, [150, 50]);
      await triggerComponentToolbarAction(page, 'addGroup');
      await captureHistory(page);
      const groupId = await getFirstGroupId(page, [outterGroupId]);
      await triggerComponentToolbarAction(page, 'ungroup');
      await assertGroupIds(page, { [outterGroupId]: 3, null: 1 });
      await assertGroupChildrenIds(
        page,
        toIdCountMap(await getIds(page, true)),
        outterGroupId
      );

      // undo, group should in group again
      await undoByKeyboard(page);
      await assertGroupIds(page, {
        [outterGroupId]: 2,
        [groupId]: 2,
        null: 1,
      });
      await assertGroupChildrenIds(page, toIdCountMap(initShapes), groupId);
      await assertGroupChildrenIds(
        page,
        {
          [groupId]: 1,
          [newAddedShape]: 1,
        },
        outterGroupId
      );

      // redo, group should be ungroup again
      await redoByKeyboard(page);
      await assertGroupIds(page, { [outterGroupId]: 3, null: 1 });
      await assertGroupChildrenIds(
        page,
        toIdCountMap(await getIds(page, true)),
        outterGroupId
      );
    });
  });

  test.describe('release from group', () => {
    let outterGroupId: string;

    test.beforeEach(async ({ page }) => {
      await init(page);
      await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');

      outterGroupId = await getFirstGroupId(page);
    });

    test('release element from group', async ({ page }) => {
      await clickView(page, [50, 50]);
      await captureHistory(page);
      await triggerComponentToolbarAction(page, 'releaseFromGroup');
      await assertGroupIds(page, {
        [outterGroupId]: 2,
        null: 2,
      });
      await assertGroupChildren(page, outterGroupId, 2);
      await assertSelectedBound(page, [0, 0, 100, 100]);

      // undo the release
      await undoByKeyboard(page);
      await assertGroupIds(page, {
        [outterGroupId]: 3,
        null: 1,
      });
      await assertGroupChildren(page, outterGroupId, 3);
      await assertSelectedBound(page, [0, 0, 100, 100]);

      // redo the release
      await redoByKeyboard(page);
      await assertGroupIds(page, {
        [outterGroupId]: 2,
        null: 2,
      });
      await assertGroupChildren(page, outterGroupId, 2);
      await assertSelectedBound(page, [0, 0, 100, 100]);
    });

    test('release group from group', async ({ page }) => {
      await clickView(page, [50, 50]);
      await shiftClickView(page, [150, 50]);
      await triggerComponentToolbarAction(page, 'addGroup');
      await captureHistory(page);
      const groupId = await getFirstGroupId(page, [outterGroupId]);

      await assertGroupIds(page, {
        [groupId]: 2,
        [outterGroupId]: 2,
        null: 1,
      });
      await assertGroupChildren(page, groupId, 2);
      await assertGroupChildren(page, outterGroupId, 2);

      // release group from group
      await triggerComponentToolbarAction(page, 'releaseFromGroup');
      await assertGroupIds(page, {
        [groupId]: 2,
        [outterGroupId]: 1,
        null: 2,
      });
      await assertGroupChildren(page, outterGroupId, 1);
      await assertGroupChildren(page, groupId, 2);

      // undo the release
      await undoByKeyboard(page);
      await assertGroupIds(page, {
        [groupId]: 2,
        [outterGroupId]: 2,
        null: 1,
      });
      await assertGroupChildren(page, groupId, 2);
      await assertGroupChildren(page, outterGroupId, 2);

      // redo the release
      await redoByKeyboard(page);
      await assertGroupIds(page, {
        [groupId]: 2,
        [outterGroupId]: 1,
        null: 2,
      });
      await assertGroupChildren(page, outterGroupId, 1);
      await assertGroupChildren(page, groupId, 2);
    });
  });

  test.describe('delete', () => {
    test.beforeEach(async ({ page }) => {
      await init(page);
    });

    test('delete root group', async ({ page }) => {
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
      const groupId = await getFirstGroupId(page);
      await captureHistory(page);
      await pressBackspace(page);
      await assertCanvasElementsCount(page, 0);

      // undo the delete
      await undoByKeyboard(page);
      await assertCanvasElementsCount(page, 3);
      await assertGroupIds(page, {
        [groupId]: 2,
        null: 1,
      });
      await assertGroupChildren(page, groupId, 2);

      // redo the delete
      await redoByKeyboard(page);
      await assertCanvasElementsCount(page, 0);
    });

    test('delete sub-element in group', async ({ page }) => {
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
      const groupId = await getFirstGroupId(page);
      await captureHistory(page);
      await clickView(page, [50, 50]);
      await pressBackspace(page);

      await assertCanvasElementsCount(page, 2);
      await assertGroupIds(page, {
        [groupId]: 1,
        null: 1,
      });
      await assertGroupChildren(page, groupId, 1);

      // undo the delete
      await undoByKeyboard(page);
      await assertCanvasElementsCount(page, 3);
      await assertGroupIds(page, {
        [groupId]: 2,
        null: 1,
      });
      await assertGroupChildren(page, groupId, 2);

      // redo the delete
      await redoByKeyboard(page);
      await assertCanvasElementsCount(page, 2);
      await assertGroupIds(page, {
        [groupId]: 1,
        null: 1,
      });
      await assertGroupChildren(page, groupId, 1);
    });

    test('delete group in group', async ({ page }) => {
      await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
      const firstGroup = await getFirstGroupId(page);
      await clickView(page, [50, 50]);
      await shiftClickView(page, [150, 50]);
      await triggerComponentToolbarAction(page, 'addGroup');
      const secondGroup = await getFirstGroupId(page, [firstGroup]);
      await captureHistory(page);

      // delete group in group
      await pressBackspace(page);
      await assertCanvasElementsCount(page, 2);
      await assertGroupIds(page, {
        [firstGroup]: 1,
        null: 1,
      });
      await assertGroupChildren(page, firstGroup, 1);

      // undo the delete
      await undoByKeyboard(page);
      await assertCanvasElementsCount(page, 5);
      await assertGroupIds(page, {
        [firstGroup]: 2,
        [secondGroup]: 2,
        null: 1,
      });
      await assertGroupChildren(page, firstGroup, 2);
      await assertGroupChildren(page, secondGroup, 2);

      // redo the delete
      await redoByKeyboard(page);
      await assertCanvasElementsCount(page, 2);
      await assertGroupIds(page, {
        [firstGroup]: 1,
        null: 1,
      });
      await assertGroupChildren(page, firstGroup, 1);
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
      const originGroupId = await getFirstGroupId(page);

      await copyByKeyboard(page);
      await waitNextFrame(page, 100);
      const move = await toViewCoord(page, [100, -50]);
      await page.mouse.click(move[0], move[1]);
      await waitNextFrame(page, 1000);
      await pasteByKeyboard(page, false);
      const copyedGroupId = await getFirstGroupId(page, [originGroupId]);

      await assertGroupIds(page, {
        [originGroupId]: 2,
        [copyedGroupId]: 2,
        null: 2,
      });
      await assertGroupChildren(page, originGroupId, 2);
      await assertGroupChildren(page, copyedGroupId, 2);
    });

    test('copy and paste group with connector', async ({ page }) => {
      await edgelessCommonSetup(page);
      await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
      await createShapeElement(page, [100, 0], [200, 100], Shape.Square);
      await createConnectorElement(page, [100, 50], [200, 50]);
      await selectAllByKeyboard(page);
      await triggerComponentToolbarAction(page, 'addGroup');
      const originGroupId = await getFirstGroupId(page);

      await copyByKeyboard(page);
      await waitNextFrame(page, 100);
      const move = await toViewCoord(page, [100, -50]);
      await page.mouse.click(move[0], move[1]);
      await waitNextFrame(page, 1000);
      await pasteByKeyboard(page, false);
      const copyedGroupId = await getFirstGroupId(page, [originGroupId]);

      await assertGroupIds(page, {
        [originGroupId]: 3,
        [copyedGroupId]: 3,
        null: 2,
      });
      await assertGroupChildren(page, originGroupId, 3);
      await assertGroupChildren(page, copyedGroupId, 3);
    });
  });
});
