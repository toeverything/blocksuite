import { expect } from '@playwright/test';

import {
  createConnectorElement,
  createNote,
  createShapeElement,
  decreaseZoomLevel,
  deleteAll,
  getAllSortedIds,
  getTypeById,
  Shape,
  switchEditorMode,
  toViewCoord,
  triggerComponentToolbarAction,
} from '../utils/actions/edgeless.js';
import {
  copyByKeyboard,
  cutByKeyboard,
  edgelessCommonSetup as commonSetup,
  enterPlaygroundRoom,
  expectConsoleMessage,
  focusTitle,
  getCurrentEditorDocId,
  initEmptyEdgelessState,
  mockQuickSearch,
  pasteByKeyboard,
  pasteContent,
  selectAllByKeyboard,
  type,
  waitNextFrame,
} from '../utils/actions/index.js';
import { assertConnectorPath, assertRichImage } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test.describe('mime', () => {
  test('should paste svg in text/plain mime', async ({ page }) => {
    expectConsoleMessage(page, 'Error: Image sourceId is missing!', 'warning');
    await commonSetup(page);
    const content = {
      'text/plain': `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
      <script>alert("Malicious script executed!");</script>
    </svg>
    `,
    };

    await pasteContent(page, content);

    // wait for paste
    await page.waitForTimeout(200);
    await assertRichImage(page, 1);
  });

  test('should not paste bad svg', async ({ page }) => {
    expectConsoleMessage(page, 'BlockSuiteError: val does not exist', 'error');
    expectConsoleMessage(page, 'Error: Image sourceId is missing!', 'warning');

    await commonSetup(page);
    const contents = [
      {
        'text/plain': `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
      <script>alert("Malicious script executed!");</script>
    `,
      },

      {
        'text/plain': `<svg width="100" height="100">
      <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
      <script>alert("Malicious script executed!");</script>
      </svg>
    `,
      },
    ];
    for (const content of contents) {
      await pasteContent(page, content);
    }

    await assertRichImage(page, 0);
  });
});

test.describe('connector clipboard', () => {
  test('copy and paste connector whose both sides connect nothing', async ({
    page,
  }) => {
    await commonSetup(page);
    await createConnectorElement(page, [0, 0], [200, 100]);
    await waitNextFrame(page);
    await copyByKeyboard(page);
    const move = await toViewCoord(page, [100, -50]);
    await page.mouse.click(move[0], move[1]);
    await pasteByKeyboard(page, false);
    await waitNextFrame(page);
    await assertConnectorPath(
      page,
      [
        [0, -100],
        [100, -100],
        [100, 0],
        [200, 0],
      ],
      1
    );
  });

  test('copy and paste connector whose both sides connect elements', async ({
    page,
  }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
    await createConnectorElement(page, [60, 50], [240, 50]);

    await selectAllByKeyboard(page);
    await copyByKeyboard(page);
    const move = await toViewCoord(page, [150, -50]);
    await page.mouse.click(move[0], move[1]);
    await pasteByKeyboard(page, false);
    await waitNextFrame(page);
    await assertConnectorPath(
      page,
      [
        [100, -50],
        [200, -50],
      ],
      1
    );
  });

  test('copy and paste connector whose both sides connect elements, but only paste connector', async ({
    page,
  }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
    await createConnectorElement(page, [70, 50], [230, 50]);

    await copyByKeyboard(page);
    const move = await toViewCoord(page, [150, -50]);
    await page.mouse.move(move[0], move[1]);
    await pasteByKeyboard(page, false);
    await waitNextFrame(page);
    await assertConnectorPath(
      page,
      [
        [100, -50],
        [200, -50],
      ],
      1
    );
  });

  test('copy and paste connector whose one side connects elements', async ({
    page,
  }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createConnectorElement(page, [55, 50], [200, 50]);

    await selectAllByKeyboard(page);
    await copyByKeyboard(page);
    const move = await toViewCoord(page, [100, -50]);
    await page.mouse.click(move[0], move[1]);
    await pasteByKeyboard(page, false);
    await assertConnectorPath(
      page,
      [
        [100, -50],
        [200, -50],
      ],
      1
    );
  });

  test('original relative index should keep same when copy and paste group with note and shape', async ({
    page,
  }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createNote(page, [100, 50]);
    await page.mouse.click(10, 50);
    await selectAllByKeyboard(page);
    await triggerComponentToolbarAction(page, 'addGroup');
    await copyByKeyboard(page);
    const move = await toViewCoord(page, [250, 250]);
    await page.mouse.move(move[0], move[1]);
    await page.mouse.click(move[0], move[1]);
    await pasteByKeyboard(page, true);
    await waitNextFrame(page, 500);
    const sortedIds = await getAllSortedIds(page);
    expect(sortedIds.length).toBe(6);
    expect(await getTypeById(page, sortedIds[0])).toBe(
      await getTypeById(page, sortedIds[3])
    );
    expect(await getTypeById(page, sortedIds[1])).toBe(
      await getTypeById(page, sortedIds[4])
    );
    expect(await getTypeById(page, sortedIds[2])).toBe(
      await getTypeById(page, sortedIds[5])
    );
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

  // FIX ME: can not group a group inside
  test.skip('copy and paste group with group inside', async ({ page }) => {
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

  // FIX ME: paste position unexpected & redundant empty note
  test.skip('copy and paste group with frame inside', async ({ page }) => {
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
    expect(sortedIds.length).toBe(10);
  });
});

test.describe('frame clipboard', () => {
  test('copy and paste frame with shape elements inside', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createNote(page, [100, -100]);
    await page.mouse.click(10, 50);

    await selectAllByKeyboard(page);
    await triggerComponentToolbarAction(page, 'addFrame');
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

  test('copy and paste frame with group elements inside', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createNote(page, [100, -100]);
    await page.mouse.click(10, 50);
    await selectAllByKeyboard(page);
    await triggerComponentToolbarAction(page, 'addGroup');

    await createShapeElement(page, [200, 0], [300, 100], Shape.Square);
    await triggerComponentToolbarAction(page, 'createFrameOnMoreOption');
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

  test('copy and paste frame with frame inside', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createNote(page, [100, -100]);
    await page.mouse.click(10, 50);
    await selectAllByKeyboard(page);
    await triggerComponentToolbarAction(page, 'addFrame');

    await decreaseZoomLevel(page);
    await createShapeElement(page, [700, 0], [800, 100], Shape.Square);
    await selectAllByKeyboard(page);
    await triggerComponentToolbarAction(page, 'addFrame');

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

  test('cut frame with shape elements inside', async ({ page }) => {
    await commonSetup(page);
    await createShapeElement(page, [0, 0], [100, 100], Shape.Square);
    await createNote(page, [100, -100]);
    await page.mouse.click(10, 50);

    await selectAllByKeyboard(page);
    await triggerComponentToolbarAction(page, 'addFrame');
    const originIds = await getAllSortedIds(page);
    expect(originIds.length).toBe(3);

    await cutByKeyboard(page);
    const move = await toViewCoord(page, [250, 250]);
    await page.mouse.move(move[0], move[1]);
    await page.mouse.click(move[0], move[1]);
    await pasteByKeyboard(page, true);
    await waitNextFrame(page, 500);
    const sortedIds = await getAllSortedIds(page);
    expect(sortedIds.length).toBe(3);
  });
});

test.describe('pasting URLs', () => {
  test('pasting github pr url', async ({ page }) => {
    await commonSetup(page);
    await waitNextFrame(page);
    await pasteContent(page, {
      'text/plain': 'https://github.com/toeverything/blocksuite/pull/7217',
    });

    await expect(page.locator('affine-embed-github-block')).toBeVisible();
  });

  test('pasting internal link', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await waitNextFrame(page);
    await focusTitle(page);
    const docId = await getCurrentEditorDocId(page);

    await type(page, 'doc title');

    await switchEditorMode(page);
    await deleteAll(page);

    await mockQuickSearch(page, {
      'http://workspace/doc-id': docId,
    });

    await pasteContent(page, {
      'text/plain': 'http://workspace/doc-id',
    });

    await expect(page.locator('affine-embed-linked-doc-block')).toBeVisible();

    await expect(
      page.locator('.affine-embed-linked-doc-content-title')
    ).toHaveText('doc title');
  });

  test('pasting external link', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await waitNextFrame(page);
    await focusTitle(page);

    await type(page, 'doc title');

    await switchEditorMode(page);
    await deleteAll(page);
    await waitNextFrame(page);

    await pasteContent(page, {
      'text/plain': 'https://affine.pro',
    });

    await expect(page.locator('bookmark-card')).toBeVisible();
  });
});
