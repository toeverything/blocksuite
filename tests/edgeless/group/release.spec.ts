import type { Page } from '@playwright/test';

import {
  captureHistory,
  clickView,
  createShapeElement,
  edgelessCommonSetup,
  getFirstGroupId,
  redoByKeyboard,
  selectAllByKeyboard,
  Shape,
  shiftClickView,
  triggerComponentToolbarAction,
  undoByKeyboard,
} from '../../utils/actions/index.js';
import {
  assertGroupChildren,
  assertGroupIds,
  assertSelectedBound,
} from '../../utils/asserts.js';
import { test } from '../../utils/playwright.js';

async function init(page: Page) {
  await edgelessCommonSetup(page);
  await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
  await createShapeElement(page, [100, 0], [200, 100], Shape.Square);
}

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
