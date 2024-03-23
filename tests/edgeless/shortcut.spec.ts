import { expect } from '@playwright/test';

import {
  addBasicRectShapeElement,
  createShapeElement,
  edgelessCommonSetup,
  getEdgelessSelectedRect,
  getZoomLevel,
  locatorEdgelessToolButton,
  switchEditorMode,
  zoomFitByKeyboard,
  zoomInByKeyboard,
  zoomOutByKeyboard,
  zoomResetByKeyboard,
} from '../utils/actions/edgeless.js';
import {
  clickView,
  enterPlaygroundRoom,
  focusRichText,
  initEmptyEdgelessState,
  pressBackspace,
  pressEscape,
  pressForwardDelete,
  selectAllByKeyboard,
  selectNoteInEdgeless,
  type,
} from '../utils/actions/index.js';
import {
  assertBlockCount,
  assertEdgelessNonSelectedRect,
  assertEdgelessSelectedRect,
  assertEdgelessSelectedRectModel,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('shortcut', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  await page.mouse.click(100, 100);

  await page.keyboard.press('t');
  const textButton = locatorEdgelessToolButton(page, 'text');
  await expect(textButton).toHaveAttribute('active', '');

  await page.keyboard.press('s');
  const shapeButton = locatorEdgelessToolButton(page, 'shape');
  await expect(shapeButton).toHaveAttribute('active', '');

  await page.keyboard.press('p');
  const penButton = locatorEdgelessToolButton(page, 'brush');
  await expect(penButton).toHaveAttribute('active', '');

  await page.keyboard.press('h');
  const panButton = locatorEdgelessToolButton(page, 'pan');
  await expect(panButton).toHaveAttribute('active', '');

  await page.keyboard.press('l');
  const connectorButton = locatorEdgelessToolButton(page, 'connector');
  await expect(connectorButton).toHaveAttribute('active', '');

  await page.mouse.click(100, 100);
  await page.keyboard.press('x');
  await expect(connectorButton).toHaveAttribute('active', '');
});

test('pressing the ESC key will return to the default state', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);

  const start = { x: 100, y: 100 };
  const end = { x: 200, y: 200 };
  await addBasicRectShapeElement(page, start, end);

  await page.mouse.click(start.x + 5, start.y + 5);
  await assertEdgelessSelectedRect(page, [100, 100, 100, 100]);

  await pressEscape(page);
  await assertEdgelessNonSelectedRect(page);
});

test.describe('zooming', () => {
  test('zoom fit to screen', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);
    await zoomResetByKeyboard(page);

    const start = { x: 0, y: 0 };
    const end = { x: 200, y: 200 };
    await addBasicRectShapeElement(page, start, end);

    await zoomFitByKeyboard(page);

    const zoom = await getZoomLevel(page);

    expect(zoom).not.toBe(100);
  });
  test('zoom out', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    await clickView(page, [0, 0]);
    await zoomResetByKeyboard(page);

    await zoomOutByKeyboard(page);

    let zoom = await getZoomLevel(page);
    expect(zoom).toBe(75);

    await zoomOutByKeyboard(page);

    zoom = await getZoomLevel(page);
    expect(zoom).toBe(50);
  });
  test('zoom reset', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    await clickView(page, [0, 0]);
    await zoomResetByKeyboard(page);
    let zoom = await getZoomLevel(page);
    expect(zoom).toBe(100);

    await zoomOutByKeyboard(page);

    zoom = await getZoomLevel(page);
    expect(zoom).toBe(75);

    await zoomResetByKeyboard(page);

    zoom = await getZoomLevel(page);
    expect(zoom).toBe(100);
  });
  test('zoom in', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    await clickView(page, [0, 0]);
    await zoomResetByKeyboard(page);

    await zoomInByKeyboard(page);

    let zoom = await getZoomLevel(page);
    expect(zoom).toBe(125);

    await zoomInByKeyboard(page);

    zoom = await getZoomLevel(page);
    expect(zoom).toBe(150);
  });
});

test('cmd + A should select all elements by default', async ({ page }) => {
  await edgelessCommonSetup(page);
  await createShapeElement(page, [0, 0], [100, 100]);
  await createShapeElement(page, [100, 0], [200, 100]);
  await selectAllByKeyboard(page);
  await assertEdgelessSelectedRectModel(page, [0, 0, 200, 100]);
});

test('cmd + A should not fire inside active note', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await switchEditorMode(page);

  await selectNoteInEdgeless(page, noteId);
  // second click become active
  await selectNoteInEdgeless(page, noteId);
  await selectAllByKeyboard(page);

  // should not have selected rect
  let error = null;
  try {
    await getEdgelessSelectedRect(page);
  } catch (e) {
    error = e;
  }
  expect(error).not.toBeNull();
});

test.describe('delete', () => {
  test('do not delete element when active', async ({ page }) => {
    await enterPlaygroundRoom(page);
    const { noteId } = await initEmptyEdgelessState(page);
    await focusRichText(page);
    await type(page, 'hello');
    await switchEditorMode(page);
    await selectNoteInEdgeless(page, noteId);
    const box1 = await getEdgelessSelectedRect(page);
    await page.mouse.click(box1.x + 10, box1.y + 10);
    await pressBackspace(page);
    await assertBlockCount(page, 'note', 1);
    await pressForwardDelete(page);
    await assertBlockCount(page, 'note', 1);
  });
});

test.describe('Arrow Keys should move selection', () => {
  test('with shift increment by 5px', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    await addBasicRectShapeElement(
      page,
      { x: 100, y: 100 },
      { x: 200, y: 200 }
    );

    await page.keyboard.down('Shift');

    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowLeft');
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowDown');
    await page.keyboard.up('Shift');
    await assertEdgelessSelectedRect(page, [0, 200, 100, 100]);
  });

  test('without shift increment by 1px', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    await addBasicRectShapeElement(
      page,
      { x: 100, y: 100 },
      { x: 200, y: 200 }
    );

    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowUp');

    await assertEdgelessSelectedRect(page, [120, 80, 100, 100]);
  });
});
