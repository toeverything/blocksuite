import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import {
  clickBlockTypeMenuItem,
  dragBetweenCoords,
  dragBetweenIndices,
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
  initThreeParagraphs,
  pasteByKeyboard,
  pressArrowRight,
  pressEnter,
  setSelection,
  switchReadonly,
  type,
  undoByKeyboard,
  waitNextFrame,
  withPressKey,
} from './utils/actions/index.js';
import {
  assertAlmostEqual,
  assertLocatorVisible,
  assertRichTexts,
  assertSelection,
  assertStoreMatchJSX,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

function getFormatBar(page: Page) {
  const formatQuickBar = page.locator(`.format-quick-bar`);
  const boldBtn = formatQuickBar.getByTestId('bold');
  const italicBtn = formatQuickBar.getByTestId('italic');
  const underlineBtn = formatQuickBar.getByTestId('underline');
  const strikeBtn = formatQuickBar.getByTestId('strike');
  const codeBtn = formatQuickBar.getByTestId('code');
  const linkBtn = formatQuickBar.getByTestId('link');
  const copyBtn = formatQuickBar.getByTestId('copy');

  const paragraphBtn = formatQuickBar.locator(`.paragraph-button`);
  const openParagraphMenu = async () => {
    await expect(formatQuickBar).toBeVisible();
    await paragraphBtn.hover();
  };

  const textBtn = formatQuickBar.getByTestId('affine:paragraph/text');
  const h1Btn = formatQuickBar.getByTestId('affine:paragraph/h1');
  const bulletedBtn = formatQuickBar.getByTestId('affine:list/bulleted');
  const codeBlockBtn = formatQuickBar.getByTestId('affine:code/');

  const assertBoundingBox = async (x: number, y: number) => {
    const boundingBox = await formatQuickBar.boundingBox();
    if (!boundingBox) {
      throw new Error("formatQuickBar doesn't exist");
    }
    assertAlmostEqual(boundingBox.x, x, 6);
    assertAlmostEqual(boundingBox.y, y, 6);
  };

  return {
    formatQuickBar,
    boldBtn,
    italicBtn,
    underlineBtn,
    strikeBtn,
    codeBtn,
    linkBtn,
    copyBtn,

    openParagraphMenu,
    textBtn,
    h1Btn,
    bulletedBtn,
    codeBlockBtn,

    assertBoundingBox,
  };
}

test('should format quick bar show when select text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await dragBetweenIndices(page, [0, 0], [2, 3]);
  const formatQuickBar = page.locator(`.format-quick-bar`);
  await expect(formatQuickBar).toBeVisible();

  const box = await formatQuickBar.boundingBox();
  if (!box) {
    throw new Error("formatQuickBar doesn't exist");
  }
  assertAlmostEqual(box.x, 20, 5);
  assertAlmostEqual(box.y, 230, 10);

  // Click the edge of the format quick bar
  await page.mouse.click(box.x + 4, box.y + box.height / 2);
  // Even not any button is clicked, the format quick bar should't be hidden
  await expect(formatQuickBar).toBeVisible();

  await page.mouse.click(0, 0);
  await expect(formatQuickBar).not.toBeVisible();
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
    }
  });

  const formatQuickBar = page.locator(`.format-quick-bar`);
  await expect(formatQuickBar).toBeVisible();

  const leftBox = await formatQuickBar.boundingBox();
  if (!leftBox) {
    throw new Error("formatQuickBar doesn't exist");
  }
  assertAlmostEqual(leftBox.x, 20, 3);
  assertAlmostEqual(leftBox.y, 100, 10);

  await page.keyboard.press('ArrowLeft');
  await expect(formatQuickBar).not.toBeVisible();

  await withPressKey(page, 'Shift', async () => {
    let i = 10;
    while (i--) {
      await page.keyboard.press('ArrowRight');
    }
  });

  await expect(formatQuickBar).toBeVisible();

  const rightBox = await formatQuickBar.boundingBox();
  if (!rightBox) {
    throw new Error("formatQuickBar doesn't exist");
  }
  // The x position of the format quick bar depends on the font size
  // so there are slight differences in different environments
  assertAlmostEqual(rightBox.x, 20, 6);
  assertAlmostEqual(rightBox.y, 165, 10);
});

test('should format quick bar can only display one at a time', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await dragBetweenIndices(page, [0, 3], [0, 0]);
  const formatQuickBar = page.locator(`.format-quick-bar`);
  await expect(formatQuickBar).toBeVisible();

  await dragBetweenIndices(page, [2, 0], [2, 3]);
  await expect(formatQuickBar).toHaveCount(1);
});

test('should format quick bar hide when type text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await dragBetweenIndices(page, [0, 0], [2, 3]);
  const formatQuickBar = page.locator(`.format-quick-bar`);
  await expect(formatQuickBar).toBeVisible();
  await type(page, '1');
  await expect(formatQuickBar).not.toBeVisible();
});

test('should format quick bar be able to format text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  // drag only the `456` paragraph
  await dragBetweenIndices(page, [1, 0], [1, 3]);

  const formatQuickBar = page.locator(`.format-quick-bar`);
  const boldBtn = formatQuickBar.locator(`[data-testid=bold]`);
  const italicBtn = formatQuickBar.locator(`[data-testid=italic]`);
  const underlineBtn = formatQuickBar.locator(`[data-testid=underline]`);
  const strikeBtn = formatQuickBar.locator(`[data-testid=strike]`);
  const codeBtn = formatQuickBar.locator(`[data-testid=code]`);

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
    `<affine:frame>
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
</affine:frame>`,
    frameId
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
    `<affine:frame>
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
</affine:frame>`,
    frameId
  );
});

test('should format quick bar be able to format text when select multiple line', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await dragBetweenIndices(page, [0, 0], [2, 3]);

  const boldBtn = page.locator(`.format-quick-bar [data-testid=bold]`);
  await expect(boldBtn).not.toHaveAttribute('active', '');
  await boldBtn.click();

  // The bold button should be active after click
  await expect(boldBtn).toHaveAttribute('active', '');
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
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
</affine:frame>`,
    frameId
  );

  await boldBtn.click();
  await expect(boldBtn).not.toHaveAttribute('active', '');
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
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
</affine:frame>`,
    frameId
  );
});

test('should format quick bar be able to link text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  // drag only the `456` paragraph
  await dragBetweenIndices(page, [1, 0], [1, 3]);

  const linkBtn = page.locator(`.format-quick-bar [data-testid=link]`);
  await expect(linkBtn).not.toHaveAttribute('active', '');
  await linkBtn.click();

  const linkPopoverInput = page.locator('.affine-link-popover-input');
  await expect(linkPopoverInput).toBeVisible();

  await type(page, 'https://www.example.com');
  await pressEnter(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
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
</affine:frame>`,
    frameId
  );

  await setSelection(page, 3, 0, 3, 3);
  // The link button should be active after click
  await expect(linkBtn).toHaveAttribute('active', '');
  await linkBtn.click();
  await waitNextFrame(page);
  await expect(linkBtn).not.toHaveAttribute('active', '');
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
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
</affine:frame>`,
    frameId
  );
});

test('should format quick bar be able to change to heading paragraph type', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  // drag only the `456` paragraph
  await dragBetweenIndices(page, [1, 0], [1, 3]);

  const paragraphBtn = page.locator(`.paragraph-button`);
  await paragraphBtn.hover();
  const h1Btn = page
    .locator(`.format-quick-bar`)
    .getByTestId('affine:paragraph/h1');
  await expect(h1Btn).toBeVisible();
  await h1Btn.click();

  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  />
  <affine:paragraph
    prop:text="456"
    prop:type="h1"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:frame>`,
    frameId
  );
  const bulletedBtn = page
    .locator(`.format-quick-bar`)
    .getByTestId('affine:list/bulleted');
  await bulletedBtn.click();
  await paragraphBtn.hover();
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  />
  <affine:list
    prop:checked={false}
    prop:text="456"
    prop:type="bulleted"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:frame>`,
    frameId
  );

  const textBtn = page
    .locator(`.format-quick-bar`)
    .getByTestId('affine:paragraph/text');
  await textBtn.click();

  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
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
</affine:frame>`,
    frameId
  );
  await page.waitForTimeout(10);
  // The paragraph button should prevent selection after click
  await assertSelection(page, 1, 0, 3);
});

test('should format quick bar be able to copy', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  // drag only the `456` paragraph
  await dragBetweenIndices(page, [1, 0], [1, 3]);

  const copyBtn = page.locator(`.format-quick-bar [data-testid=copy]`);
  await expect(copyBtn).toBeVisible();
  await assertSelection(page, 1, 0, 3);
  await copyBtn.click();
  await assertSelection(page, 1, 0, 3);

  await pressArrowRight(page, 1);
  await pasteByKeyboard(page);

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
  const formatQuickBar = page.locator(`.format-quick-bar`);
  await expect(formatQuickBar).toBeVisible();
});

test('should format quick bar not show at readonly mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await switchReadonly(page);

  await dragBetweenIndices(page, [0, 0], [2, 3]);
  const formatQuickBar = page.locator(`.format-quick-bar`);
  await expect(formatQuickBar).not.toBeVisible();

  await page.dblclick('.affine-rich-text', { position: { x: 10, y: 10 } });
  await expect(formatQuickBar).not.toBeVisible();
});

async function scrollToTop(page: Page) {
  await page.mouse.wheel(0, -1000);

  await page.waitForFunction(() => {
    const scrollContainer = document.querySelector('.affine-default-viewport');
    if (!scrollContainer) {
      throw new Error("Can't find scroll container");
    }
    return scrollContainer.scrollTop < 10;
  });
}

async function scrollToBottom(page: Page) {
  // await page.mouse.wheel(0, 1000);

  await page
    .locator('.affine-default-viewport')
    .evaluate(node =>
      node.scrollTo({ left: 0, top: 1000, behavior: 'smooth' })
    );
  // TODO switch to `scrollend`
  // See https://developer.chrome.com/en/blog/scrollend-a-new-javascript-event/
  await page.waitForFunction(() => {
    const scrollContainer = document.querySelector('.affine-default-viewport');
    if (!scrollContainer) {
      throw new Error("Can't find scroll container");
    }

    return (
      // Wait for scrolled to the bottom
      // Refer to https://stackoverflow.com/questions/3898130/check-if-a-user-has-scrolled-to-the-bottom-not-just-the-window-but-any-element
      Math.abs(
        scrollContainer.scrollHeight -
          scrollContainer.scrollTop -
          scrollContainer.clientHeight
      ) < 10
    );
  });
}

test('should format quick bar follow scroll', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  for (let i = 0; i < 20; i++) {
    await pressEnter(page);
  }

  await scrollToTop(page);

  await dragBetweenIndices(page, [0, 0], [2, 3]);
  const formatQuickBar = page.locator(`.format-quick-bar`);
  await assertLocatorVisible(page, formatQuickBar);

  await scrollToBottom(page);

  await assertLocatorVisible(page, formatQuickBar, false);

  // should format bar follow scroll after click bold button
  await scrollToTop(page);
  const boldBtn = formatQuickBar.locator(`[data-testid=bold]`);
  await assertLocatorVisible(page, formatQuickBar);
  await boldBtn.click();
  await scrollToBottom(page);
  await assertLocatorVisible(page, formatQuickBar, false);

  // should format bar follow scroll after transform text type
  await scrollToTop(page);
  await assertLocatorVisible(page, formatQuickBar);
  await clickBlockTypeMenuItem(page, 'Bulleted List');
  await scrollToBottom(page);
  await assertLocatorVisible(page, formatQuickBar, false);
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
    const frame = page.addBlock('affine:frame', {}, pageId);
    const text = new page.Text('a'.repeat(100));
    const paragraphId = page.addBlock('affine:paragraph', { text }, frame);
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

  const formatQuickBar = page.locator(`.format-quick-bar`);
  await expect(formatQuickBar).toBeVisible();

  const formatBox = await formatQuickBar.boundingBox();
  if (!formatBox) {
    throw new Error("formatQuickBar doesn't exist");
  }
  assertAlmostEqual(formatBox.x, 20, 5);
  assertAlmostEqual(formatBox.y, 123, 9);
});

test('should format quick bar action status updated while undo', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'helloworld');
  await dragBetweenIndices(page, [0, 1], [0, 6]);

  const formatQuickBar = page.locator(`.format-quick-bar`);
  const boldBtn = formatQuickBar.locator(`[data-testid=bold]`);

  await expect(boldBtn).not.toHaveAttribute('active', '');
  await boldBtn.click();
  await expect(boldBtn).toHaveAttribute('active', '');
  await undoByKeyboard(page);
  await expect(boldBtn).not.toHaveAttribute('active', '');
});

test('should format quick bar work in single block selection', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  await dragBetweenIndices(
    page,
    [1, 0],
    [1, 3],
    { x: -26 - 24, y: -10 },
    { x: 0, y: 0 }
  );
  const blockSelections = page.locator(
    '.affine-page-selected-rects-container > *'
  );
  await expect(blockSelections).toHaveCount(1);

  const formatQuickBar = page.locator(`.format-quick-bar`);
  await expect(formatQuickBar).toBeVisible();

  const box = await formatQuickBar.boundingBox();
  if (!box) {
    throw new Error("formatQuickBar doesn't exist");
  }
  assertAlmostEqual(box.x, 285, 5);
  assertAlmostEqual(box.y, 200, 8);

  const boldBtn = formatQuickBar.getByTestId('bold');
  await boldBtn.click();
  const italicBtn = formatQuickBar.getByTestId('italic');
  await italicBtn.click();
  const underlineBtn = formatQuickBar.getByTestId('underline');
  await underlineBtn.click();
  // Cancel italic
  await italicBtn.click();

  await expect(blockSelections).toHaveCount(1);

  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
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
</affine:frame>`,
    frameId
  );

  await page.mouse.click(0, 0);
  await expect(formatQuickBar).not.toBeVisible();
});

test('should format quick bar work in multiple block selection', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  await dragBetweenIndices(
    page,
    [2, 3],
    [0, 0],
    { x: 20, y: 20 },
    { x: 0, y: 0 }
  );
  const blockSelections = page.locator(
    '.affine-page-selected-rects-container > *'
  );
  await expect(blockSelections).toHaveCount(3);

  const formatBarController = getFormatBar(page);
  await expect(formatBarController.formatQuickBar).toBeVisible();

  const box = await formatBarController.formatQuickBar.boundingBox();
  if (!box) {
    throw new Error("formatQuickBar doesn't exist");
  }
  assertAlmostEqual(box.x, 303, 5);
  assertAlmostEqual(box.y, 100, 10);

  await formatBarController.boldBtn.click();
  await formatBarController.italicBtn.click();
  await formatBarController.underlineBtn.click();
  // Cancel italic
  await formatBarController.italicBtn.click();

  await expect(blockSelections).toHaveCount(3);

  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
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
</affine:frame>`,
    frameId
  );

  await page.mouse.click(0, 0);
  await expect(formatBarController.formatQuickBar).not.toBeVisible();
});

test('should format quick bar with block selection works when update block type', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  await dragBetweenIndices(
    page,
    [2, 3],
    [0, 0],
    { x: 20, y: 20 },
    { x: 0, y: 0 }
  );
  const blockSelections = page.locator(
    '.affine-page-selected-rects-container > *'
  );
  await expect(blockSelections).toHaveCount(3);

  const formatBarController = getFormatBar(page);
  await expect(formatBarController.formatQuickBar).toBeVisible();

  await formatBarController.openParagraphMenu();
  await formatBarController.bulletedBtn.click();
  await expect(blockSelections).toHaveCount(3);

  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
  <affine:list
    prop:checked={false}
    prop:text="123"
    prop:type="bulleted"
  />
  <affine:list
    prop:checked={false}
    prop:text="456"
    prop:type="bulleted"
  />
  <affine:list
    prop:checked={false}
    prop:text="789"
    prop:type="bulleted"
  />
</affine:frame>`,
    frameId
  );

  await expect(formatBarController.formatQuickBar).toBeVisible();
  await formatBarController.h1Btn.click();
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
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
</affine:frame>`,
    frameId
  );
  await expect(formatBarController.formatQuickBar).toBeVisible();
  await expect(blockSelections).toHaveCount(3);
  await page.mouse.click(0, 0);
  await expect(formatBarController.formatQuickBar).not.toBeVisible();
});

test('should format quick bar show after convert to code block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  const formatBarController = getFormatBar(page);
  await dragBetweenIndices(page, [2, 3], [0, 0]);
  await expect(formatBarController.formatQuickBar).toBeVisible();
  await formatBarController.assertBoundingBox(20, 92);

  await formatBarController.openParagraphMenu();
  await formatBarController.codeBlockBtn.click();
  await expect(formatBarController.formatQuickBar).toBeVisible();
  const rects = page.locator('.affine-page-selected-rects-container > *');
  await expect(rects).toHaveCount(1);
  await formatBarController.assertBoundingBox(395, 99);
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
  <affine:code
    prop:language="Plain Text"
    prop:text="123\n456\n789"
  />
</affine:frame>`,
    frameId
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
  const codeBtn = page.locator(`.format-quick-bar [data-testid=code]`);
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
    const frame = page.addBlock('affine:frame', {}, pageId);
    const delta = [
      { insert: '1', attributes: { bold: true, italic: true } },
      { insert: '2', attributes: { bold: true, underline: true } },
      { insert: '3', attributes: { bold: true, code: true } },
    ];
    const text = page.Text.fromDelta(delta);
    page.addBlock('affine:paragraph', { text }, frame);
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
  const { formatQuickBar, boldBtn } = getFormatBar(page);
  await expect(formatQuickBar).toBeVisible();
  await boldBtn.dblclick();
  await expect(formatQuickBar).toBeVisible();
});
