import type { Page } from '@playwright/test';

import {
  captureHistory,
  clickView,
  createShapeElement,
  edgelessCommonSetup,
  getFirstGroupId,
  getIds,
  redoByKeyboard,
  selectAllByKeyboard,
  Shape,
  shiftClickView,
  toIdCountMap,
  triggerComponentToolbarAction,
  undoByKeyboard,
} from '../../utils/actions/index.js';
import {
  assertGroupChildren,
  assertGroupChildrenIds,
  assertGroupIds,
  assertSelectedBound,
} from '../../utils/asserts.js';
import { test } from '../../utils/playwright.js';

let initShapes: string[] = [];
async function init(page: Page) {
  await edgelessCommonSetup(page);
  await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
  await createShapeElement(page, [100, 0], [200, 100], Shape.Square);
  initShapes = await getIds(page);
}

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
