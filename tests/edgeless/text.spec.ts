import { expect, type Page } from '@playwright/test';
import { getLinkedDocPopover } from 'utils/actions/linked-doc.js';
import { getFormatBar } from 'utils/query.js';

import {
  assertEdgelessTool,
  captureHistory,
  dragBetweenIndices,
  enterPlaygroundRoom,
  getEdgelessSelectedRect,
  initEmptyEdgelessState,
  pressArrowLeft,
  pressArrowRight,
  pressArrowUp,
  pressBackspace,
  pressEnter,
  setEdgelessTool,
  SHORT_KEY,
  switchEditorMode,
  type,
  undoByKeyboard,
  waitForInlineEditorStateUpdated,
  waitNextFrame,
  zoomResetByKeyboard,
} from '../utils/actions/index.js';
import {
  assertBlockChildrenIds,
  assertBlockFlavour,
  assertBlockTextContent,
  assertEdgelessCanvasText,
  assertRichTextInlineDeltas,
  assertRichTextInlineRange,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

async function assertTextFont(page: Page, font: string) {
  const fontButton = page.getByRole('button', {
    name: /^Font$/,
  });
  const fontPanel = page.locator('edgeless-font-family-panel');
  const isFontPanelShow = await fontPanel.isVisible();
  if (!isFontPanelShow) {
    if (!(await fontButton.isVisible()))
      throw new Error('edgeless change text toolbar is not visible');

    await fontButton.click();
  }

  const button = fontPanel.locator(`[data-font="${font}"]`);
  await expect(button.locator('.active-mode-color[active]')).toBeVisible();
}

test.describe('edgeless canvas text', () => {
  test.beforeEach(async ({ page }) => {
    await enterPlaygroundRoom(page, {
      flags: {
        enable_edgeless_text: false,
      },
    });
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);
  });

  test('add text element in default mode', async ({ page }) => {
    await setEdgelessTool(page, 'default');
    await page.mouse.dblclick(130, 140);
    await waitForInlineEditorStateUpdated(page);
    await waitNextFrame(page);

    await type(page, 'hello');
    await assertEdgelessCanvasText(page, 'hello');
    await assertEdgelessTool(page, 'default');

    await page.mouse.click(120, 140);

    expect(await page.locator('edgeless-text-editor').count()).toBe(0);

    await page.mouse.dblclick(145, 155);
    await waitNextFrame(page);
    await page.locator('edgeless-text-editor').waitFor({
      state: 'attached',
    });
    await type(page, 'hello');
    await assertEdgelessCanvasText(page, 'hhelloello');

    await pressArrowLeft(page, 5);
    await type(page, 'ddd\n');
    await assertEdgelessCanvasText(page, 'hddd\nhelloello');
  });

  test('should not trigger linked doc popover in canvas text', async ({
    page,
  }) => {
    await setEdgelessTool(page, 'default');
    await page.mouse.dblclick(130, 140);
    await waitForInlineEditorStateUpdated(page);
    await waitNextFrame(page);

    await type(page, '@');
    const { linkedDocPopover } = getLinkedDocPopover(page);
    await expect(linkedDocPopover).not.toBeVisible();
    await pressEnter(page);
    await assertEdgelessCanvasText(page, '@\n');
  });

  // it's also a little flaky
  test('add text element in text mode', async ({ page }) => {
    await page.mouse.dblclick(130, 140);
    await waitNextFrame(page);

    await type(page, 'hello');
    await assertEdgelessCanvasText(page, 'hello');
    await assertEdgelessTool(page, 'default');

    await page.mouse.click(120, 140);

    expect(await page.locator('edgeless-text-editor').count()).toBe(0);

    await page.mouse.dblclick(145, 145);

    await page.locator('edgeless-text-editor').waitFor({
      state: 'attached',
    });
    await type(page, 'hello');
    await page.waitForTimeout(100);
    await assertEdgelessCanvasText(page, 'hhelloello');

    await page.mouse.click(145, 155);
    await type(page, 'ddd\n');
    await assertEdgelessCanvasText(page, 'hddd\nhelloello');
  });

  test('copy and paste', async ({ page }) => {
    await setEdgelessTool(page, 'default');
    await page.mouse.dblclick(130, 140);
    await waitNextFrame(page);

    await type(page, 'hello');
    await assertEdgelessCanvasText(page, 'hello');
    await assertEdgelessTool(page, 'default');

    await page.mouse.move(145, 155);
    await page.mouse.down();
    await page.mouse.move(170, 155, {
      steps: 10,
    });
    await page.mouse.up();
    // h|ell|o
    await waitNextFrame(page, 200);
    await page.keyboard.press(`${SHORT_KEY}+c`);

    await waitNextFrame(page, 200);
    await type(page, 'ddd', 100);
    await waitNextFrame(page, 200);
    await assertEdgelessCanvasText(page, 'hdddo');

    await page.keyboard.press(`${SHORT_KEY}+v`);
    await assertEdgelessCanvasText(page, 'hdddello');
  });

  test('normalize text element rect after change its font', async ({
    page,
  }) => {
    await page.mouse.dblclick(200, 200);
    await waitNextFrame(page);

    await type(page, 'aaa\nbbbbbbbb\n\ncc');
    await assertEdgelessCanvasText(page, 'aaa\nbbbbbbbb\n\ncc');
    await assertEdgelessTool(page, 'default');
    await page.mouse.click(10, 100);

    await page.mouse.click(220, 210);
    await waitNextFrame(page);
    let { width: lastWidth, height: lastHeight } =
      await getEdgelessSelectedRect(page);
    const fontButton = page.getByRole('button', { name: /^Font$/ });
    await fontButton.click();

    // Default is Inter
    await assertTextFont(page, 'Inter');
    const kalamTextFont = page.getByText('Kalam');
    await kalamTextFont.click();
    await waitNextFrame(page);
    let selectedRect = await getEdgelessSelectedRect(page);
    expect(selectedRect.width).not.toEqual(lastWidth);
    expect(selectedRect.height).not.toEqual(lastHeight);

    lastWidth = selectedRect.width;
    lastHeight = selectedRect.height;
    await fontButton.click();
    await assertTextFont(page, 'Kalam');
    const InterTextFont = page.getByText('Inter');
    await InterTextFont.click();
    await waitNextFrame(page);
    selectedRect = await getEdgelessSelectedRect(page);
    expect(selectedRect.width).not.toEqual(lastWidth);
    expect(selectedRect.height).not.toEqual(lastHeight);
  });

  test('auto wrap text by dragging left and right edge', async ({ page }) => {
    await zoomResetByKeyboard(page);
    await setEdgelessTool(page, 'default');
    await page.mouse.dblclick(130, 140);
    await waitForInlineEditorStateUpdated(page);
    await waitNextFrame(page);

    await type(page, 'hellohello');
    await assertEdgelessCanvasText(page, 'hellohello');
    await assertEdgelessTool(page, 'default');

    // quit edit mode
    await page.mouse.click(120, 140);

    // select text element
    await page.mouse.click(150, 140);
    // should exit selected rect and record last width and height, then compare them
    let selectedRect = await getEdgelessSelectedRect(page);
    let lastWidth = selectedRect.width;
    let lastHeight = selectedRect.height;

    // move cursor to the right edge and drag it to resize the width of text element
    await page.mouse.move(130 + lastWidth, 160);
    await page.mouse.down();
    await page.mouse.move(130 + lastWidth / 2, 160, {
      steps: 10,
    });
    await page.mouse.up();

    // the text should be wrapped, so check the width and height of text element
    selectedRect = await getEdgelessSelectedRect(page);
    expect(selectedRect.width).toBeLessThan(lastWidth);
    expect(selectedRect.height).toBeGreaterThan(lastHeight);

    await page.mouse.dblclick(140, 160);
    await waitForInlineEditorStateUpdated(page);
    await waitNextFrame(page);
    await assertEdgelessCanvasText(page, 'hellohello');

    // quit edit mode
    await page.mouse.click(120, 140);

    // select text element
    await page.mouse.click(150, 140);
    // check selected rect and record the last width and height
    selectedRect = await getEdgelessSelectedRect(page);
    lastWidth = selectedRect.width;
    lastHeight = selectedRect.height;
    // move cursor to the left edge and drag it to resize the width of text element
    await page.mouse.move(130, 160);
    await page.mouse.down();
    await page.mouse.move(60, 160, {
      steps: 10,
    });
    await page.mouse.up();

    // the text should be unwrapped, check the width and height of text element
    selectedRect = await getEdgelessSelectedRect(page);
    expect(selectedRect.width).toBeGreaterThan(lastWidth);
    expect(selectedRect.height).toBeLessThan(lastHeight);

    await page.mouse.dblclick(100, 160);
    await waitForInlineEditorStateUpdated(page);
    await waitNextFrame(page);
    await assertEdgelessCanvasText(page, 'hellohello');
  });

  test('text element should have maxWidth after adjusting width by dragging left or right edge', async ({
    page,
  }) => {
    await zoomResetByKeyboard(page);
    await setEdgelessTool(page, 'default');
    await page.mouse.dblclick(130, 140);
    await waitForInlineEditorStateUpdated(page);
    await waitNextFrame(page);

    await type(page, 'hellohello');
    await assertEdgelessCanvasText(page, 'hellohello');
    await assertEdgelessTool(page, 'default');

    // quit edit mode
    await page.mouse.click(120, 140);

    // select text element
    await page.mouse.click(150, 140);
    let selectedRect = await getEdgelessSelectedRect(page);
    let lastWidth = selectedRect.width;
    let lastHeight = selectedRect.height;

    // move cursor to the right edge and drag it to resize the width of text element
    await page.mouse.move(130 + lastWidth, 160);
    await page.mouse.down();
    await page.mouse.move(130 + lastWidth / 2, 160, {
      steps: 10,
    });
    await page.mouse.up();

    // the text should be wrapped, so check the width and height of text element
    selectedRect = await getEdgelessSelectedRect(page);
    expect(selectedRect.width).toBeLessThan(lastWidth);
    expect(selectedRect.height).toBeGreaterThan(lastHeight);
    lastWidth = selectedRect.width;
    lastHeight = selectedRect.height;

    // enter edit mode
    await waitNextFrame(page);
    await page.mouse.dblclick(140, 180);
    await waitForInlineEditorStateUpdated(page);
    await waitNextFrame(page);
    await type(page, 'hello');
    await assertEdgelessCanvasText(page, 'hellohellohello');

    // quit edit mode
    await page.mouse.click(120, 140);

    // select text element
    await page.mouse.click(150, 140);
    // after input, the width of the text element should be the same as before, but the height should be changed
    selectedRect = await getEdgelessSelectedRect(page);
    expect(selectedRect.width).toBeCloseTo(Math.round(lastWidth));
    expect(selectedRect.height).toBeGreaterThan(lastHeight);
  });
});

test.describe('edgeless text block', () => {
  test.beforeEach(async ({ page }) => {
    await enterPlaygroundRoom(page, {
      flags: {
        enable_edgeless_text: true,
      },
    });
    await initEmptyEdgelessState(page);
    await switchEditorMode(page);
  });

  test('add text block in default mode', async ({ page }) => {
    await setEdgelessTool(page, 'default');
    await page.mouse.dblclick(130, 140, {
      delay: 100,
    });
    await waitForInlineEditorStateUpdated(page);
    await waitNextFrame(page);
    await type(page, 'aaa');
    await pressEnter(page);
    await type(page, 'bbb');
    await pressEnter(page);
    await type(page, 'ccc');

    await assertBlockFlavour(page, 4, 'affine:edgeless-text');
    await assertBlockFlavour(page, 5, 'affine:paragraph');
    await assertBlockFlavour(page, 6, 'affine:paragraph');
    await assertBlockFlavour(page, 7, 'affine:paragraph');
    await assertBlockChildrenIds(page, '4', ['5', '6', '7']);
    await assertBlockTextContent(page, 5, 'aaa');
    await assertBlockTextContent(page, 6, 'bbb');
    await assertBlockTextContent(page, 7, 'ccc');

    await dragBetweenIndices(page, [1, 1], [3, 2]);
    await captureHistory(page);
    await pressBackspace(page);
    await assertBlockChildrenIds(page, '4', ['5']);
    await assertBlockTextContent(page, 5, 'ac');

    await undoByKeyboard(page);
    await assertBlockChildrenIds(page, '4', ['5', '6', '7']);
    await assertBlockTextContent(page, 5, 'aaa');
    await assertBlockTextContent(page, 6, 'bbb');
    await assertBlockTextContent(page, 7, 'ccc');

    const { boldBtn } = getFormatBar(page);
    await boldBtn.click();
    await assertRichTextInlineDeltas(
      page,
      [
        {
          insert: 'a',
        },
        {
          insert: 'aa',
          attributes: {
            bold: true,
          },
        },
      ],
      1
    );
    await assertRichTextInlineDeltas(
      page,
      [
        {
          insert: 'bbb',
          attributes: {
            bold: true,
          },
        },
      ],
      2
    );
    await assertRichTextInlineDeltas(
      page,
      [
        {
          insert: 'cc',
          attributes: {
            bold: true,
          },
        },
        {
          insert: 'c',
        },
      ],
      3
    );

    await pressArrowRight(page);
    await assertRichTextInlineRange(page, 3, 2);
    await pressArrowUp(page);
    await assertRichTextInlineRange(page, 2, 2);
  });
});
