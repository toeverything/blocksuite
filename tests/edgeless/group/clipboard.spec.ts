import { expect } from '@playwright/test';

import {
  edgelessCommonSetup as commonSetup,
  copyByKeyboard,
  createConnectorElement,
  createNote,
  createShapeElement,
  decreaseZoomLevel,
  edgelessCommonSetup,
  getAllSortedIds,
  getFirstGroupId,
  pasteByKeyboard,
  selectAllByKeyboard,
  Shape,
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

test.describe('group clipboard', () => {
  test('copy and paste group with shape and note inside', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createNote(page, [100, -100]);
    await page.mouse.click(10, 50);

    await selectAllByKeyboard(page);
    await triggerComponentToolbarAction(page, 'addGroup');

    const originIds = await getAllSortedIds(page);
    expect(originIds.length).toBe(3);

    await copyByKeyboard(page);
    const move = await toViewCoord(page, [250, 250]);
    await page.mouse.move(move[0], move[1]);
    await page.mouse.click(move[0], move[1]);
    await pasteByKeyboard(page, true);
    await waitNextFrame(page, 500);
    const sortedIds = await getAllSortedIds(page);
    expect(sortedIds.length).toBe(6);
  });

  test('copy and paste group with group inside', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
    await selectAllByKeyboard(page);
    await triggerComponentToolbarAction(page, 'addGroup');

    await createNote(page, [100, -100]);
    await page.mouse.click(10, 50);
    await selectAllByKeyboard(page);
    await triggerComponentToolbarAction(page, 'createGroupOnMoreOption');

    const originIds = await getAllSortedIds(page);
    expect(originIds.length).toBe(5);

    await copyByKeyboard(page);
    const move = await toViewCoord(page, [250, 250]);
    await page.mouse.move(move[0], move[1]);
    await page.mouse.click(move[0], move[1]);
    await pasteByKeyboard(page, true);
    await waitNextFrame(page, 500);
    const sortedIds = await getAllSortedIds(page);
    expect(sortedIds.length).toBe(10);
  });

  test('copy and paste group with frame inside', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createNote(page, [100, -100]);
    await page.mouse.click(10, 50);
    await selectAllByKeyboard(page);
    await triggerComponentToolbarAction(page, 'addFrame');

    await decreaseZoomLevel(page);
    await createShapeElement(page, [700, 0], [800, 100], Shape.Square);
    await selectAllByKeyboard(page);
    await triggerComponentToolbarAction(page, 'addGroup');

    const originIds = await getAllSortedIds(page);
    expect(originIds.length).toBe(5);

    await copyByKeyboard(page);
    const move = await toViewCoord(page, [250, 250]);
    await page.mouse.move(move[0], move[1]);
    await page.mouse.click(move[0], move[1]);
    await pasteByKeyboard(page, true);
    await waitNextFrame(page, 500);
    const sortedIds = await getAllSortedIds(page);
    expect(sortedIds.length).toBe(12);
  });
});
