import { expect } from '@playwright/test';
import { dragBetweenCoords } from 'utils/actions/drag.js';

import {
  Shape,
  addBasicShapeElement,
  addNote,
  edgelessCommonSetup,
  setEdgelessTool,
  toggleFramePanel,
} from '../utils/actions/edgeless.js';
import { waitNextFrame } from '../utils/actions/index.js';
import { test } from '../utils/playwright.js';

test.describe('frame panel', () => {
  test('should display empty placeholder when no frames', async ({ page }) => {
    await edgelessCommonSetup(page);
    await toggleFramePanel(page);
    const frameCards = page.locator('affine-frame-card');
    expect(await frameCards.count()).toBe(0);

    const placeholder = page.locator('.no-frame-placeholder');
    expect(await placeholder.isVisible()).toBeTruthy();
  });

  test('should display frame cards when there are frames', async ({ page }) => {
    await edgelessCommonSetup(page);
    await toggleFramePanel(page);

    await addBasicShapeElement(
      page,
      { x: 300, y: 300 },
      { x: 350, y: 350 },
      Shape.Square
    );

    await addNote(page, 'hello', 150, 500);

    await page.mouse.click(0, 0);

    await setEdgelessTool(page, 'frame');
    await dragBetweenCoords(page, { x: 250, y: 250 }, { x: 360, y: 360 });

    await setEdgelessTool(page, 'frame');
    await dragBetweenCoords(page, { x: 100, y: 440 }, { x: 600, y: 600 });

    const frames = page.locator('affine-frame');
    expect(await frames.count()).toBe(2);
    const frameCards = page.locator('affine-frame-card');
    expect(await frameCards.count()).toBe(2);
  });

  test('should render note portal correctly in frame preview', async ({
    page,
  }) => {
    await edgelessCommonSetup(page);
    await toggleFramePanel(page);

    await addNote(page, 'hello', 150, 500);

    await page.mouse.click(0, 0);

    await setEdgelessTool(page, 'frame');
    await dragBetweenCoords(page, { x: 100, y: 440 }, { x: 600, y: 600 });
    await waitNextFrame(page, 100);

    const frames = page.locator('affine-frame');
    expect(await frames.count()).toBe(1);
    const frameCards = page.locator('affine-frame-card');
    expect(await frameCards.count()).toBe(1);
    const notePortal = page.locator('surface-ref-note-portal');
    expect(await notePortal.count()).toBe(1);
  });

  test('should update panel when frames change', async ({ page }) => {
    await edgelessCommonSetup(page);
    await toggleFramePanel(page);
    const frameCards = page.locator('affine-frame-card');
    expect(await frameCards.count()).toBe(0);

    await addNote(page, 'hello', 150, 500);

    await page.mouse.click(0, 0);

    await setEdgelessTool(page, 'frame');
    await dragBetweenCoords(page, { x: 100, y: 440 }, { x: 600, y: 600 });

    await setEdgelessTool(page, 'frame');
    await dragBetweenCoords(page, { x: 50, y: 300 }, { x: 120, y: 400 });
    await waitNextFrame(page);

    const frames = page.locator('affine-frame');
    expect(await frames.count()).toBe(2);
    expect(await frameCards.count()).toBe(2);

    await page.mouse.click(50, 300);
    await page.keyboard.press('Delete');
    await waitNextFrame(page);

    expect(await frames.count()).toBe(1);
    expect(await frameCards.count()).toBe(1);
  });
});
