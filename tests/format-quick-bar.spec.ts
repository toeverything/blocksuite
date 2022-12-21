import { expect, Page, test } from '@playwright/test';
import {
  dragBetweenIndices,
  enterPlaygroundRoom,
  initEmptyParagraphState,
  initThreeParagraphs,
  pressEnter,
  switchReadonly,
} from './utils/actions/index.js';
import {
  assertLocatorVisible,
  assertSelection,
  assertStoreMatchJSX,
} from './utils/asserts.js';

test('should format quick bar show when select text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await dragBetweenIndices(page, [0, 0], [2, 3]);
  const formatQuickBarLocator = page.locator(`.format-quick-bar`);
  await expect(formatQuickBarLocator).toBeVisible();
  page.mouse.click(0, 0);
  await expect(formatQuickBarLocator).not.toBeVisible();
});

test('should format quick bar hide when type text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await dragBetweenIndices(page, [0, 0], [2, 3]);
  const formatQuickBarLocator = page.locator(`.format-quick-bar`);
  await expect(formatQuickBarLocator).toBeVisible();
  await page.keyboard.type('1');
  await expect(formatQuickBarLocator).not.toBeVisible();
});

test('should format quick bar be able to format text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { groupId } = await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  // drag only the `456` paragraph
  await dragBetweenIndices(page, [1, 0], [1, 3]);

  const formatQuickBarLocator = page.locator(`.format-quick-bar`);
  const boldBtnLocator = formatQuickBarLocator.locator(`[data-testid=bold]`);
  const italicBtnLocator =
    formatQuickBarLocator.locator(`[data-testid=italic]`);
  const underlineBtnLocator = formatQuickBarLocator.locator(
    `[data-testid=underline]`
  );
  const strikeBtnLocator =
    formatQuickBarLocator.locator(`[data-testid=strike]`);
  const codeBtnLocator = formatQuickBarLocator.locator(`[data-testid=code]`);

  await expect(boldBtnLocator).not.toHaveAttribute('active', '');
  await expect(italicBtnLocator).not.toHaveAttribute('active', '');
  await expect(underlineBtnLocator).not.toHaveAttribute('active', '');
  await expect(strikeBtnLocator).not.toHaveAttribute('active', '');
  await expect(codeBtnLocator).not.toHaveAttribute('active', '');

  await boldBtnLocator.click();
  await italicBtnLocator.click();
  await underlineBtnLocator.click();
  await strikeBtnLocator.click();
  await codeBtnLocator.click();

  // The button should be active after click
  await expect(boldBtnLocator).toHaveAttribute('active', '');
  await expect(italicBtnLocator).toHaveAttribute('active', '');
  await expect(underlineBtnLocator).toHaveAttribute('active', '');
  await expect(strikeBtnLocator).toHaveAttribute('active', '');
  await expect(codeBtnLocator).toHaveAttribute('active', '');

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
  await boldBtnLocator.click();
  await underlineBtnLocator.click();
  await codeBtnLocator.click();

  // The bold button should be inactive after click again
  await expect(boldBtnLocator).not.toHaveAttribute('active', '');
  await expect(italicBtnLocator).toHaveAttribute('active', '');
  await expect(underlineBtnLocator).not.toHaveAttribute('active', '');
  await expect(strikeBtnLocator).toHaveAttribute('active', '');
  await expect(codeBtnLocator).not.toHaveAttribute('active', '');

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

  const boldBtnLocator = page.locator(`.format-quick-bar [data-testid=bold]`);
  await expect(boldBtnLocator).not.toHaveAttribute('active', '');
  await boldBtnLocator.click();

  // The bold button should be active after click
  await expect(boldBtnLocator).toHaveAttribute('active', '');
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

  await boldBtnLocator.click();
  await expect(boldBtnLocator).not.toHaveAttribute('active', '');
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

  const linkBtnLocator = page.locator(`.format-quick-bar [data-testid=link]`);
  await expect(linkBtnLocator).not.toHaveAttribute('active', '');
  await linkBtnLocator.click();

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
  await expect(linkBtnLocator).toHaveAttribute('active', '');
  await linkBtnLocator.click();
  await expect(linkBtnLocator).not.toHaveAttribute('active', '');
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

  const paragraphBtnLocator = page.locator(`.paragraph-button`);
  await paragraphBtnLocator.hover();
  const h1BtnLocator = page.locator(`.format-quick-bar [data-testid=h1]`);
  await expect(h1BtnLocator).toBeVisible();
  await h1BtnLocator.click();

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
  const bulletedBtnLocator = page.locator(
    `.format-quick-bar [data-testid=bulleted]`
  );
  await bulletedBtnLocator.click();
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

  // TODO FIXME: The paragraph transform should not lost selection
  // Remove next line after fix
  await dragBetweenIndices(page, [1, 0], [1, 3]);
  await paragraphBtnLocator.hover();
  // End of workaround

  const textBtnLocator = page.locator(`[data-testid=text]`);
  await textBtnLocator.click();
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

  // TODO FIXME: The paragraph button should prevent selection after click
  // await assertSelection(page, 1, 0, 3);
});

test('should format quick bar be able to copy', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  // drag only the `456` paragraph
  await dragBetweenIndices(page, [1, 0], [1, 3]);

  const copyBtnLocator = page.locator(`.format-quick-bar [data-testid=copy]`);
  await expect(copyBtnLocator).toBeVisible();
  await assertSelection(page, 1, 0, 3);
  await copyBtnLocator.click();

  // TODO assert clipboard

  await assertSelection(page, 1, 0, 3);
});

test('should format quick bar show when double click text', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await page.dblclick('.affine-rich-text p', { position: { x: 10, y: 10 } });
  const formatQuickBarLocator = page.locator(`.format-quick-bar`);
  await expect(formatQuickBarLocator).toBeVisible();
});

test('should format quick bar not show at readonly mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await switchReadonly(page);

  await dragBetweenIndices(page, [0, 0], [2, 3]);
  const formatQuickBarLocator = page.locator(`.format-quick-bar`);
  await expect(formatQuickBarLocator).not.toBeVisible();

  await page.dblclick('.affine-rich-text p', { position: { x: 10, y: 10 } });
  await expect(formatQuickBarLocator).not.toBeVisible();
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
    console.warn(
      scrollContainer.scrollHeight - scrollContainer.scrollTop,
      scrollContainer.clientHeight
    );

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

test.only('should format quick bar follow scroll', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Enter');
  }
  page.keyboard.type('bottom');

  await scrollToTop(page);

  await dragBetweenIndices(page, [0, 0], [2, 3]);
  const formatQuickBarLocator = page.locator(`.format-quick-bar`);
  await assertLocatorVisible(page, formatQuickBarLocator);

  await scrollToBottom(page);

  await assertLocatorVisible(page, formatQuickBarLocator, false);

  // should format bar follow scroll after click bold button
  await scrollToTop(page);
  const boldBtnLocator = formatQuickBarLocator.locator(`[data-testid=bold]`);
  await assertLocatorVisible(page, formatQuickBarLocator);
  await boldBtnLocator.click();
  await page.mouse.move(0, 0);
  await scrollToBottom(page);
  await assertLocatorVisible(page, formatQuickBarLocator, false);
});
