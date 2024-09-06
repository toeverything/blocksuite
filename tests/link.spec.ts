import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';

import {
  cutByKeyboard,
  dragBetweenIndices,
  enterPlaygroundRoom,
  focusRichText,
  focusRichTextEnd,
  getPageSnapshot,
  initEmptyParagraphState,
  pasteByKeyboard,
  pressEnter,
  pressShiftEnter,
  pressTab,
  selectAllByKeyboard,
  setSelection,
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

test('basic link', async ({ page }, testInfo) => {
  const linkText = 'linkText';
  const link = 'http://example.com';
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, linkText);

  // Create link
  await dragBetweenIndices(page, [0, 0], [0, 8]);
  await pressCreateLinkShortCut(page);
  await page.mouse.move(0, 0);

  const createLinkPopoverLocator = page.locator('.affine-link-popover.create');
  await expect(createLinkPopoverLocator).toBeVisible();
  const linkPopoverInput = page.locator('.affine-link-popover-input');
  await expect(linkPopoverInput).toBeVisible();
  await type(page, link);
  await pressEnter(page);
  await expect(createLinkPopoverLocator).not.toBeVisible();

  const linkLocator = page.locator('affine-link a');
  await expect(linkLocator).toHaveAttribute('href', link);

  // clear text selection
  await page.keyboard.press('ArrowLeft');

  const viewLinkPopoverLocator = page.locator('.affine-link-popover.view');
  // Hover link
  await expect(viewLinkPopoverLocator).not.toBeVisible();
  await linkLocator.hover();
  // wait for popover delay open
  await page.waitForTimeout(200);
  await expect(viewLinkPopoverLocator).toBeVisible();

  // Edit link
  const text2 = 'link2';
  const link2 = 'https://github.com';
  const editLinkBtn = viewLinkPopoverLocator.getByTestId('edit');
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
  expect(await getPageSnapshot(page, true)).toMatchSnapshot(
    `${testInfo.title}.json`
  );
});

test('add link when dragging from empty line', async ({ page }) => {
  const linkText = 'linkText\n\n';
  const link = 'http://example.com';
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, linkText);

  // Create link
  await dragBetweenIndices(page, [2, 0], [0, 0], {
    x: 1,
    y: 2,
  });
  await pressCreateLinkShortCut(page);
  await page.mouse.move(0, 0);

  const createLinkPopoverLocator = page.locator('.affine-link-popover.create');
  await expect(createLinkPopoverLocator).toBeVisible();
  const linkPopoverInput = page.locator('.affine-link-popover-input');
  await expect(linkPopoverInput).toBeVisible();
  await type(page, link);
  await pressEnter(page);
  await expect(createLinkPopoverLocator).not.toBeVisible();

  const linkLocator = page.locator('affine-link a');
  await expect(linkLocator).toHaveAttribute('href', link);
});

async function createLinkBlock(page: Page, str: string, link: string) {
  const id = await page.evaluate(
    ([str, link]) => {
      const { doc } = window;
      const rootId = doc.addBlock('affine:page', {
        title: new doc.Text('title'),
      });
      const noteId = doc.addBlock('affine:note', {}, rootId);

      const text = doc.Text.fromDelta([
        { insert: 'Hello' },
        { insert: str, attributes: { link } },
      ]);
      const id = doc.addBlock(
        'affine:paragraph',
        { type: 'text', text: text },
        noteId
      );
      return id;
    },
    [str, link]
  );
  return id;
}

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

test('type character after link should not extend the link attributes', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const id = await createLinkBlock(page, 'link text', 'http://example.com');
  await focusRichText(page, 0);
  await type(page, 'AFTER_LINK');
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
        insert="link text"
        link="http://example.com"
      />
      <text
        insert="AFTER_LINK"
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

  await page.mouse.move(0, 0);
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

  const mockSelectNode = page.locator('.mock-selection');
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
  await pressCreateLinkShortCut(page);
  const linkPopoverInput = page.locator('.affine-link-popover-input');
  await assertKeyboardWorkInInput(page, linkPopoverInput);
  await page.mouse.click(500, 500);

  const linkLocator = page.locator(`text="${linkText}"`);
  const linkPopover = page.locator('.affine-link-popover');
  await linkLocator.hover();
  await waitNextFrame(page, 200);
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

  const editTextInput = editLinkPopover.locator(
    '.affine-edit-area.text .affine-edit-input'
  );
  await assertKeyboardWorkInInput(page, editTextInput);
  const editLinkInput = editLinkPopover.locator(
    '.affine-edit-area.link .affine-edit-input'
  );
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

  await focusRichText(page); // click to cancel the link popover
  await focusRichTextEnd(page);
  await pressShiftEnter(page);
  await waitNextFrame(page);
  await type(page, 'bbb');
  await dragBetweenIndices(page, [0, 1], [0, 5]);
  await pressCreateLinkShortCut(page);
  await expect(linkPopoverLocator).toBeVisible();

  await focusRichTextEnd(page);
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

  await dragBetweenIndices(page, [0, 0], [0, 3]);
  await pressCreateLinkShortCut(page);

  const createLinkPopoverLocator = page.locator('.affine-link-popover.create');
  const confirmBtn = createLinkPopoverLocator.locator('.affine-confirm-button');

  await expect(createLinkPopoverLocator).toBeVisible();
  await expect(confirmBtn).toHaveAttribute('disabled');

  await type(page, 'affine.pro');
  await expect(confirmBtn).not.toHaveAttribute('disabled');
  await selectAllByKeyboard(page);
  await cutByKeyboard(page);

  // press enter should not trigger confirm
  await pressEnter(page);
  await expect(createLinkPopoverLocator).toBeVisible();
  await expect(confirmBtn).toHaveAttribute('disabled');

  await pasteByKeyboard(page, false);
  await expect(confirmBtn).not.toHaveAttribute('disabled');
  await pressEnter(page);
  await expect(createLinkPopoverLocator).not.toBeVisible();
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

test('convert link to card', async ({ page }, testInfo) => {
  const linkText = 'alinkTexta';
  const link = 'http://example.com';
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'aaa');
  await pressEnter(page);
  await type(page, linkText);

  // Create link
  await setSelection(page, 3, 1, 3, 9);
  await pressCreateLinkShortCut(page);
  await waitNextFrame(page);
  const linkPopoverLocator = page.locator('.affine-link-popover');
  await expect(linkPopoverLocator).toBeVisible();
  const linkPopoverInput = page.locator('.affine-link-popover-input');
  await expect(linkPopoverInput).toBeVisible();
  await type(page, link);
  await pressEnter(page);
  await expect(linkPopoverLocator).not.toBeVisible();
  await focusRichText(page, 1);

  expect(await getPageSnapshot(page, true)).toMatchSnapshot(
    `${testInfo.title}.json`
  );

  const linkLocator = page.locator('affine-link a');

  await linkLocator.hover();
  await waitNextFrame(page);
  await expect(linkPopoverLocator).toBeVisible();

  await page.getByRole('button', { name: 'Switch view' }).click();
  const linkToCardBtn = page.getByTestId('link-to-card');
  const linkToEmbedBtn = page.getByTestId('link-to-embed');
  await expect(linkToCardBtn).toBeVisible();
  await expect(linkToEmbedBtn).not.toBeVisible();

  await page.mouse.move(0, 0);
  await waitNextFrame(page);
  await expect(linkPopoverLocator).not.toBeVisible();
  await focusRichText(page, 1);
  await pressTab(page);

  await linkLocator.hover();
  await waitNextFrame(page);
  await expect(linkPopoverLocator).toBeVisible();
  await page.getByRole('button', { name: 'Switch view' }).click();
  await expect(linkToCardBtn).toBeVisible();
  await expect(linkToEmbedBtn).not.toBeVisible();
});

//TODO: wait for embed block completed
test.skip('convert link to embed', async ({ page }) => {
  const linkText = 'alinkTexta';
  const link = 'https://www.youtube.com/watch?v=U6s2pdxebSo';
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'aaa');
  await pressEnter(page);
  await type(page, linkText);

  // Create link
  await setSelection(page, 3, 1, 3, 9);
  await pressCreateLinkShortCut(page);
  await waitNextFrame(page);
  const linkPopoverLocator = page.locator('.affine-link-popover');
  await expect(linkPopoverLocator).toBeVisible();
  const linkPopoverInput = page.locator('.affine-link-popover-input');
  await expect(linkPopoverInput).toBeVisible();
  await type(page, link);
  await pressEnter(page);
  await expect(linkPopoverLocator).not.toBeVisible();
  await focusRichText(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:page>
  <affine:note
    prop:background="--affine-note-background-blue"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 8,
          "borderSize": 4,
          "borderStyle": "none",
          "shadowType": "--affine-note-shadow-box",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:text="aaa"
      prop:type="text"
    />
    <affine:paragraph
      prop:text={
        <>
          <text
            insert="a"
          />
          <text
            insert="linkText"
            link="${link}"
          />
          <text
            insert="a"
          />
        </>
      }
      prop:type="text"
    />
  </affine:note>
</affine:page>`
  );

  const linkToCardBtn = page.getByTestId('link-to-card');
  const linkToEmbedBtn = page.getByTestId('link-to-embed');
  const linkLocator = page.locator('affine-link a');

  await linkLocator.hover();
  await waitNextFrame(page);
  await expect(linkPopoverLocator).toBeVisible();
  await expect(linkToCardBtn).toBeVisible();
  await expect(linkToEmbedBtn).toBeVisible();

  await page.mouse.move(0, 0);
  await waitNextFrame(page);
  await expect(linkPopoverLocator).not.toBeVisible();
  await focusRichText(page, 1);
  await pressTab(page);

  await linkLocator.hover();
  await waitNextFrame(page);
  await expect(linkPopoverLocator).toBeVisible();
  await expect(linkToCardBtn).not.toBeVisible();
  await expect(linkToEmbedBtn).not.toBeVisible();
});
