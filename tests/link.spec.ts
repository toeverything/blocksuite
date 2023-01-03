/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, Page, test } from '@playwright/test';
import {
  dragBetweenIndices,
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
  pressEnter,
  switchReadonly,
  withCtrlOrMeta,
} from './utils/actions/index.js';
import { assertStoreMatchJSX } from './utils/asserts.js';

const pressCreateLinkShortCut = async (page: Page) => {
  await withCtrlOrMeta(page, async () => {
    await page.keyboard.press('k');
    await page.keyboard.up('k');
  });
};

test('basic link', async ({ page }) => {
  const linkText = 'linkText';
  const link = 'http://example.com';
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type(linkText);

  // Create link
  await dragBetweenIndices(page, [0, 0], [0, 8]);
  await pressCreateLinkShortCut(page);

  const linkPopoverLocator = page.locator('.affine-link-popover');
  await expect(linkPopoverLocator).toBeVisible();
  const linkPopoverInput = page.locator('.affine-link-popover-input');
  await expect(linkPopoverInput).toBeVisible();
  await page.keyboard.type(link);
  await pressEnter(page);
  await expect(linkPopoverLocator).not.toBeVisible();

  const linkLocator = page.locator(`text="${linkText}"`);
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
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await pressEnter(page);

  const editLinkPopoverLocator = page.locator('.affine-link-edit-popover');
  await expect(editLinkPopoverLocator).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.type(text2);
  await page.keyboard.press('Tab');
  await page.keyboard.type(link2);
  await page.keyboard.press('Tab');
  await pressEnter(page);
  const link2Locator = page.locator(`text="${text2}"`);

  await expect(link2Locator).toHaveAttribute('href', link2);
  await assertStoreMatchJSX(
    page,
    `
<affine:page>
  <affine:frame
    prop:xywh="[0,0,720,32]"
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
      const pageId = page.addBlock({
        flavour: 'affine:page',
        title: 'title',
      });
      const frameId = page.addBlock({ flavour: 'affine:frame' }, pageId);

      const text = page.Text.fromDelta(page, [
        { insert: 'Hello' },
        { insert: str, attributes: { link } },
      ]);
      const id = page.addBlock(
        { flavour: 'affine:paragraph', type: 'text', text: text },
        frameId
      );
      return id;
    },
    [str, link]
  );
  return id;
}

test('text added after a link should not have link formatting', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const id = await createLinkBlock(page, 'link text', 'http://example.com');
  await focusRichText(page, 0);
  await page.keyboard.type('after link');
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
        insert="a"
        link={false}
      />
      <text
        insert="fter link"
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
  await page.keyboard.type('IN_LINK');
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

test('readonly mode should not trigger link hover', async ({ page }) => {
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

  // XXX Wait for readonly delay
  await page.waitForTimeout(300);

  await linkLocator.hover();
  await expect(linkPopoverLocator).not.toBeVisible();
});
