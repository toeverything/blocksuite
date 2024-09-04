import { expect, type Page } from '@playwright/test';
import { clickView, dblclickView } from 'utils/actions/click.js';
import {
  createFrame as _createFrame,
  addNote,
  autoFit,
  createShapeElement,
  edgelessCommonSetup,
  getSelectedBoundCount,
  Shape,
  toViewCoord,
  zoomResetByKeyboard,
} from 'utils/actions/edgeless.js';
import { pressEscape, type } from 'utils/actions/keyboard.js';
import {
  assertEdgelessCanvasText,
  assertRichTexts,
  assertSelectedBound,
} from 'utils/asserts.js';

import { test } from '../../utils/playwright.js';

const createFrame = async (
  page: Page,
  coord1: [number, number],
  coord2: [number, number]
) => {
  await _createFrame(page, coord1, coord2);
  await autoFit(page);
};

test.beforeEach(async ({ page }) => {
  await edgelessCommonSetup(page);
  await zoomResetByKeyboard(page);
});

test.describe('frame selection', () => {
  test('frame can be selected by click blank area of frame', async ({
    page,
  }) => {
    await createFrame(page, [50, 50], [150, 150]);
    await pressEscape(page);
    expect(await getSelectedBoundCount(page)).toBe(0);

    await clickView(page, [100, 100]);
    expect(await getSelectedBoundCount(page)).toBe(1);
    await assertSelectedBound(page, [50, 50, 100, 100]);
  });

  test('shape inside frame can be selected and edited', async ({ page }) => {
    await createFrame(page, [50, 50], [150, 150]);
    await createShapeElement(page, [100, 100], [200, 200], Shape.Square);
    await pressEscape(page);

    await clickView(page, [150, 150]);
    expect(await getSelectedBoundCount(page)).toBe(1);
    await assertSelectedBound(page, [100, 100, 100, 100]);

    await dblclickView(page, [150, 150]);
    await type(page, 'hello');
    await assertEdgelessCanvasText(page, 'hello');
  });

  test('dom inside frame can be selected and edited', async ({ page }) => {
    await createFrame(page, [50, 50], [150, 150]);
    const noteCoord = await toViewCoord(page, [100, 100]);
    await addNote(page, '', noteCoord[0], noteCoord[1]);
    await page.mouse.click(noteCoord[0] - 80, noteCoord[1]);

    await dblclickView(page, [150, 150]);
    await type(page, 'hello');
    await assertRichTexts(page, ['hello']);
  });
});
