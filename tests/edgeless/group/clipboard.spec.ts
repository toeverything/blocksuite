import {
  Shape,
  copyByKeyboard,
  createConnectorElement,
  createShapeElement,
  edgelessCommonSetup,
  getFirstGroupId,
  pasteByKeyboard,
  selectAllByKeyboard,
  toViewCoord,
  triggerComponentToolbarAction,
  waitNextFrame,
} from '../../utils/actions/index.js';
import { assertGroupChildren, assertGroupIds } from '../../utils/asserts.js';
import { test } from '../../utils/playwright.js';

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
