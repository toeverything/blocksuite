import type { EdgelessTextBlockComponent } from '@blocks/edgeless-text-block/edgeless-text-block.js';

import { Bound } from '@blocksuite/global/utils';
import { expect, type Page } from '@playwright/test';

import {
  autoFit,
  captureHistory,
  cutByKeyboard,
  dragBetweenIndices,
  enterPlaygroundRoom,
  getEdgelessSelectedRect,
  getPageSnapshot,
  initEmptyEdgelessState,
  pasteByKeyboard,
  pressArrowLeft,
  pressArrowRight,
  pressArrowUp,
  pressBackspace,
  pressEnter,
  pressEscape,
  selectAllByKeyboard,
  setEdgelessTool,
  switchEditorMode,
  toViewCoord,
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

async function assertEdgelessTextModelRect(
  page: Page,
  id: string,
  bound: Bound
) {
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

    // https://github.com/toeverything/blocksuite/pull/8574
    await pressBackspace(page);

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
    const point = await toViewCoord(page, [0, 0]);
    await page.mouse.dblclick(point[0], point[1], {
      delay: 100,
    });
    await waitNextFrame(page);
    await assertEdgelessTextModelRect(page, '4', new Bound(-25, -25, 50, 46));

    await type(page, 'aaaaaaaaaa');
    await waitNextFrame(page, 1000);
    // just width changed
    await assertEdgelessTextModelRect(page, '4', new Bound(-25, -25, 83, 46));

    await type(page, '\nbbb');
    // width not changed, height changed
    await assertEdgelessTextModelRect(page, '4', new Bound(-25, -25, 83, 80));
    await type(page, '\ncccccccccccccccc');

    // width and height changed
    await assertEdgelessTextModelRect(page, '4', new Bound(-25, -25, 131, 114));

    // blur, max width set to true
    await page.mouse.click(point[0] - 50, point[1], {
      delay: 100,
    });
    await page.mouse.dblclick(point[0], point[1], {
      delay: 100,
    });
    await type(page, 'dddddddddd');
    // width not changed, height changed
    await assertEdgelessTextModelRect(page, '4', new Bound(-25, -25, 131, 138));
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
    let block = page.locator('affine-edgeless-text[data-block-id="4"]');
    expect(await block.isVisible()).toBe(true);
    await page.mouse.click(0, 0);
    expect(await block.isVisible()).toBe(false);

    block = page.locator('affine-edgeless-text[data-block-id="6"]');
    expect(await block.isVisible()).not.toBe(true);
    await page.mouse.dblclick(130, 140, {
      delay: 100,
    });
    expect(await block.isVisible()).toBe(true);
    await type(page, '\na');
    expect(await block.isVisible()).toBe(true);
    await page.mouse.click(0, 0);
    expect(await block.isVisible()).not.toBe(false);
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

  test('edgeless text should not blur after pressing backspace', async ({
    page,
  }) => {
    // https://github.com/toeverything/blocksuite/pull/7555

    await setEdgelessTool(page, 'default');
    await page.mouse.dblclick(130, 140, {
      delay: 100,
    });
    await waitNextFrame(page);
    await type(page, 'a');
    await assertBlockTextContent(page, 5, 'a');
    await pressBackspace(page);
    await type(page, 'b');
    await assertBlockTextContent(page, 5, 'b');
  });

  // FIXME(@flrande): This test fails randomly on CI
  test.fixme('edgeless text max width', async ({ page }) => {
    await setEdgelessTool(page, 'default');
    const point = await toViewCoord(page, [0, 0]);
    await page.mouse.dblclick(point[0], point[1], {
      delay: 100,
    });
    await waitNextFrame(page);
    await assertEdgelessTextModelRect(page, '4', new Bound(-25, -25, 50, 56));

    await type(page, 'aaaaaa');
    await waitNextFrame(page);
    await assertEdgelessTextModelRect(page, '4', new Bound(-25, -25, 71, 56));
    await type(page, 'bbb');
    await waitNextFrame(page, 200);
    // height not changed
    await assertEdgelessTextModelRect(page, '4', new Bound(-25, -25, 98, 56));

    // blur
    await page.mouse.click(0, 0);
    // select text element
    await page.mouse.click(point[0] + 10, point[1] + 10);

    let selectedRect = await getEdgelessSelectedRect(page);

    // move cursor to the right edge and drag it to resize the width of text

    // from left to right
    await page.mouse.move(
      selectedRect.x + selectedRect.width,
      selectedRect.y + selectedRect.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      selectedRect.x + selectedRect.width + 30,
      selectedRect.y + selectedRect.height / 2,
      {
        steps: 10,
      }
    );
    await page.mouse.up();
    await assertEdgelessTextModelRect(page, '4', new Bound(-25, -25, 128, 56));
    selectedRect = await getEdgelessSelectedRect(page);
    let textRect = await page
      .locator('affine-edgeless-text[data-block-id="4"]')
      .boundingBox();
    expect(selectedRect).not.toBeNull();
    expect(selectedRect.width).toBeCloseTo(textRect!.width);
    expect(selectedRect.height).toBeCloseTo(textRect!.height);
    expect(selectedRect.x).toBeCloseTo(textRect!.x);
    expect(selectedRect.y).toBeCloseTo(textRect!.y);

    // from right to left
    await page.mouse.move(
      selectedRect.x + selectedRect.width,
      selectedRect.y + selectedRect.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      selectedRect.x + selectedRect.width - 45,
      selectedRect.y + selectedRect.height / 2,
      {
        steps: 10,
      }
    );
    await page.mouse.up();
    // height changed
    await assertEdgelessTextModelRect(page, '4', new Bound(-25, -25, 83, 80));
    selectedRect = await getEdgelessSelectedRect(page);
    textRect = await page
      .locator('affine-edgeless-text[data-block-id="4"]')
      .boundingBox();
    expect(selectedRect).not.toBeNull();
    expect(selectedRect.width).toBeCloseTo(textRect!.width);
    expect(selectedRect.height).toBeCloseTo(textRect!.height);
    expect(selectedRect.x).toBeCloseTo(textRect!.x);
    expect(selectedRect.y).toBeCloseTo(textRect!.y);
  });

  test('min width limit for embed block', async ({ page }, testInfo) => {
    await setEdgelessTool(page, 'default');
    const point = await toViewCoord(page, [0, 0]);
    await page.mouse.dblclick(point[0], point[1], {
      delay: 100,
    });
    await waitNextFrame(page);

    expect(await getPageSnapshot(page, true)).toMatchSnapshot(
      `${testInfo.title}_init.json`
    );

    await type(page, '@');
    await pressEnter(page);
    await waitNextFrame(page, 200);

    expect(await getPageSnapshot(page, true)).toMatchSnapshot(
      `${testInfo.title}_add_linked_doc.json`
    );

    await page.locator('affine-reference').hover();
    await page.getByLabel('Switch view').click();
    await page.getByTestId('link-to-card').click();
    await autoFit(page);

    await waitNextFrame(page);

    expect(await getPageSnapshot(page, true)).toMatchSnapshot(
      `${testInfo.title}_link_to_card.json`
    );

    // blur
    await page.mouse.click(0, 0);
    // select text element
    await page.mouse.click(point[0] + 10, point[1] + 10);
    await waitNextFrame(page, 200);
    const selectedRect0 = await getEdgelessSelectedRect(page);

    // from right to left
    await page.mouse.move(
      selectedRect0.x + selectedRect0.width,
      selectedRect0.y + selectedRect0.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      selectedRect0.x,
      selectedRect0.y + selectedRect0.height / 2,
      {
        steps: 10,
      }
    );
    await page.mouse.up();

    expect(await getPageSnapshot(page, true)).toMatchSnapshot(
      `${testInfo.title}_link_to_card_min_width.json`
    );

    const selectedRect1 = await getEdgelessSelectedRect(page);
    // from left to right
    await page.mouse.move(
      selectedRect1.x + selectedRect1.width,
      selectedRect1.y + selectedRect1.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      selectedRect0.x + selectedRect0.width + 45,
      selectedRect1.y + selectedRect1.height / 2,
      {
        steps: 10,
      }
    );
    await page.mouse.up();

    expect(await getPageSnapshot(page, true)).toMatchSnapshot(
      `${testInfo.title}_drag.json`
    );
  });

  test('cut edgeless text', async ({ page }) => {
    await setEdgelessTool(page, 'default');
    await page.mouse.dblclick(130, 140, {
      delay: 100,
    });
    await waitNextFrame(page);
    await type(page, 'aaaa\nbbbb\ncccc');

    const edgelessText = page.locator('affine-edgeless-text');
    const paragraph = page.locator('affine-edgeless-text affine-paragraph');

    expect(await edgelessText.count()).toBe(1);
    expect(await paragraph.count()).toBe(3);

    await page.mouse.click(50, 50, {
      delay: 100,
    });
    await waitNextFrame(page);
    await page.mouse.click(130, 140, {
      delay: 100,
    });
    await cutByKeyboard(page);
    expect(await edgelessText.count()).toBe(0);
    expect(await paragraph.count()).toBe(0);

    await pasteByKeyboard(page);
    expect(await edgelessText.count()).toBe(1);
    expect(await paragraph.count()).toBe(3);
  });

  test('latex in edgeless text', async ({ page }) => {
    await setEdgelessTool(page, 'default');
    await page.mouse.dblclick(130, 140, {
      delay: 100,
    });
    await waitNextFrame(page);
    await type(page, '$$bbb$$ ');
    await assertRichTextInlineDeltas(
      page,
      [
        {
          insert: ' ',
          attributes: {
            latex: 'bbb',
          },
        },
      ],
      1
    );

    await page.locator('affine-latex-node').click();
    await waitNextFrame(page);
    await type(page, 'ccc');
    await assertRichTextInlineDeltas(
      page,
      [
        {
          insert: ' ',
          attributes: {
            latex: 'bbbccc',
          },
        },
      ],
      1
    );

    await page.locator('.latex-editor-hint').click();
    await type(page, 'sss');
    await assertRichTextInlineDeltas(
      page,
      [
        {
          insert: ' ',
          attributes: {
            latex: 'bbbccc',
          },
        },
      ],
      1
    );
    await page.locator('latex-editor-unit').click();
    await selectAllByKeyboard(page);
    await type(page, 'sss');
    await assertRichTextInlineDeltas(
      page,
      [
        {
          insert: ' ',
          attributes: {
            latex: 'sss',
          },
        },
      ],
      1
    );
  });
});

test('press backspace at the start of first line when edgeless text exist', async ({
  page,
}, testInfo) => {
  await enterPlaygroundRoom(page, {
    flags: {
      enable_edgeless_text: true,
    },
  });
  await page.evaluate(() => {
    const { doc } = window;
    const rootId = doc.addBlock('affine:page', {
      title: new doc.Text(),
    });
    doc.addBlock('affine:surface', {}, rootId);
    doc.addBlock('affine:note', {}, rootId);

    // do not add paragraph block

    doc.resetHistory();
  });
  await switchEditorMode(page);

  await setEdgelessTool(page, 'default');
  const point = await toViewCoord(page, [0, 0]);
  await page.mouse.dblclick(point[0], point[1], {
    delay: 100,
  });
  await waitNextFrame(page);
  await type(page, 'aaa');

  await switchEditorMode(page);

  expect(await getPageSnapshot(page, true)).toMatchSnapshot(
    `${testInfo.title}_note_empty.json`
  );

  await page.locator('.affine-page-root-block-container').click();
  expect(await getPageSnapshot(page, true)).toMatchSnapshot(
    `${testInfo.title}_note_not_empty.json`
  );

  await type(page, 'bbb');
  await pressArrowLeft(page, 3);
  await pressBackspace(page);
  await waitNextFrame(page);

  expect(await getPageSnapshot(page, true)).toMatchSnapshot(
    `${testInfo.title}_finial.json`
  );
});
