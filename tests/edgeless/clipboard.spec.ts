import {
  createConnectorElement,
  createShapeElement,
  Shape,
  toViewCoord,
} from '../utils/actions/edgeless.js';
import {
  copyByKeyboard,
  edgelessCommonSetup as commonSetup,
  pasteByKeyboard,
  selectAllByKeyboard,
} from '../utils/actions/index.js';
import { assertConnectorPath } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test.describe('connector clipboard', () => {
  test('copy and paste connector whose both sides connect nothing', async ({
    page,
  }) => {
    await commonSetup(page);
    await createConnectorElement(page, [0, 0], [200, 100]);
    await copyByKeyboard(page);
    const move = await toViewCoord(page, [100, -50]);
    await page.mouse.click(move[0], move[1]);
    await pasteByKeyboard(page, false);
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

    await page.pause();
    await copyByKeyboard(page);
    const move = await toViewCoord(page, [150, -49.5]);
    await page.mouse.move(move[0], move[1]);
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
});
