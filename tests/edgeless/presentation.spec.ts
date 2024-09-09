import { expect } from '@playwright/test';
import {
  assertEdgelessTool,
  createNote,
  createShapeElement,
  dragBetweenViewCoords,
  edgelessCommonSetup,
  enterPresentationMode,
  locatorPresentationToolbarButton,
  setEdgelessTool,
  Shape,
} from 'utils/actions/edgeless.js';
import { pressEscape } from 'utils/actions/keyboard.js';
import { waitNextFrame } from 'utils/actions/misc.js';

import { test } from '../utils/playwright.js';

test.describe('presentation', () => {
  test('should render note when enter presentation mode', async ({ page }) => {
    await edgelessCommonSetup(page);
    await createShapeElement(page, [100, 100], [200, 200], Shape.Square);
    await createNote(page, [300, 100], 'hello');

    // Frame shape
    await setEdgelessTool(page, 'frame');
    await dragBetweenViewCoords(page, [80, 80], [220, 220]);
    await waitNextFrame(page, 100);

    // Frame note
    await setEdgelessTool(page, 'frame');
    await dragBetweenViewCoords(page, [240, 0], [800, 200]);

    expect(await page.locator('affine-frame').count()).toBe(2);

    await enterPresentationMode(page);
    await waitNextFrame(page, 100);

    const nextButton = locatorPresentationToolbarButton(page, 'next');
    await nextButton.click();
    const edgelessNote = page.locator('affine-edgeless-note');
    await expect(edgelessNote).toBeVisible();

    const prevButton = locatorPresentationToolbarButton(page, 'previous');
    await prevButton.click();
    await expect(edgelessNote).toBeHidden();

    await waitNextFrame(page, 300);
    await nextButton.click();
    await expect(edgelessNote).toBeVisible();
  });

  test('should exit presentation mode when press escape', async ({ page }) => {
    await edgelessCommonSetup(page);
    await createNote(page, [300, 100], 'hello');

    // Frame note
    await setEdgelessTool(page, 'frame');
    await dragBetweenViewCoords(page, [240, 0], [800, 200]);

    expect(await page.locator('affine-frame').count()).toBe(1);

    await enterPresentationMode(page);
    await waitNextFrame(page, 300);

    await assertEdgelessTool(page, 'frameNavigator');
    const navigatorBlackBackground = page.locator(
      '.edgeless-navigator-black-background'
    );
    await expect(navigatorBlackBackground).toBeVisible();

    await pressEscape(page);
    await waitNextFrame(page, 100);

    await assertEdgelessTool(page, 'default');
    await expect(navigatorBlackBackground).toBeHidden();
  });
});
