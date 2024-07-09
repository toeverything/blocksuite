import type { EdgelessTextBlockComponent } from '@blocks/edgeless-text/edgeless-text-block.js';
import { Bound } from '@blocks/surface-block/utils/bound.js';
import { expect, type Page } from '@playwright/test';

import {
  captureHistory,
  dragBetweenIndices,
  enterPlaygroundRoom,
  initEmptyEdgelessState,
  pressArrowLeft,
  pressArrowRight,
  pressArrowUp,
  pressBackspace,
  pressEnter,
  pressEscape,
  setEdgelessTool,
  switchEditorMode,
  type,
  undoByKeyboard,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertBlockChildrenIds,
  assertBlockFlavour,
  assertBlockTextContent,
  assertRichTextInlineDeltas,
  assertRichTextInlineRange,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';
import { getFormatBar } from '../utils/query.js';

async function assertEdgelessTextRect(page: Page, id: string, bound: Bound) {
  const realXYWH = await page.evaluate(id => {
    const block = window.host.view.getBlock(id) as EdgelessTextBlockComponent;
    return block?.model.xywh;
  }, id);
  const realBound = Bound.deserialize(realXYWH);
  expect(realBound.x).toBeCloseTo(bound.x, 0);
  expect(realBound.y).toBeCloseTo(bound.y, 0);
  expect(realBound.w).toBeCloseTo(bound.w, 0);
  expect(realBound.h).toBeCloseTo(bound.h, 0);
}

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

  test('edgeless text width auto-adjusting', async ({ page }) => {
    await setEdgelessTool(page, 'default');
    await page.mouse.dblclick(130, 140, {
      delay: 100,
    });
    await waitNextFrame(page);
    await assertEdgelessTextRect(page, '4', new Bound(25, -287.5, 50, 55));
    await type(page, 'aaaaaa');
    await assertEdgelessTextRect(page, '4', new Bound(25, -287.5, 71, 55));
    await type(page, '\nbbb');
    // width not changed
    await assertEdgelessTextRect(page, '4', new Bound(25, -287.5, 71, 88));
    await type(page, '\nccccccc');
    // width changed
    await assertEdgelessTextRect(page, '4', new Bound(25, -287.5, 79, 121));
  });

  test('edgeless text width fixed when drag moving', async ({ page }) => {
    // https://github.com/toeverything/blocksuite/pull/7486

    await setEdgelessTool(page, 'default');
    await page.mouse.dblclick(130, 140, {
      delay: 100,
    });
    await waitNextFrame(page);
    await type(page, 'aaaaaa bbbb ');
    await pressEscape(page);
    await waitNextFrame(page);
    await page.mouse.click(130, 140);
    await page.mouse.down();
    await page.mouse.move(800, 800, {
      steps: 15,
    });

    const rect = await page.evaluate(() => {
      const container = document.querySelector(
        '.edgeless-text-block-container'
      )!;
      return container.getBoundingClientRect();
    });
    const model = await page.evaluate(() => {
      const block = window.host.view.getBlock(
        '4'
      ) as EdgelessTextBlockComponent;
      return block.model;
    });
    const bound = Bound.deserialize(model.xywh);
    expect(rect.width).toBeCloseTo(bound.w);
    expect(rect.height).toBeCloseTo(bound.h);
  });

  test('When creating edgeless text, if the input is empty, it will be automatically deleted', async ({
    page,
  }) => {
    await setEdgelessTool(page, 'default');
    await page.mouse.dblclick(130, 140, {
      delay: 100,
    });
    await waitNextFrame(page);
    const block = page.locator('affine-edgeless-text[data-block-id="4"]');
    expect(await block.isVisible()).toBe(true);
    await page.mouse.click(0, 0);
    expect(await block.isVisible()).toBe(false);
  });

  test('edgeless text should maintain selection when deleting across multiple lines', async ({
    page,
  }) => {
    // https://github.com/toeverything/blocksuite/pull/7443

    await setEdgelessTool(page, 'default');
    await page.mouse.dblclick(130, 140, {
      delay: 100,
    });
    await waitNextFrame(page);
    await type(page, 'aaaa\nbbbb');
    await assertBlockTextContent(page, 5, 'aaaa');
    await assertBlockTextContent(page, 6, 'bbbb');

    await pressArrowLeft(page);
    await page.keyboard.down('Shift');
    await pressArrowLeft(page, 3);
    await pressArrowUp(page);
    await pressArrowRight(page);
    await page.keyboard.up('Shift');
    await pressBackspace(page);
    await assertBlockTextContent(page, 5, 'ab');
    await type(page, 'sss\n');
    await assertBlockTextContent(page, 5, 'asss');
    await assertBlockTextContent(page, 7, 'b');
  });
});
