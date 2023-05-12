/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import {
  cutByKeyboard,
  dragBetweenIndices,
  enterPlaygroundRoom,
  focusRichText,
  focusRichTextEnd,
  initEmptyParagraphState,
  pasteByKeyboard,
  pressEnter,
  pressShiftEnter,
  selectAllByKeyboard,
  SHORT_KEY,
  switchReadonly,
  type,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertKeyboardWorkInInput,
  assertStoreMatchJSX,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

const pressCreateLinkShortCut = async (page: Page) => {
  await page.keyboard.press(`${SHORT_KEY}+k`);
};

test('basic link', async ({ page }) => {
  const linkText = 'linkText';
  const link = 'http://example.com';
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, linkText);

  // Create link
  await dragBetweenIndices(page, [0, 0], [0, 8]);
  await pressCreateLinkShortCut(page);

  const linkPopoverLocator = page.locator('.affine-link-popover');
  await expect(linkPopoverLocator).toBeVisible();
  const linkPopoverInput = page.locator('.affine-link-popover-input');
  await expect(linkPopoverInput).toBeVisible();
  await type(page, link);
  await pressEnter(page);
  await expect(linkPopoverLocator).not.toBeVisible();

  const linkLocator = page.locator('affine-link a');
  await expect(linkLocator).toHaveAttribute('href', link);

  // Hover link
  await expect(linkPopoverLocator).not.toBeVisible();
  await linkLocator.hover();
  // wait for popover delay open
  await page.waitForTimeout(200);
  await expect(linkPopoverLocator).toBeVisible();

  // Edit link
  const text2 = 'link2';
  const link2 = 'https://github.com';
  const editLinkBtn = linkPopoverLocator.getByTestId('edit');
  await editLinkBtn.click();

  const editLinkPopoverLocator = page.locator('.affine-link-edit-popover');
  await expect(editLinkPopoverLocator).toBeVisible();
  // workaround to make tab key work as expected
  await editLinkPopoverLocator.click({
    position: { x: 5, y: 5 },
  });
  await page.keyboard.press('Tab');
  await type(page, text2);
  await page.keyboard.press('Tab');
  await type(page, link2);
  await page.keyboard.press('Tab');
  await pressEnter(page);
  const link2Locator = page.locator('affine-link a');

  await expect(link2Locator).toHaveAttribute('href', link2);
  await assertStoreMatchJSX(
    page,
    `
<affine:page>
  <affine:frame
    prop:background="--affine-background-secondary-color"
    prop:zIndex={0}
  >
    <affine:paragraph
      prop:text={
        <>
          <text
            insert="link2"
            link="https://github.com"
          />
        </>
      }
      prop:type="text"
    />
  </affine:frame>
</affine:page>`
  );
});

async function createLinkBlock(page: Page, str: string, link: string) {
  const id = await page.evaluate(
    ([str, link]) => {
      const { page } = window;
      const pageId = page.addBlock('affine:page', {
        title: new page.Text('title'),
      });
      const frameId = page.addBlock('affine:frame', {}, pageId);

      const text = page.Text.fromDelta([
        { insert: 'Hello' },
        { insert: str, attributes: { link } },
      ]);
      const id = page.addBlock(
        'affine:paragraph',
        { type: 'text', text: text },
        frameId
      );
      return id;
    },
    [str, link]
  );
  return id;
}

test('text added after a link which has custom edited should not have link formatting', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const id = await createLinkBlock(page, 'link text', 'http://example.com');
  await focusRichText(page, 0);
  await type(page, 'after link');
  await assertStoreMatchJSX(
    page,
    // XXX This snapshot is not exactly correct, but it's close enough for now.
    // The first text after the link should not have the link formatting.
    `
<affine:paragraph
  prop:text={
    <>
      <text
        insert="Hello"
      />
      <text
        insert="link text"
        link="http://example.com"
      />
      <text
        insert="after link"
      />
    </>
  }
  prop:type="text"
/>`,
    id
  );
});

test('type character in link should not jump out link node', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const id = await createLinkBlock(page, 'link text', 'http://example.com');
  await focusRichText(page, 0);
  await page.keyboard.press('ArrowLeft');
  await type(page, 'IN_LINK');
  await assertStoreMatchJSX(
    page,
    `
<affine:paragraph
  prop:text={
    <>
      <text
        insert="Hello"
      />
      <text
        insert="link texIN_LINKt"
        link="http://example.com"
      />
    </>
  }
  prop:type="text"
/>`,
    id
  );
});

test('readonly mode should not trigger link popup', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const linkText = 'linkText';
  await createLinkBlock(page, 'linkText', 'http://example.com');
  await focusRichText(page, 0);
  const linkLocator = page.locator(`text="${linkText}"`);

  // Hover link
  const linkPopoverLocator = page.locator('.affine-link-popover');
  await linkLocator.hover();
  await expect(linkPopoverLocator).toBeVisible();
  await switchReadonly(page);

  page.mouse.move(0, 0);
  // XXX Wait for readonly delay
  await page.waitForTimeout(300);

  await linkLocator.hover();
  await expect(linkPopoverLocator).not.toBeVisible();

  // ---
  // press hotkey should not trigger create link popup

  await dragBetweenIndices(page, [0, 0], [0, 3]);
  await pressCreateLinkShortCut(page);

  await expect(linkPopoverLocator).not.toBeVisible();
  const linkPopoverInput = page.locator('.affine-link-popover-input');
  await expect(linkPopoverInput).not.toBeVisible();
});

test('should mock selection not stored', async ({ page }) => {
  const linkText = 'linkText';
  const link = 'http://example.com';
  await enterPlaygroundRoom(page);
  const { paragraphId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, linkText);

  // Create link
  await dragBetweenIndices(page, [0, 0], [0, 8]);
  await pressCreateLinkShortCut(page);

  const mockSelectNode = page.locator('link-mock-selection > div');
  await expect(mockSelectNode).toHaveCount(1);
  await expect(mockSelectNode).toBeVisible();

  // the mock select node should not be stored in the Y doc
  await assertStoreMatchJSX(
    page,
    `
<affine:paragraph
  prop:text="linkText"
  prop:type="text"
/>`,
    paragraphId
  );

  await type(page, link);
  await pressEnter(page);

  // the mock select node should be removed after link created
  await expect(mockSelectNode).not.toBeVisible();
  await expect(mockSelectNode).toHaveCount(0);
});

test('should keyboard work in link popover', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const linkText = 'linkText';
  await createLinkBlock(page, linkText, 'http://example.com');

  await dragBetweenIndices(page, [0, 0], [0, 8]);
  await page.mouse.move(0, 0);
  await pressCreateLinkShortCut(page);
  const linkPopoverInput = page.locator('.affine-link-popover-input');
  await assertKeyboardWorkInInput(page, linkPopoverInput);
  await page.mouse.click(1, 1);

  // ---

  const linkLocator = page.locator(`text="${linkText}"`);
  const linkPopover = page.locator('.affine-link-popover');
  await expect(linkLocator).toBeVisible();
  // Hover link
  await linkLocator.hover();
  // wait for popover delay open
  await page.waitForTimeout(200);
  await expect(linkPopover).toBeVisible();
  const editLinkBtn = linkPopover.getByTestId('edit');
  await editLinkBtn.click();

  const editLinkPopover = page.locator('.affine-link-edit-popover');
  await expect(editLinkPopover).toBeVisible();

  const editTextInput = editLinkPopover.locator('.affine-edit-text-input');
  await assertKeyboardWorkInInput(page, editTextInput);
  const editLinkInput = editLinkPopover.locator('.affine-edit-link-input');
  await assertKeyboardWorkInInput(page, editLinkInput);
});

test('link bar should not be appear when the range is collapsed', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'aaa');

  await pressCreateLinkShortCut(page);
  const linkPopoverLocator = page.locator('.affine-link-popover');
  await expect(linkPopoverLocator).not.toBeVisible();

  await dragBetweenIndices(page, [0, 0], [0, 3]);
  await pressCreateLinkShortCut(page);
  await expect(linkPopoverLocator).toBeVisible();

  await focusRichTextEnd(page);
  await pressShiftEnter(page);
  await waitNextFrame(page);
  await type(page, 'bbb');
  await dragBetweenIndices(page, [0, 1], [0, 5]);
  await pressCreateLinkShortCut(page);
  await expect(linkPopoverLocator).toBeVisible();

  await focusRichTextEnd(page, 0);
  await pressEnter(page);
  // create auto line-break in span element
  await type(page, 'd'.repeat(67));
  await page.mouse.click(1, 1);
  await waitNextFrame(page);
  await dragBetweenIndices(page, [1, 1], [1, 66]);
  await pressCreateLinkShortCut(page);
  await expect(linkPopoverLocator).toBeVisible();
});

test('create link with paste', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { paragraphId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'aaa');

  const linkPopoverLocator = page.locator('.affine-link-popover');
  const confirmBtn = linkPopoverLocator.locator('icon-button');

  await dragBetweenIndices(page, [0, 0], [0, 3]);
  await pressCreateLinkShortCut(page);
  await expect(linkPopoverLocator).toBeVisible();
  await expect(confirmBtn).toHaveAttribute('disabled', '');

  await type(page, 'affine.pro');
  await expect(confirmBtn).not.toHaveAttribute('disabled', '');
  await selectAllByKeyboard(page);
  await cutByKeyboard(page);

  // press enter should not trigger confirm
  await pressEnter(page);
  await expect(linkPopoverLocator).toBeVisible();
  await expect(confirmBtn).toHaveAttribute('disabled', '');

  await pasteByKeyboard(page, false);
  await expect(confirmBtn).not.toHaveAttribute('disabled', '');
  await pressEnter(page);
  await expect(linkPopoverLocator).not.toBeVisible();
  await assertStoreMatchJSX(
    page,
    `
<affine:paragraph
  prop:text={
    <>
      <text
        insert="aaa"
        link="http://affine.pro"
      />
    </>
  }
  prop:type="text"
/>`,
    paragraphId
  );
});
