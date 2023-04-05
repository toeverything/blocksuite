import { expect } from '@playwright/test';

import {
  dragBetweenIndices,
  dragHandleFromBlockToBlockBottomById,
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
  initThreeLists,
  initThreeParagraphs,
  pressEnter,
  pressShiftTab,
  pressTab,
  type,
} from './utils/actions/index.js';
import { getBoundingClientRect } from './utils/actions/misc.js';
import { assertRichTexts, assertStoreMatchJSX } from './utils/asserts.js';
import { test } from './utils/playwright.js';

// '../packages/blocks/src/__internal__/utils/consts.ts'
const BLOCK_CHILDREN_CONTAINER_PADDING_LEFT = 26;

test('only have one drag handle in screen', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  const topLeft = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="2"]');
    const box = paragraph?.getBoundingClientRect();
    if (!box) {
      throw new Error();
    }
    return { x: box.left, y: box.top + 2 };
  }, []);

  const bottomRight = await page.evaluate(() => {
    const paragraph = document.querySelector('[data-block-id="4"]');
    const box = paragraph?.getBoundingClientRect();
    if (!box) {
      throw new Error();
    }
    return { x: box.right, y: box.bottom - 2 };
  }, []);

  await page.mouse.move(topLeft.x, topLeft.y);
  const length1 = await page.evaluate(() => {
    const handles = document.querySelectorAll('affine-drag-handle');
    return handles.length;
  }, []);
  expect(length1).toBe(1);
  await page.mouse.move(bottomRight.x, bottomRight.y);
  const length2 = await page.evaluate(() => {
    const handles = document.querySelectorAll('affine-drag-handle');
    return handles.length;
  }, []);
  expect(length2).toBe(1);
});

test('move drag handle in paragraphs', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await dragHandleFromBlockToBlockBottomById(page, '2', '4');
  await expect(page.locator('affine-drag-indicator')).toBeHidden();
  await assertRichTexts(page, ['456', '789', '123']);
});

test('move drag handle in list', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeLists(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await dragHandleFromBlockToBlockBottomById(page, '5', '3', false);
  await expect(page.locator('affine-drag-indicator')).toBeHidden();
  await assertRichTexts(page, ['789', '123', '456']);
});

test('move drag handle in nested block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, '-');
  await page.keyboard.press('Space', { delay: 50 });
  await type(page, '1');
  await pressEnter(page);
  await type(page, '2');

  await pressEnter(page);
  await pressTab(page);
  await type(page, '21');
  await pressEnter(page);
  await type(page, '22');
  await pressEnter(page);
  await type(page, '23');
  await pressEnter(page);
  await pressShiftTab(page);

  await type(page, '3');

  await assertRichTexts(page, ['1', '2', '21', '22', '23', '3']);

  await dragHandleFromBlockToBlockBottomById(page, '5', '7');
  await expect(page.locator('affine-drag-indicator')).toBeHidden();
  await assertRichTexts(page, ['1', '2', '22', '23', '21', '3']);

  await dragHandleFromBlockToBlockBottomById(page, '3', '8');
  await expect(page.locator('affine-drag-indicator')).toBeHidden();
  await assertRichTexts(page, ['2', '22', '23', '21', '3', '1']);
});

test('move to the last block of each level in multi-level nesting', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, '-');
  await page.keyboard.press('Space', { delay: 50 });
  await type(page, 'A');
  await pressEnter(page);
  await type(page, 'B');
  await pressEnter(page);
  await type(page, 'C');
  await pressEnter(page);
  await pressTab(page);
  await type(page, 'D');
  await pressEnter(page);
  await type(page, 'E');
  await pressEnter(page);
  await pressTab(page);
  await type(page, 'F');
  await pressEnter(page);
  await type(page, 'G');

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame>
    <affine:list
      prop:checked={false}
      prop:text="A"
      prop:type="bulleted"
    />
    <affine:list
      prop:checked={false}
      prop:text="B"
      prop:type="bulleted"
    />
    <affine:list
      prop:checked={false}
      prop:text="C"
      prop:type="bulleted"
    >
      <affine:list
        prop:checked={false}
        prop:text="D"
        prop:type="bulleted"
      />
      <affine:list
        prop:checked={false}
        prop:text="E"
        prop:type="bulleted"
      >
        <affine:list
          prop:checked={false}
          prop:text="F"
          prop:type="bulleted"
        />
        <affine:list
          prop:checked={false}
          prop:text="G"
          prop:type="bulleted"
        />
      </affine:list>
    </affine:list>
  </affine:frame>
</affine:page>`
  );

  await dragHandleFromBlockToBlockBottomById(page, '3', '9');
  await expect(page.locator('affine-drag-indicator')).toBeHidden();

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame>
    <affine:list
      prop:checked={false}
      prop:text="B"
      prop:type="bulleted"
    />
    <affine:list
      prop:checked={false}
      prop:text="C"
      prop:type="bulleted"
    >
      <affine:list
        prop:checked={false}
        prop:text="D"
        prop:type="bulleted"
      />
      <affine:list
        prop:checked={false}
        prop:text="E"
        prop:type="bulleted"
      >
        <affine:list
          prop:checked={false}
          prop:text="F"
          prop:type="bulleted"
        />
        <affine:list
          prop:checked={false}
          prop:text="G"
          prop:type="bulleted"
        />
        <affine:list
          prop:checked={false}
          prop:text="A"
          prop:type="bulleted"
        />
      </affine:list>
    </affine:list>
  </affine:frame>
</affine:page>`
  );

  await dragHandleFromBlockToBlockBottomById(
    page,
    '4',
    '3',
    true,
    1 * BLOCK_CHILDREN_CONTAINER_PADDING_LEFT
  );
  await expect(page.locator('affine-drag-indicator')).toBeHidden();

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame>
    <affine:list
      prop:checked={false}
      prop:text="C"
      prop:type="bulleted"
    >
      <affine:list
        prop:checked={false}
        prop:text="D"
        prop:type="bulleted"
      />
      <affine:list
        prop:checked={false}
        prop:text="E"
        prop:type="bulleted"
      >
        <affine:list
          prop:checked={false}
          prop:text="F"
          prop:type="bulleted"
        />
        <affine:list
          prop:checked={false}
          prop:text="G"
          prop:type="bulleted"
        />
        <affine:list
          prop:checked={false}
          prop:text="A"
          prop:type="bulleted"
        />
      </affine:list>
      <affine:list
        prop:checked={false}
        prop:text="B"
        prop:type="bulleted"
      />
    </affine:list>
  </affine:frame>
</affine:page>`
  );

  await assertRichTexts(page, ['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  await dragHandleFromBlockToBlockBottomById(
    page,
    '3',
    '4',
    true,
    2 * BLOCK_CHILDREN_CONTAINER_PADDING_LEFT
  );
  await expect(page.locator('affine-drag-indicator')).toBeHidden();

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame>
    <affine:list
      prop:checked={false}
      prop:text="C"
      prop:type="bulleted"
    >
      <affine:list
        prop:checked={false}
        prop:text="D"
        prop:type="bulleted"
      />
      <affine:list
        prop:checked={false}
        prop:text="E"
        prop:type="bulleted"
      >
        <affine:list
          prop:checked={false}
          prop:text="F"
          prop:type="bulleted"
        />
        <affine:list
          prop:checked={false}
          prop:text="G"
          prop:type="bulleted"
        />
      </affine:list>
      <affine:list
        prop:checked={false}
        prop:text="B"
        prop:type="bulleted"
      />
    </affine:list>
    <affine:list
      prop:checked={false}
      prop:text="A"
      prop:type="bulleted"
    />
  </affine:frame>
</affine:page>`
  );

  await assertRichTexts(page, ['C', 'D', 'E', 'F', 'G', 'B', 'A']);
});

test('should sync selected-blocks to session-manager when clicking drag handle', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await focusRichText(page, 1);

  const handle = page.locator('affine-drag-handle');
  await handle.click();

  await page.keyboard.press('Backspace');
  await assertRichTexts(page, ['123', '', '789']);
});

test('should be able to drag & drop multiple blocks', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(
    page,
    [0, 0],
    [1, 3],
    { x: -80, y: 0 },
    { x: 80, y: 0 },
    {
      steps: 50,
    }
  );

  const blockSelections = page.locator(
    '.affine-page-selected-rects-container > *'
  );
  await expect(blockSelections).toHaveCount(2);

  await dragHandleFromBlockToBlockBottomById(page, '2', '4', true);
  await expect(page.locator('affine-drag-indicator')).toBeHidden();

  await assertRichTexts(page, ['789', '123', '456']);

  // Selection is still 2 after drop
  await expect(blockSelections).toHaveCount(2);
});

test('should be able to drag & drop multiple blocks to nested block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, '-');
  await page.keyboard.press('Space', { delay: 50 });
  await type(page, 'A');
  await pressEnter(page);
  await type(page, 'B');
  await pressEnter(page);
  await type(page, 'C');
  await pressEnter(page);
  await pressTab(page);
  await type(page, 'D');
  await pressEnter(page);
  await type(page, 'E');
  await pressEnter(page);
  await pressTab(page);
  await type(page, 'F');
  await pressEnter(page);
  await type(page, 'G');

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame>
    <affine:list
      prop:checked={false}
      prop:text="A"
      prop:type="bulleted"
    />
    <affine:list
      prop:checked={false}
      prop:text="B"
      prop:type="bulleted"
    />
    <affine:list
      prop:checked={false}
      prop:text="C"
      prop:type="bulleted"
    >
      <affine:list
        prop:checked={false}
        prop:text="D"
        prop:type="bulleted"
      />
      <affine:list
        prop:checked={false}
        prop:text="E"
        prop:type="bulleted"
      >
        <affine:list
          prop:checked={false}
          prop:text="F"
          prop:type="bulleted"
        />
        <affine:list
          prop:checked={false}
          prop:text="G"
          prop:type="bulleted"
        />
      </affine:list>
    </affine:list>
  </affine:frame>
</affine:page>`
  );

  await dragBetweenIndices(
    page,
    [0, 0],
    [1, 1],
    { x: -80, y: 0 },
    { x: 80, y: 0 },
    {
      steps: 50,
    }
  );

  const blockSelections = page.locator(
    '.affine-page-selected-rects-container > *'
  );
  await expect(blockSelections).toHaveCount(2);

  await dragHandleFromBlockToBlockBottomById(page, '3', '8');

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame>
    <affine:list
      prop:checked={false}
      prop:text="C"
      prop:type="bulleted"
    >
      <affine:list
        prop:checked={false}
        prop:text="D"
        prop:type="bulleted"
      />
      <affine:list
        prop:checked={false}
        prop:text="E"
        prop:type="bulleted"
      >
        <affine:list
          prop:checked={false}
          prop:text="F"
          prop:type="bulleted"
        />
        <affine:list
          prop:checked={false}
          prop:text="A"
          prop:type="bulleted"
        />
        <affine:list
          prop:checked={false}
          prop:text="B"
          prop:type="bulleted"
        />
        <affine:list
          prop:checked={false}
          prop:text="G"
          prop:type="bulleted"
        />
      </affine:list>
    </affine:list>
  </affine:frame>
</affine:page>`
  );
});

test('should blur rich-text first on starting block selection', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await expect(page.locator('*:focus')).toHaveCount(1);

  await dragHandleFromBlockToBlockBottomById(page, '2', '4');
  await expect(page.locator('affine-drag-indicator')).toBeHidden();
  await assertRichTexts(page, ['456', '789', '123']);

  await expect(page.locator('*:focus')).toHaveCount(0);
});

test('hide drag handle when mouse is hovering over the title', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  const rect = await getBoundingClientRect(
    page,
    '.affine-frame-block-container'
  );
  const dragHandle = page.locator('affine-drag-handle');
  // When there is a gap between paragraph blocks, it is the correct behavior for the drag handle to appear
  // when the mouse is over the gap. Therefore, we use rect.y - 20 to make the Y offset greater than the gap between the
  // paragraph blocks.
  await page.mouse.move(rect.x, rect.y - 20, { steps: 2 });
  await expect(dragHandle).toBeHidden();

  await page.mouse.move(rect.x, rect.y, { steps: 2 });
  expect(await dragHandle.isVisible()).toBe(true);
  await expect(dragHandle).toBeVisible();
});

test('should create preview when dragging', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  const dragPreview = page.locator('affine-drag-preview');
  await expect(dragPreview).toHaveCount(0);

  await dragBetweenIndices(
    page,
    [0, 0],
    [1, 3],
    { x: -80, y: 0 },
    { x: 80, y: 0 },
    {
      steps: 50,
    }
  );

  const blockSelections = page.locator(
    '.affine-page-selected-rects-container > *'
  );
  await expect(blockSelections).toHaveCount(2);

  await dragHandleFromBlockToBlockBottomById(
    page,
    '2',
    '4',
    true,
    undefined,
    async () => {
      await expect(dragPreview).toBeVisible();
      await expect(dragPreview.locator('.affine-block-element')).toHaveCount(2);
    }
  );
});

test('should cover all selected blocks', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(
    page,
    [0, 0],
    [1, 3],
    { x: -80, y: 0 },
    { x: 80, y: 0 },
    {
      steps: 50,
    }
  );

  const blockSelections = page.locator(
    '.affine-page-selected-rects-container > *'
  );
  await expect(blockSelections).toHaveCount(2);

  const editors = page.locator('rich-text');
  const dragHandleHover = page.locator('.affine-drag-handle-hover');

  await editors.nth(0).hover({
    position: {
      x: 10,
      y: 10,
    },
  });
  await expect(dragHandleHover).toBeVisible();

  await editors.nth(1).hover({
    position: {
      x: 10,
      y: 10,
    },
  });
  await expect(dragHandleHover).toBeVisible();

  await editors.nth(2).hover({
    position: {
      x: 10,
      y: 10,
    },
  });
  await expect(dragHandleHover).toBeHidden();

  await editors.nth(0).hover({
    position: {
      x: 10,
      y: 10,
    },
  });

  await dragHandleHover.hover();

  const editorRect0 = await editors.nth(0).boundingBox();
  const editorRect1 = await editors.nth(1).boundingBox();
  const dragHandleRect = await page.locator('affine-drag-handle').boundingBox();
  if (!editorRect0 || !editorRect1 || !dragHandleRect) {
    throw new Error();
  }

  expect(dragHandleRect.y).toBeLessThanOrEqual(editorRect0.y);
  expect(dragHandleRect.y + dragHandleRect.height).toBeGreaterThanOrEqual(
    editorRect1.y + editorRect1.height
  );
});
