import { expect, type Page } from '@playwright/test';
import { click, clickView, dblclickView } from 'utils/actions/click.js';
import {
  createFrame as _createFrame,
  addNote,
  autoFit,
  createShapeElement,
  dragBetweenViewCoords,
  edgelessCommonSetup,
  getFrameTitle,
  getSelectedBoundCount,
  getSelectedIds,
  Shape,
  toViewCoord,
  zoomResetByKeyboard,
} from 'utils/actions/edgeless.js';
import {
  pressEscape,
  selectAllByKeyboard,
  type,
} from 'utils/actions/keyboard.js';
import { waitNextFrame } from 'utils/actions/misc.js';
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
  const frame = await _createFrame(page, coord1, coord2);
  await autoFit(page);
  return frame;
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

  test('frame can be selected by click frame title', async ({ page }) => {
    const frame = await createFrame(page, [50, 50], [150, 150]);
    await pressEscape(page);
    expect(await getSelectedBoundCount(page)).toBe(0);

    const frameTitle = getFrameTitle(page, frame);
    await frameTitle.click();

    expect(await getSelectedBoundCount(page)).toBe(1);
    await assertSelectedBound(page, [50, 50, 100, 100]);
  });

  test('frame can be selected by click frame title when a note overlap on it', async ({
    page,
  }) => {
    const frame = await createFrame(page, [50, 50], [150, 150]);
    await pressEscape(page);

    const frameTitle = getFrameTitle(page, frame);
    const frameTitleBox = await frameTitle.boundingBox();
    expect(frameTitleBox).not.toBeNull();
    if (frameTitleBox === null) return;

    const frameTitleCenter = {
      x: frameTitleBox.x + frameTitleBox.width / 2,
      y: frameTitleBox.y + frameTitleBox.height / 2,
    };

    await addNote(page, '', frameTitleCenter.x - 10, frameTitleCenter.y);
    await pressEscape(page, 3);
    await waitNextFrame(page, 500);
    expect(await getSelectedBoundCount(page)).toBe(0);

    await click(page, frameTitleCenter);
    expect(await getSelectedBoundCount(page)).toBe(1);
    const selectedIds = await getSelectedIds(page);
    expect(selectedIds.length).toBe(1);
    expect(selectedIds[0]).toBe(frame);
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

  test('element in frame should not be selected when frame is selected by drag or Cmd/Ctrl + A', async ({
    page,
  }) => {
    await createFrame(page, [50, 50], [200, 200]);
    await createShapeElement(page, [100, 100], [150, 150], Shape.Square);
    await pressEscape(page);

    await dragBetweenViewCoords(page, [0, 0], [250, 250]);
    expect(await getSelectedBoundCount(page)).toBe(1);
    await assertSelectedBound(page, [50, 50, 150, 150]);

    await pressEscape(page);
    expect(await getSelectedBoundCount(page)).toBe(0);

    await selectAllByKeyboard(page);
    expect(await getSelectedBoundCount(page)).toBe(1);
    await assertSelectedBound(page, [50, 50, 150, 150]);
  });
});
