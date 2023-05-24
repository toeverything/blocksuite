import { expect } from '@playwright/test';

import {
  dragBetweenCoords,
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
  <affine:frame
    prop:background="--affine-background-secondary-color"
    prop:index="a0"
  >
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
  <affine:frame
    prop:background="--affine-background-secondary-color"
    prop:index="a0"
  >
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
  <affine:frame
    prop:background="--affine-background-secondary-color"
    prop:index="a0"
  >
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
  <affine:frame
    prop:background="--affine-background-secondary-color"
    prop:index="a0"
  >
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
    { x: -60, y: 0 },
    { x: 80, y: 0 },
    {
      steps: 50,
    }
  );

  const blockSelections = page.locator('affine-selected-blocks > *');
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
  <affine:frame
    prop:background="--affine-background-secondary-color"
    prop:index="a0"
  >
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

  const blockSelections = page.locator('affine-selected-blocks > *');
  await expect(blockSelections).toHaveCount(2);

  await dragHandleFromBlockToBlockBottomById(page, '3', '8');

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame
    prop:background="--affine-background-secondary-color"
    prop:index="a0"
  >
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
    { x: -60, y: 0 },
    { x: 80, y: 0 },
    {
      steps: 50,
    }
  );

  const blockSelections = page.locator('affine-selected-blocks > *');
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
    { x: -60, y: 0 },
    { x: 80, y: 0 },
    {
      steps: 50,
    }
  );

  const blockSelections = page.locator('affine-selected-blocks > *');
  await expect(blockSelections).toHaveCount(2);

  const editors = page.locator('rich-text');
  const dragHandleHover = page.locator('.affine-drag-handle-hover');

  const editorRect0 = await editors.nth(0).boundingBox();
  const editorRect1 = await editors.nth(1).boundingBox();
  const editorRect2 = await editors.nth(2).boundingBox();
  if (!editorRect0 || !editorRect1 || !editorRect2) {
    throw new Error();
  }

  await page.mouse.move(editorRect0.x + 10, editorRect0.y + 10);
  await expect(dragHandleHover).toBeVisible();

  await page.mouse.move(editorRect1.x + 10, editorRect1.y + 10);
  await expect(dragHandleHover).toBeVisible();

  await page.mouse.move(editorRect2.x + 10, editorRect2.y + 10);
  await expect(dragHandleHover).toBeHidden();

  await page.mouse.move(editorRect0.x + 10, editorRect0.y + 10);
  await dragHandleHover.hover();

  const dragHandleRect = await page.locator('affine-drag-handle').boundingBox();
  if (!dragHandleRect) {
    throw new Error();
  }

  expect(dragHandleRect.y).toBeLessThanOrEqual(editorRect0.y);
  expect(dragHandleRect.y + dragHandleRect.height).toBeGreaterThanOrEqual(
    editorRect1.y + editorRect1.height
  );
});

test('should drag and drop blocks under block-level selection', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(
    page,
    [0, 0],
    [1, 3],
    { x: -60, y: 0 },
    { x: 80, y: 0 },
    {
      steps: 50,
    }
  );

  const blockSelections = page.locator('affine-selected-blocks > *');
  await expect(blockSelections).toHaveCount(2);

  const editors = page.locator('rich-text');
  const editorRect0 = await editors.nth(0).boundingBox();
  const editorRect2 = await editors.nth(2).boundingBox();
  if (!editorRect0 || !editorRect2) {
    throw new Error();
  }

  await dragBetweenCoords(
    page,
    {
      x: editorRect0.x + 10,
      y: editorRect0.y + editorRect0.height / 2,
    },
    {
      x: editorRect2.x + 10,
      y: editorRect2.y + editorRect2.height / 2 + 1,
    },
    {
      steps: 50,
    }
  );

  await assertRichTexts(page, ['789', '123', '456']);
  await expect(blockSelections).toHaveCount(2);
});

test('should trigger click event on editor container when clicking on blocks under block-level selection', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(
    page,
    [0, 0],
    [1, 3],
    { x: -60, y: 0 },
    { x: 80, y: 0 },
    {
      steps: 50,
    }
  );

  const blockSelections = page.locator('affine-selected-blocks > *');
  await expect(blockSelections).toHaveCount(2);
  await expect(page.locator('*:focus')).toHaveCount(0);

  const editors = page.locator('rich-text');
  const editorRect0 = await editors.nth(0).boundingBox();
  if (!editorRect0) {
    throw new Error();
  }

  await page.mouse.move(
    editorRect0.x + 5,
    editorRect0.y + editorRect0.height / 2
  );
  await page.mouse.down();
  await page.mouse.up();
  await expect(blockSelections).toHaveCount(0);
  await expect(page.locator('*:focus')).toHaveCount(1);
});

test('should get to selected block when dragging unselected block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '123');
  await pressEnter(page);
  await type(page, '456');
  await assertRichTexts(page, ['123', '456']);

  const editors = page.locator('rich-text');
  const editorRect0 = await editors.nth(0).boundingBox();
  const editorRect1 = await editors.nth(1).boundingBox();

  if (!editorRect0 || !editorRect1) {
    throw new Error();
  }

  await page.mouse.move(editorRect1.x - 5, editorRect0.y);
  await page.mouse.down();
  await page.mouse.up();

  const blockSelections = page.locator('affine-selected-blocks > *');
  await expect(blockSelections).toHaveCount(1);

  await page.mouse.move(editorRect1.x - 5, editorRect0.y);
  await page.mouse.down();
  await page.mouse.move(
    editorRect1.x - 5,
    editorRect1.y + editorRect1.height / 2 + 1,
    {
      steps: 10,
    }
  );
  await page.mouse.up();

  await expect(blockSelections).toHaveCount(1);

  await assertRichTexts(page, ['456', '123']);
});

test('should clear the currently selected block when clicked again', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '123');
  await pressEnter(page);
  await type(page, '456');
  await assertRichTexts(page, ['123', '456']);

  const editors = page.locator('rich-text');
  const editorRect0 = await editors.nth(0).boundingBox();
  const editorRect1 = await editors.nth(1).boundingBox();

  if (!editorRect0 || !editorRect1) {
    throw new Error();
  }

  await page.mouse.move(
    editorRect1.x + 5,
    editorRect1.y + editorRect1.height / 2
  );

  await page.mouse.move(
    editorRect1.x - 20,
    editorRect1.y + editorRect1.height / 2
  );
  await page.mouse.down();
  await page.mouse.up();

  const blockSelections = page.locator('affine-selected-blocks > *');
  await expect(blockSelections).toHaveCount(1);

  let selectedBlockRect = await blockSelections.nth(0).boundingBox();

  if (!selectedBlockRect) {
    throw new Error();
  }

  expect(editorRect1).toEqual(selectedBlockRect);

  await page.mouse.move(
    editorRect0.x - 20,
    editorRect0.y + editorRect0.height / 2
  );
  await page.mouse.down();
  await page.mouse.up();

  await expect(blockSelections).toHaveCount(1);

  selectedBlockRect = await blockSelections.nth(0).boundingBox();

  if (!selectedBlockRect) {
    throw new Error();
  }

  expect(editorRect0).toEqual(selectedBlockRect);
});

test('should support moving blocks from multiple frames', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await page.evaluate(() => {
    const { page } = window;

    const pageId = page.addBlock('affine:page', {
      title: new page.Text(),
    });
    page.addBlock('affine:surface', {}, pageId);

    ['123', '456', '789', '987', '654', '321'].forEach(text => {
      const frameId = page.addBlock('affine:frame', {}, pageId);
      page.addBlock(
        'affine:paragraph',
        {
          text: new page.Text(text),
        },
        frameId
      );
    });

    page.resetHistory();
  });

  await dragBetweenIndices(
    page,
    [1, 0],
    [2, 3],
    { x: -60, y: 0 },
    { x: 80, y: 0 },
    {
      steps: 50,
    }
  );

  const blockSelections = page.locator('affine-selected-blocks > *');
  await expect(blockSelections).toHaveCount(2);

  const editors = page.locator('rich-text');
  const editorRect1 = await editors.nth(1).boundingBox();
  const editorRect3 = await editors.nth(3).boundingBox();
  if (!editorRect1 || !editorRect3) {
    throw new Error();
  }

  await dragBetweenCoords(
    page,
    {
      x: editorRect1.x + 10,
      y: editorRect1.y + editorRect1.height / 2,
    },
    {
      x: editorRect3.x + 10,
      y: editorRect3.y + editorRect3.height / 2 + 1,
    },
    {
      steps: 50,
    }
  );

  await assertRichTexts(page, ['123', '987', '456', '789', '654', '321']);
  await expect(blockSelections).toHaveCount(2);

  await dragBetweenIndices(
    page,
    [5, 0],
    [4, 3],
    { x: -60, y: 0 },
    { x: 80, y: 0 },
    {
      steps: 50,
    }
  );

  const editorRect0 = await editors.nth(0).boundingBox();
  const editorRect5 = await editors.nth(5).boundingBox();
  if (!editorRect0 || !editorRect5) {
    throw new Error();
  }

  await dragBetweenCoords(
    page,
    {
      x: editorRect5.x + 10,
      y: editorRect5.y + editorRect5.height / 2,
    },
    {
      x: editorRect0.x + 10,
      y: editorRect0.y + editorRect0.height / 2 - 1,
    },
    {
      steps: 50,
    }
  );

  await assertRichTexts(page, ['654', '321', '123', '987', '456', '789']);
  await expect(blockSelections).toHaveCount(2);
});
