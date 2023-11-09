import { expect } from '@playwright/test';

import {
  activeEmbed,
  captureHistory,
  dragBetweenCoords,
  dragBetweenIndices,
  enterPlaygroundRoom,
  focusRichText,
  focusTitle,
  getSelectionRect,
  initEmptyParagraphState,
  initImageState,
  initThreeParagraphs,
  pasteByKeyboard,
  pressArrowDown,
  pressArrowRight,
  pressArrowUp,
  pressEnter,
  registerFormatBarCustomElements,
  scrollToBottom,
  scrollToTop,
  selectAllByKeyboard,
  setSelection,
  switchReadonly,
  type,
  undoByKeyboard,
  updateBlockType,
  waitNextFrame,
  withPressKey,
} from './utils/actions/index.js';
import {
  assertAlmostEqual,
  assertExists,
  assertLocatorVisible,
  assertRichImage,
  assertRichTexts,
  assertRichTextVRange,
  assertStoreMatchJSX,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';
import { getFormatBar } from './utils/query.js';

test('should format quick bar show when select text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await dragBetweenIndices(page, [0, 0], [2, 3]);
  const { formatBar } = getFormatBar(page);
  await expect(formatBar).toBeVisible();

  const box = await formatBar.boundingBox();
  if (!box) {
    throw new Error("formatBar doesn't exist");
  }
  const rect = await getSelectionRect(page);
  assertAlmostEqual(box.x - rect.left, -98, 5);
  assertAlmostEqual(box.y - rect.bottom, 10, 5);

  // Click the edge of the format quick bar
  await page.mouse.click(box.x + 4, box.y + box.height / 2);
  // Even not any button is clicked, the format quick bar should't be hidden
  await expect(formatBar).toBeVisible();

  await page.mouse.click(0, 0);
  await expect(formatBar).not.toBeVisible();
});

test('should format quick bar show when click drag handler', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  const locator = page.locator('affine-paragraph').first();
  await locator.hover();
  const dragHandle = page.locator('.affine-drag-handle-grabber');
  const dragHandleRect = await dragHandle.boundingBox();
  assertExists(dragHandleRect);
  await dragHandle.click();

  const { formatBar } = getFormatBar(page);
  await expect(formatBar).toBeVisible();

  const box = await formatBar.boundingBox();
  if (!box) {
    throw new Error("formatBar doesn't exist");
  }
  assertAlmostEqual(box.x, 264.5, 5);
  assertAlmostEqual(box.y - dragHandleRect.y, -55.5, 5);
});

test('should format quick bar show when select text by keyboard', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello world');
  await withPressKey(page, 'Shift', async () => {
    let i = 10;
    while (i--) {
      await page.keyboard.press('ArrowLeft');
      await waitNextFrame(page);
    }
  });

  const { formatBar } = getFormatBar(page);
  await expect(formatBar).toBeVisible();

  const formatBarBox = await formatBar.boundingBox();
  if (!formatBarBox) {
    throw new Error("formatBar doesn't exist");
  }
  let selectionRect = await getSelectionRect(page);
  assertAlmostEqual(formatBarBox.x - selectionRect.x, -107, 3);
  assertAlmostEqual(
    formatBarBox.y + formatBarBox.height - selectionRect.top,
    -10,
    3
  );

  await page.keyboard.press('ArrowLeft');
  await expect(formatBar).not.toBeVisible();

  await withPressKey(page, 'Shift', async () => {
    let i = 10;
    while (i--) {
      await page.keyboard.press('ArrowRight');
      await waitNextFrame(page);
    }
  });

  await expect(formatBar).toBeVisible();

  const rightBox = await formatBar.boundingBox();
  if (!rightBox) {
    throw new Error("formatBar doesn't exist");
  }
  // The x position of the format quick bar depends on the font size
  // so there are slight differences in different environments
  selectionRect = await getSelectionRect(page);
  assertAlmostEqual(formatBarBox.x - selectionRect.x, -107, 3);
  assertAlmostEqual(
    formatBarBox.y + formatBarBox.height - selectionRect.top,
    -10,
    3
  );
});

test('should format quick bar can only display one at a time', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await dragBetweenIndices(page, [0, 3], [0, 0]);
  const { formatBar } = getFormatBar(page);
  await expect(formatBar).toBeVisible();

  await dragBetweenIndices(page, [2, 0], [2, 3]);
  await expect(formatBar).toHaveCount(1);
});

test('should format quick bar hide when type text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await dragBetweenIndices(page, [0, 0], [2, 3]);
  const { formatBar } = getFormatBar(page);
  await expect(formatBar).toBeVisible();
  await type(page, '1');
  await expect(formatBar).not.toBeVisible();
});

test('should format quick bar be able to format text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  // drag only the `456` paragraph
  await dragBetweenIndices(page, [1, 0], [1, 3]);

  const { boldBtn, italicBtn, underlineBtn, strikeBtn, codeBtn } =
    getFormatBar(page);

  await expect(boldBtn).not.toHaveAttribute('active', '');
  await expect(italicBtn).not.toHaveAttribute('active', '');
  await expect(underlineBtn).not.toHaveAttribute('active', '');
  await expect(strikeBtn).not.toHaveAttribute('active', '');
  await expect(codeBtn).not.toHaveAttribute('active', '');

  await boldBtn.click();
  await italicBtn.click();
  await underlineBtn.click();
  await strikeBtn.click();
  await codeBtn.click();

  // The button should be active after click
  await expect(boldBtn).toHaveAttribute('active', '');
  await expect(italicBtn).toHaveAttribute('active', '');
  await expect(underlineBtn).toHaveAttribute('active', '');
  await expect(strikeBtn).toHaveAttribute('active', '');
  await expect(codeBtn).toHaveAttribute('active', '');

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={true}
          code={true}
          insert="456"
          italic={true}
          strike={true}
          underline={true}
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
  await boldBtn.click();
  await underlineBtn.click();
  await codeBtn.click();

  await waitNextFrame(page);

  // The bold button should be inactive after click again
  await expect(boldBtn).not.toHaveAttribute('active', '');
  await expect(italicBtn).toHaveAttribute('active', '');
  await expect(underlineBtn).not.toHaveAttribute('active', '');
  await expect(strikeBtn).toHaveAttribute('active', '');
  await expect(codeBtn).not.toHaveAttribute('active', '');

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          insert="456"
          italic={true}
          strike={true}
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});

test.fixme(
  'should format quick bar be able to change background color',
  async ({ page }) => {
    await enterPlaygroundRoom(page);
    const { noteId } = await initEmptyParagraphState(page);
    await initThreeParagraphs(page);
    // select `456` paragraph by dragging
    await dragBetweenIndices(page, [1, 0], [1, 3]);

    const { highlight } = getFormatBar(page);

    await highlight.backgroundBtn.hover();
    await expect(highlight.pinkBtn).toBeVisible();
    await expect(highlight.backgroundBtn).toHaveAttribute(
      'data-last-used',
      'unset'
    );
    await highlight.pinkBtn.click();
    await expect(highlight.backgroundBtn).toHaveAttribute(
      'data-last-used',
      'var(--affine-text-highlight-pink)'
    );

    await assertStoreMatchJSX(
      page,
      `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          background="var(--affine-text-highlight-pink)"
          insert="456"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:note>`,
      noteId
    );

    // select `123` paragraph by ctrl + a
    await focusRichText(page);
    await selectAllByKeyboard(page);
    // use last used color
    await highlight.backgroundBtn.click();

    await assertStoreMatchJSX(
      page,
      `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text={
      <>
        <text
          background="var(--affine-text-highlight-pink)"
          insert="123"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          background="var(--affine-text-highlight-pink)"
          insert="456"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:note>`,
      noteId
    );

    await expect(highlight.defaultColorBtn).toBeVisible();
    await highlight.defaultColorBtn.click();

    await assertStoreMatchJSX(
      page,
      `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          background="var(--affine-text-highlight-pink)"
          insert="456"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:note>`,
      noteId
    );
  }
);

test('should format quick bar be able to format text when select multiple line', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await dragBetweenIndices(page, [0, 0], [2, 3]);

  const { boldBtn } = getFormatBar(page);
  await expect(boldBtn).not.toHaveAttribute('active', '');
  await boldBtn.click();

  // The bold button should be active after click
  await expect(boldBtn).toHaveAttribute('active', '');
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={true}
          insert="123"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={true}
          insert="456"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={true}
          insert="789"
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  await boldBtn.click();
  await expect(boldBtn).not.toHaveAttribute('active', '');
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  />
  <affine:paragraph
    prop:text="456"
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});

test('should format quick bar be able to link text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  // drag only the `456` paragraph
  await dragBetweenIndices(page, [1, 0], [1, 3]);

  const { linkBtn } = getFormatBar(page);
  await expect(linkBtn).not.toHaveAttribute('active', '');
  await linkBtn.click();

  const linkPopoverInput = page.locator('.affine-link-popover-input');
  await expect(linkPopoverInput).toBeVisible();

  await type(page, 'https://www.example.com');
  await pressEnter(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          insert="456"
          link="https://www.example.com"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  // FIXME: remove this
  await focusRichText(page);
  await setSelection(page, 3, 0, 3, 3);
  // The link button should be active after click
  await expect(linkBtn).toHaveAttribute('active', '');
  await linkBtn.click();
  await waitNextFrame(page);
  await expect(linkBtn).not.toHaveAttribute('active', '');
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  />
  <affine:paragraph
    prop:text="456"
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
});

test('should format quick bar be able to change to heading paragraph type', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  // drag only the `456` paragraph
  await dragBetweenIndices(page, [0, 0], [0, 3]);

  const { openParagraphMenu, h1Btn, bulletedBtn } = getFormatBar(page);
  await openParagraphMenu();

  await expect(h1Btn).toBeVisible();
  await h1Btn.click();

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="123"
    prop:type="h1"
  />
  <affine:paragraph
    prop:text="456"
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  await bulletedBtn.click();
  await openParagraphMenu();
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:list
    prop:checked={false}
    prop:collapsed={false}
    prop:text="123"
    prop:type="bulleted"
  />
  <affine:paragraph
    prop:text="456"
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  const { textBtn } = getFormatBar(page);
  await textBtn.click();

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  />
  <affine:paragraph
    prop:text="456"
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );
  await page.waitForTimeout(10);
  // The paragraph button should prevent selection after click
  await assertRichTextVRange(page, 0, 0, 3);
});

test('should format quick bar be able to copy', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  // drag only the `456` paragraph
  await dragBetweenIndices(page, [1, 0], [1, 3]);

  const { copyBtn } = getFormatBar(page);
  await expect(copyBtn).toBeVisible();
  await assertRichTextVRange(page, 1, 0, 3);
  await copyBtn.click();
  await assertRichTextVRange(page, 1, 0, 3);

  await pressArrowRight(page, 1);
  await pasteByKeyboard(page);
  await waitNextFrame(page);

  await assertRichTexts(page, ['123', '456456', '789']);
});

test('should format quick bar show when double click text', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await page.dblclick('.affine-rich-text', {
    position: { x: 10, y: 10 },
  });
  const { formatBar } = getFormatBar(page);
  await expect(formatBar).toBeVisible();
});

test('should format quick bar not show at readonly mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await switchReadonly(page);

  await dragBetweenIndices(page, [0, 0], [2, 3]);
  const { formatBar } = getFormatBar(page);
  await expect(formatBar).not.toBeVisible();

  await page.dblclick('.affine-rich-text', { position: { x: 10, y: 10 } });
  await expect(formatBar).not.toBeVisible();
});

test('should format bar follow scroll', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  for (let i = 0; i < 30; i++) {
    await pressEnter(page);
  }

  await scrollToTop(page);

  await dragBetweenIndices(page, [0, 0], [2, 3]);
  const { formatBar, boldBtn } = getFormatBar(page);
  await assertLocatorVisible(page, formatBar);

  await scrollToBottom(page);

  await assertLocatorVisible(page, formatBar, false);

  // should format bar follow scroll after click bold button
  await scrollToTop(page);
  await assertLocatorVisible(page, formatBar);
  await boldBtn.click();
  await scrollToBottom(page);
  await assertLocatorVisible(page, formatBar, false);

  // should format bar follow scroll after transform text type
  await scrollToTop(page);
  await assertLocatorVisible(page, formatBar);
  await updateBlockType(page, 'affine:list', 'bulleted');
  await scrollToBottom(page);
  await assertLocatorVisible(page, formatBar, false);
});

test('should format quick bar position correct at the start of second line', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await page.evaluate(() => {
    const { page } = window;
    const pageId = page.addBlock('affine:page', {
      title: new page.Text(),
    });
    const note = page.addBlock('affine:note', {}, pageId);
    const text = new page.Text('a'.repeat(100));
    const paragraphId = page.addBlock('affine:paragraph', { text }, note);
    return paragraphId;
  });
  // await focusRichText(page);
  const locator = page.locator('.virgo-editor').nth(0);
  const textBox = await locator.boundingBox();
  if (!textBox) {
    throw new Error("Can't get bounding box");
  }
  // Drag to the start of the second line
  await dragBetweenCoords(
    page,
    { x: textBox.x + textBox.width - 1, y: textBox.y + textBox.height - 1 },
    { x: textBox.x, y: textBox.y + textBox.height - 1 }
  );

  const { formatBar } = getFormatBar(page);
  await expect(formatBar).toBeVisible();
  await waitNextFrame(page);

  const formatBox = await formatBar.boundingBox();
  if (!formatBox) {
    throw new Error("formatBar doesn't exist");
  }
  const selectionRect = await getSelectionRect(page);
  assertAlmostEqual(formatBox.x - selectionRect.x, -99, 5);
  assertAlmostEqual(formatBox.y + formatBox.height - selectionRect.top, 68, 5);
});

test('should format quick bar action status updated while undo', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'helloworld');
  await captureHistory(page);
  await dragBetweenIndices(page, [0, 1], [0, 6]);

  const { formatBar, boldBtn } = getFormatBar(page);
  await expect(formatBar).toBeVisible();
  await expect(boldBtn).toBeVisible();

  await expect(boldBtn).not.toHaveAttribute('active', '');
  await boldBtn.click();
  await expect(boldBtn).toHaveAttribute('active', '');

  await undoByKeyboard(page);
  await expect(formatBar).toBeVisible();
  await expect(boldBtn).not.toHaveAttribute('active', '');
});

test('should format quick bar work in single block selection', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  await dragBetweenIndices(
    page,
    [1, 0],
    [1, 3],
    { x: -26 - 24, y: -10 },
    { x: 0, y: 0 }
  );
  const blockSelections = page.locator('.selected,affine-block-selection');
  await expect(blockSelections).toHaveCount(1);

  const { formatBar } = getFormatBar(page);
  await expect(formatBar).toBeVisible();

  const formatRect = await formatBar.boundingBox();
  const selectionRect = await blockSelections.boundingBox();
  assertExists(formatRect);
  assertExists(selectionRect);
  assertAlmostEqual(formatRect.x - selectionRect.x, 160.5, 10);
  assertAlmostEqual(formatRect.y - selectionRect.y, -50, 10);

  const boldBtn = formatBar.getByTestId('bold');
  await boldBtn.click();
  const italicBtn = formatBar.getByTestId('italic');
  await italicBtn.click();
  const underlineBtn = formatBar.getByTestId('underline');
  await underlineBtn.click();
  //FIXME: trt to cancel italic
  // Cancel italic
  // await italicBtn.click();

  await expect(blockSelections).toHaveCount(1);

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={true}
          insert="456"
          italic={true}
          underline={true}
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  await page.mouse.click(0, 0);
  await expect(formatBar).not.toBeVisible();
});

test('should format quick bar work in multiple block selection', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  await dragBetweenIndices(
    page,
    [2, 3],
    [0, 0],
    { x: 20, y: 20 },
    { x: 0, y: 0 }
  );
  const blockSelections = page.locator('.selected,affine-block-selection');
  await expect(blockSelections).toHaveCount(3);

  const formatBarController = getFormatBar(page);
  await expect(formatBarController.formatBar).toBeVisible();

  const box = await formatBarController.formatBar.boundingBox();
  if (!box) {
    throw new Error("formatBar doesn't exist");
  }
  const rect = await blockSelections.first().boundingBox();
  assertExists(rect);
  assertAlmostEqual(box.x - rect.x, 160.5, 10);
  assertAlmostEqual(box.y - rect.y, -45, 10);

  await formatBarController.boldBtn.click();
  await formatBarController.italicBtn.click();
  await formatBarController.underlineBtn.click();
  // Cancel italic
  await formatBarController.italicBtn.click();

  await expect(blockSelections).toHaveCount(3);

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={true}
          insert="123"
          underline={true}
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={true}
          insert="456"
          underline={true}
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={true}
          insert="789"
          underline={true}
        />
      </>
    }
    prop:type="text"
  />
</affine:note>`,
    noteId
  );

  await page.mouse.click(0, 0);
  await expect(formatBarController.formatBar).not.toBeVisible();
});

test('should format quick bar with block selection works when update block type', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  await dragBetweenIndices(
    page,
    [2, 3],
    [0, 0],
    { x: 20, y: 20 },
    { x: 0, y: 0 }
  );
  const blockSelections = page.locator('.selected,affine-block-selection');
  await expect(blockSelections).toHaveCount(3);

  const formatBarController = getFormatBar(page);
  await expect(formatBarController.formatBar).toBeVisible();

  await formatBarController.openParagraphMenu();
  await formatBarController.bulletedBtn.click();
  await expect(blockSelections).toHaveCount(3);

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:list
    prop:checked={false}
    prop:collapsed={false}
    prop:text="123"
    prop:type="bulleted"
  />
  <affine:list
    prop:checked={false}
    prop:collapsed={false}
    prop:text="456"
    prop:type="bulleted"
  />
  <affine:list
    prop:checked={false}
    prop:collapsed={false}
    prop:text="789"
    prop:type="bulleted"
  />
</affine:note>`,
    noteId
  );

  await expect(formatBarController.formatBar).toBeVisible();
  await formatBarController.h1Btn.click();
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="123"
    prop:type="h1"
  />
  <affine:paragraph
    prop:text="456"
    prop:type="h1"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="h1"
  />
</affine:note>`,
    noteId
  );
  await expect(formatBarController.formatBar).toBeVisible();
  await expect(blockSelections).toHaveCount(3);
  await page.mouse.click(0, 0);
  await expect(formatBarController.formatBar).not.toBeVisible();
});

test('should format quick bar show after convert to code block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  const formatBarController = getFormatBar(page);
  await dragBetweenIndices(
    page,
    [2, 3],
    [0, 0],
    { x: 20, y: 20 },
    { x: 0, y: 0 }
  );
  await expect(formatBarController.formatBar).toBeVisible();
  await formatBarController.assertBoundingBox(264.5, 194);

  await formatBarController.openParagraphMenu();
  await formatBarController.codeBlockBtn.click();
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:code
    prop:language="Plain Text"
    prop:text="123\n456\n789"
  />
</affine:note>`,
    noteId
  );
});

test('buttons in format quick bar should have correct active styles', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  // drag only the `45`
  await dragBetweenIndices(page, [1, 0], [1, 2]);
  const { codeBtn } = getFormatBar(page);
  await codeBtn.click();
  await expect(codeBtn).toHaveAttribute('active', '');

  // drag the `456`
  await dragBetweenIndices(page, [1, 0], [1, 3]);
  await expect(codeBtn).not.toHaveAttribute('active', '');
});

test('should format bar style active correctly', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await page.evaluate(() => {
    const { page } = window;
    const pageId = page.addBlock('affine:page', {
      title: new page.Text(),
    });
    const note = page.addBlock('affine:note', {}, pageId);
    const delta = [
      { insert: '1', attributes: { bold: true, italic: true } },
      { insert: '2', attributes: { bold: true, underline: true } },
      { insert: '3', attributes: { bold: true, code: true } },
    ];
    const text = page.Text.fromDelta(delta);
    page.addBlock('affine:paragraph', { text }, note);
  });

  const { boldBtn, codeBtn, underlineBtn } = getFormatBar(page);
  await dragBetweenIndices(page, [0, 0], [0, 3]);
  await expect(boldBtn).toHaveAttribute('active', '');
  await expect(underlineBtn).not.toHaveAttribute('active', '');
  await expect(codeBtn).not.toHaveAttribute('active', '');

  await underlineBtn.click();
  await expect(underlineBtn).toHaveAttribute('active', '');
  await expect(boldBtn).toHaveAttribute('active', '');
  await expect(codeBtn).not.toHaveAttribute('active', '');
});

test('should format quick bar show when double click button', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await dragBetweenIndices(page, [0, 0], [2, 3]);
  const { formatBar, boldBtn } = getFormatBar(page);
  await expect(formatBar).toBeVisible();
  await boldBtn.dblclick();
  await expect(formatBar).toBeVisible();
});

test('should the database action icon show correctly', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  const databaseAction = page.getByTestId('convert-to-database');

  await focusRichText(page);
  await dragBetweenIndices(
    page,
    [2, 3],
    [0, 0],
    { x: 20, y: 20 },
    { x: 0, y: 0 }
  );
  await expect(databaseAction).toBeVisible();

  await focusRichText(page, 2);
  await pressEnter(page);
  await updateBlockType(page, 'affine:code');
  const codeBlock = page.locator('affine-code');
  const codeBox = await codeBlock.boundingBox();
  if (!codeBox) throw new Error('Missing code block box');
  const position = {
    startX: codeBox.x,
    startY: codeBox.y + codeBox.height / 2,
    endX: codeBox.x + codeBox.width,
    endY: codeBox.y + codeBox.height / 2,
  };
  await page.mouse.click(position.endX + 150, position.endY + 150);
  await dragBetweenCoords(
    page,
    { x: position.startX - 10, y: position.startY - 10 },
    { x: position.endX, y: position.endY },
    { steps: 20 }
  );
  await expect(databaseAction).toBeVisible();
  await expect(databaseAction).toHaveAttribute('disabled', '');
});

test('should convert to database work', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  await dragBetweenIndices(
    page,
    [2, 3],
    [0, 0],
    { x: 20, y: 20 },
    { x: 0, y: 0 }
  );
  const databaseAction = page.getByTestId('convert-to-database');
  await databaseAction.click();
  const tableView = page.locator('.modal-view-item.table');
  await tableView.click();
  const database = page.locator('affine-database');
  await expect(database).toBeVisible();
  const rows = page.locator('.affine-database-block-row');
  expect(await rows.count()).toBe(3);
});

test('should show format-quick-bar and select all text of the block when triple clicking on text', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello world');

  const locator = page.locator('.virgo-editor').nth(0);
  const textBox = await locator.boundingBox();
  if (!textBox) {
    throw new Error("Can't get bounding box");
  }

  await page.mouse.dblclick(textBox.x + 10, textBox.y + textBox.height / 2);

  const { formatBar } = getFormatBar(page);
  await expect(formatBar).toBeVisible();

  await assertRichTextVRange(page, 0, 0, 5);

  await page.mouse.click(0, 0);

  await expect(formatBar).toBeHidden();

  await page.mouse.move(textBox.x + 10, textBox.y + textBox.height / 2);

  const options = {
    clickCount: 1,
  };
  await page.mouse.down(options);
  await page.mouse.up(options);

  options.clickCount++;
  await page.mouse.down(options);
  await page.mouse.up(options);

  options.clickCount++;
  await page.mouse.down(options);
  await page.mouse.up(options);

  await assertRichTextVRange(page, 0, 0, 'hello world'.length);
});

test('should update the format quick bar state when there is a change in keyboard selection', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await page.evaluate(() => {
    const { page } = window;
    const pageId = page.addBlock('affine:page', {
      title: new page.Text(),
    });
    const note = page.addBlock('affine:note', {}, pageId);
    const delta = [
      { insert: '1', attributes: { bold: true } },
      { insert: '2', attributes: { bold: true } },
      { insert: '3', attributes: { bold: false } },
    ];
    const text = page.Text.fromDelta(delta);
    page.addBlock('affine:paragraph', { text }, note);
  });
  await focusTitle(page);
  await pressArrowDown(page);

  const formatBar = getFormatBar(page);
  await withPressKey(page, 'Shift', async () => {
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(formatBar.boldBtn).toHaveAttribute('active', '');
    await page.keyboard.press('ArrowRight');
    await expect(formatBar.boldBtn).not.toHaveAttribute('active', '');
  });
});

test('should register custom elements in format quick bar', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await registerFormatBarCustomElements(page);
  await dragBetweenIndices(page, [0, 0], [2, 3]);
  await expect(page.getByTestId('custom-format-bar-element')).toBeVisible();
});

test.fixme(
  'format quick bar should not break cursor jumping',
  async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await initThreeParagraphs(page);
    await dragBetweenIndices(page, [1, 3], [1, 2]);

    const { formatBar } = getFormatBar(page);
    await expect(formatBar).toBeVisible();

    await pressArrowUp(page);
    await type(page, '0');
    await assertRichTexts(page, ['1203', '456', '789']);

    await dragBetweenIndices(page, [1, 3], [1, 2]);
    await pressArrowDown(page);
    await type(page, '0');
    await assertRichTexts(page, ['1203', '456', '7809']);
  }
);

test('selecting image should not show format bar', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/4535',
  });
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await assertRichImage(page, 1);
  await activeEmbed(page);
  await waitNextFrame(page);
  const { formatBar } = getFormatBar(page);
  await expect(formatBar).not.toBeVisible();
});
