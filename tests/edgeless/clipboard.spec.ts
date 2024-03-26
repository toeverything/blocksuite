import { expect } from '@playwright/test';

import {
  createConnectorElement,
  createNote,
  createShapeElement,
  getAllSortedIds,
  getTypeById,
  Shape,
  toViewCoord,
  triggerComponentToolbarAction,
} from '../utils/actions/edgeless.js';
import {
  copyByKeyboard,
  edgelessCommonSetup as commonSetup,
  pasteByKeyboard,
  pasteContent,
  selectAllByKeyboard,
  waitNextFrame,
} from '../utils/actions/index.js';
import { assertConnectorPath, assertRichImage } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test.describe('mime', () => {
  test('should paste svg in text/plain mime', async ({ page }) => {
    await commonSetup(page);
    const content = {
      'text/plain': `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
      <script>alert("Malicious script executed!");</script>
    </svg>
    `,
    };

    await pasteContent(page, content);
    await assertRichImage(page, 1);
  });

  test('should not paste bad svg', async ({ page }) => {
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
    await createConnectorElement(page, [50, 50], [250, 50]);

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
    await createConnectorElement(page, [50, 50], [250, 50]);

    await copyByKeyboard(page);
    const move = await toViewCoord(page, [150, -49.5]);
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
    await createConnectorElement(page, [50, 50], [200, 50]);

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
