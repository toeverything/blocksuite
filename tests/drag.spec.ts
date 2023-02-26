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

  const rightBottom = await page.evaluate(() => {
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
  await page.mouse.move(rightBottom.x, rightBottom.y);
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
  expect(await page.locator('affine-drag-indicator').isHidden()).toBe(true);
  await assertRichTexts(page, ['456', '789', '123']);
});

test('move drag handle in list', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeLists(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await dragHandleFromBlockToBlockBottomById(page, '5', '3', false);
  expect(await page.locator('affine-drag-indicator').isHidden()).toBe(true);
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
  expect(await page.locator('affine-drag-indicator').isHidden()).toBe(true);
  await assertRichTexts(page, ['1', '2', '22', '23', '21', '3']);

  await dragHandleFromBlockToBlockBottomById(page, '3', '8');
  expect(await page.locator('affine-drag-indicator').isHidden()).toBe(true);
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
<affine:page
  prop:title=""
>
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
  expect(await page.locator('affine-drag-indicator').isHidden()).toBe(true);

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page
  prop:title=""
>
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
  expect(await page.locator('affine-drag-indicator').isHidden()).toBe(true);

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page
  prop:title=""
>
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
  expect(await page.locator('affine-drag-indicator').isHidden()).toBe(true);

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page
  prop:title=""
>
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

  const handle = await page.locator('affine-drag-handle');
  await handle.click();

  await page.keyboard.press('Backspace');
  await assertRichTexts(page, [
    '123',
    `
`,
    '789',
  ]);
});

test('should be able to drag & drop multiple blocks', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await dragBetweenIndices(
    page,
    [1, 3],
    [0, 0],
    { x: -80, y: 20 },
    { x: 60, y: 0 },
    {
      steps: 50,
    }
  );

  const blockSelections = page.locator(
    '.affine-page-selected-rects-container > *'
  );
  await expect(blockSelections).toHaveCount(2);

  await dragHandleFromBlockToBlockBottomById(page, '2', '4', true);
  expect(await page.locator('affine-drag-indicator').isHidden()).toBe(true);

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
<affine:page
  prop:title=""
>
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
    [1, 10],
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
<affine:page
  prop:title=""
>
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
