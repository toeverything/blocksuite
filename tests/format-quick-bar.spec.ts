import { expect, Page, test } from '@playwright/test';
import {
  clickBlockTypeMenuButton,
  dragBetweenIndices,
  enterPlaygroundRoom,
  initEmptyParagraphState,
  initThreeParagraphs,
  pressEnter,
  switchReadonly,
} from './utils/actions/index.js';
import {
  assertClipItems,
  assertLocatorVisible,
  assertSelection,
  assertStoreMatchJSX,
} from './utils/asserts.js';

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
  // Click the edge of the format quick bar
  await page.mouse.click(box.x + 4, box.y + box.height / 2);
  // Even not any button is clicked, the format quick bar should't be hidden
  await expect(formatQuickBar).toBeVisible();

  await page.mouse.click(0, 0);
  await expect(formatQuickBar).not.toBeVisible();
});

test('should format quick bar hide when type text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await dragBetweenIndices(page, [0, 0], [2, 3]);
  const formatQuickBar = page.locator(`.format-quick-bar`);
  await expect(formatQuickBar).toBeVisible();
  await page.keyboard.type('1');
  await expect(formatQuickBar).not.toBeVisible();
});

test('should format quick bar be able to format text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { groupId } = await initEmptyParagraphState(page);
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
    `<affine:group
  prop:xywh="[0,0,720,112]"
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
</affine:group>`,
    groupId
  );
  await boldBtn.click();
  await underlineBtn.click();
  await codeBtn.click();

  // The bold button should be inactive after click again
  await expect(boldBtn).not.toHaveAttribute('active', '');
  await expect(italicBtn).toHaveAttribute('active', '');
  await expect(underlineBtn).not.toHaveAttribute('active', '');
  await expect(strikeBtn).toHaveAttribute('active', '');
  await expect(codeBtn).not.toHaveAttribute('active', '');

  await assertStoreMatchJSX(
    page,
    `<affine:group
  prop:xywh="[0,0,720,112]"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={false}
          code={false}
          insert="456"
          italic={true}
          strike={true}
          underline={false}
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:group>`,
    groupId
  );
});

test('should format quick bar be able to format text when select multiple line', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const { groupId } = await initEmptyParagraphState(page);
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
<affine:group
  prop:xywh="[0,0,720,112]"
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
</affine:group>`,
    groupId
  );

  await boldBtn.click();
  await expect(boldBtn).not.toHaveAttribute('active', '');
  await assertStoreMatchJSX(
    page,
    `
<affine:group
  prop:xywh="[0,0,720,112]"
>
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={false}
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
          bold={false}
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
          bold={false}
          insert="789"
        />
      </>
    }
    prop:type="text"
  />
</affine:group>`,
    groupId
  );
});

test('should format quick bar be able to link text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { groupId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  // drag only the `456` paragraph
  await dragBetweenIndices(page, [1, 0], [1, 3]);

  const linkBtn = page.locator(`.format-quick-bar [data-testid=link]`);
  await expect(linkBtn).not.toHaveAttribute('active', '');
  await linkBtn.click();

  const linkPopoverInput = page.locator('.affine-link-popover-input');
  await expect(linkPopoverInput).toBeVisible();

  await page.keyboard.type('https://www.example.com');
  await pressEnter(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:group
  prop:xywh="[0,0,720,112]"
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
</affine:group>`,
    groupId
  );

  await dragBetweenIndices(page, [1, 0], [1, 3]);
  // The link button should be active after click
  await expect(linkBtn).toHaveAttribute('active', '');
  await linkBtn.click();
  await expect(linkBtn).not.toHaveAttribute('active', '');
  await assertStoreMatchJSX(
    page,
    `
<affine:group
  prop:xywh="[0,0,720,112]"
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
          link={false}
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:group>`,
    groupId
  );
});

test('should format quick bar be able to change to heading paragraph type', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const { groupId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  // drag only the `456` paragraph
  await dragBetweenIndices(page, [1, 0], [1, 3]);

  const paragraphBtn = page.locator(`.paragraph-button`);
  await paragraphBtn.hover();
  const h1Btn = page.locator(`.format-quick-bar [data-testid=h1]`);
  await expect(h1Btn).toBeVisible();
  await h1Btn.click();

  await assertStoreMatchJSX(
    page,
    `
<affine:group
  prop:xywh="[0,0,720,112]"
>
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
</affine:group>`,
    groupId
  );
  const bulletedBtn = page.locator(`.format-quick-bar [data-testid=bulleted]`);
  await bulletedBtn.click();
  await assertStoreMatchJSX(
    page,
    `
<affine:group
  prop:xywh="[0,0,720,112]"
>
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
</affine:group>`,
    groupId
  );

  const textBtn = page.locator(`[data-testid=text]`);
  await textBtn.click();

  await assertStoreMatchJSX(
    page,
    `
<affine:group
  prop:xywh="[0,0,720,112]"
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
</affine:group>`,
    groupId
  );
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

  await assertClipItems(page, 'text/plain', '456');

  await assertSelection(page, 1, 0, 3);
});

test('should format quick bar show when double click text', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await page.dblclick('.affine-rich-text p', { position: { x: 10, y: 10 } });
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

  await page.dblclick('.affine-rich-text p', { position: { x: 10, y: 10 } });
  await expect(formatQuickBar).not.toBeVisible();
});

async function scrollToTop(page: Page) {
  // await page.mouse.wheel(0, -1000);
  await page
    .locator('.affine-default-viewport')
    .evaluate(node =>
      node.scrollTo({ left: 0, top: -1000, behavior: 'smooth' })
    );
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
  page.keyboard.type('bottom');

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
  await clickBlockTypeMenuButton(page, 'Bulleted List');
  await scrollToBottom(page);
  await assertLocatorVisible(page, formatQuickBar, false);
});
