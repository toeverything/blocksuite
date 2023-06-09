import { expect } from '@playwright/test';

import {
  addBasicRectShapeElement,
  deleteAll,
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
  enterPlaygroundRoom,
  focusRichText,
  initEmptyEdgelessState,
  pressBackspace,
  pressEscape,
  pressForwardDelete,
  selectAllByKeyboard,
  selectFrameInEdgeless,
  type,
} from '../utils/actions/index.js';
import {
  assertDOMRectEqual,
  assertEdgelessNonSelectedRect,
  assertEdgelessSelectedRect,
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

    const start = { x: 100, y: 100 };
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

    await zoomOutByKeyboard(page);

    let zoom = await getZoomLevel(page);
    expect(zoom).toBe(75);

    await zoomResetByKeyboard(page);

    zoom = await getZoomLevel(page);
    expect(zoom).toBe(100);
  });
  test('zoom in', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);

    await zoomInByKeyboard(page);

    let zoom = await getZoomLevel(page);
    expect(zoom).toBe(125);

    await zoomInByKeyboard(page);

    zoom = await getZoomLevel(page);
    expect(zoom).toBe(150);
  });
});

test('cmd + A should select all elements by default', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await deleteAll(page);
  const start = { x: 0, y: 0 };
  const end = { x: 100, y: 100 };
  await addBasicRectShapeElement(page, start, end);
  start.x = 100;
  end.x = 200;
  await addBasicRectShapeElement(page, start, end);
  await selectAllByKeyboard(page);

  await assertEdgelessSelectedRect(page, [0, 0, 200, 100]);
});

test('cmd + A should not fire inside active frame', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await switchEditorMode(page);

  const start = { x: 0, y: 0 };
  const end = { x: 100, y: 100 };
  await addBasicRectShapeElement(page, start, end);
  await selectAllByKeyboard(page);

  await selectFrameInEdgeless(page, frameId);
  const box1 = await getEdgelessSelectedRect(page);

  // second click become active
  await selectFrameInEdgeless(page, frameId);
  await selectAllByKeyboard(page);

  const box2 = await getEdgelessSelectedRect(page);

  assertDOMRectEqual(box1, box2);
});

test.describe('delete', () => {
  test('do not delete element when active', async ({ page }) => {
    await enterPlaygroundRoom(page);
    const { frameId } = await initEmptyEdgelessState(page);
    await focusRichText(page);
    await type(page, 'hello');
    await switchEditorMode(page);
    await selectFrameInEdgeless(page, frameId);
    const box1 = await getEdgelessSelectedRect(page);
    await selectFrameInEdgeless(page, frameId);
    await pressBackspace(page);
    const box2 = await getEdgelessSelectedRect(page);
    assertDOMRectEqual(box1, box2);

    await pressForwardDelete(page);
    const box3 = await getEdgelessSelectedRect(page);
    assertDOMRectEqual(box1, box3);
  });
});
