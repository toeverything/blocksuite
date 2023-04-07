import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { addNewPage, switchToPage } from 'utils/actions/click.js';
import { pressBackspace, pressEnter, type } from 'utils/actions/keyboard.js';
import {
  enterPlaygroundRoom,
  focusRichText,
  focusTitle,
  initEmptyParagraphState,
} from 'utils/actions/misc.js';
import {
  assertRichTexts,
  assertStoreMatchJSX,
  assertTitle,
} from 'utils/asserts.js';

import { test } from './utils/playwright.js';

function getLinkedPagePopover(page: Page) {
  const REFERENCE_NODE = ' ';
  const refNode = page.locator('affine-reference');
  const linkedPagePopover = page.locator('.linked-page-popover');

  const findRefNode = async (title: string) => {
    const referenceNode = page.locator(`affine-reference`, {
      has: page.locator(`.affine-reference-title[data-title="${title}"]`),
    });
    await expect(referenceNode).toBeVisible();
    return referenceNode;
  };
  const assertExistRefText = async (text: string) => {
    await expect(refNode).toBeVisible();
    const refTitleNode = refNode.locator('.affine-reference-title');
    // Since the text is in the pseudo element
    // we need to use `toHaveAttribute` to assert it.
    // And it's not a good strict way to assert the text.
    await expect(refTitleNode).toHaveAttribute('data-title', text);
  };

  const createPage = async (
    pageType: 'LinkedPage' | 'Subpage',
    pageName?: string
  ) => {
    await type(page, '@');
    await expect(linkedPagePopover).toBeVisible();
    if (pageName) {
      await type(page, pageName);
    } else {
      pageName = 'Untitled';
    }

    await page.keyboard.press('ArrowUp');
    if (pageType === 'LinkedPage') {
      await page.keyboard.press('ArrowUp');
    }
    await pressEnter(page);

    const referenceNode = await findRefNode(pageName);
    return referenceNode;
  };

  return {
    REFERENCE_NODE,
    linkedPagePopover,
    referenceNode: refNode,

    findRefNode,
    assertExistRefText,
    createLinkedPage: async (pageName?: string) =>
      createPage('LinkedPage', pageName),
    createSubpage: async (pageName?: string) => createPage('Subpage', pageName),
  };
}

test.describe('multiple page works', () => {
  test('should create and switch page work', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusTitle(page);
    await type(page, 'title0');
    await focusRichText(page);
    await type(page, 'page0');
    await assertRichTexts(page, ['page0']);

    const page1Snapshot = `
<affine:page
  prop:title="title0"
>
  <affine:frame>
    <affine:paragraph
      prop:text="page0"
      prop:type="text"
    />
  </affine:frame>
</affine:page>`;
    await assertStoreMatchJSX(page, page1Snapshot);

    const { id } = await addNewPage(page);
    await switchToPage(page, id);
    await focusTitle(page);
    await type(page, 'title1');
    await pressEnter(page);
    await type(page, 'page1');
    await assertRichTexts(page, ['page1']);

    await assertStoreMatchJSX(
      page,
      `
<affine:page
  prop:title="Untitledtitle1"
>
  <affine:frame>
    <affine:paragraph
      prop:text="page1"
      prop:type="text"
    />
  </affine:frame>
</affine:page>`
    );

    await switchToPage(page);
    await assertStoreMatchJSX(page, page1Snapshot);
  });
});

test.describe('reference node works', () => {
  test('linked page popover can show and hide correctly', async ({ page }) => {
    await enterPlaygroundRoom(page);
    const { paragraphId } = await initEmptyParagraphState(page);
    await focusRichText(page);
    await type(page, '[[');

    // `[[` should be converted to `@`
    await assertStoreMatchJSX(
      page,
      `
<affine:paragraph
  prop:text="@"
  prop:type="text"
/>`,
      paragraphId
    );
    const { linkedPagePopover } = getLinkedPagePopover(page);
    await expect(linkedPagePopover).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(linkedPagePopover).toBeHidden();
    await type(page, '@');
    await expect(linkedPagePopover).toBeVisible();
    await assertRichTexts(page, ['@@']);
    await pressBackspace(page);
    await expect(linkedPagePopover).toBeHidden();
  });

  test('should reference node attributes correctly', async ({ page }) => {
    await enterPlaygroundRoom(page);
    const { paragraphId } = await initEmptyParagraphState(page);
    await focusRichText(page);
    await type(page, '[[');
    await pressEnter(page);

    await assertStoreMatchJSX(
      page,
      `
<affine:paragraph
  prop:text={
    <>
      <text
        insert=" "
        reference={
          Object {
            "pageId": "page0",
            "type": "LinkedPage",
          }
        }
      />
    </>
  }
  prop:type="text"
/>`,
      paragraphId
    );

    await pressBackspace(page);
    await assertStoreMatchJSX(
      page,
      `
<affine:paragraph
  prop:type="text"
/>`,
      paragraphId
    );
  });

  test('should the cursor move correctly around reference node', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    const { paragraphId } = await initEmptyParagraphState(page);
    await focusRichText(page);

    await type(page, '1');
    await type(page, '[[');
    await pressEnter(page);

    await assertRichTexts(page, ['1 ']);
    await type(page, '2');
    await assertRichTexts(page, ['1 2']);
    await page.keyboard.press('ArrowLeft');
    await type(page, '3');
    await assertRichTexts(page, ['1 32']);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    await type(page, '4');
    await assertRichTexts(page, ['14 32']);
    await assertStoreMatchJSX(
      page,
      `
<affine:paragraph
  prop:text={
    <>
      <text
        insert="14"
      />
      <text
        insert=" "
        reference={
          Object {
            "pageId": "page0",
            "type": "LinkedPage",
          }
        }
      />
      <text
        insert="32"
      />
    </>
  }
  prop:type="text"
/>`,
      paragraphId
    );

    await page.keyboard.press('ArrowRight');
    await pressBackspace(page);
    await assertStoreMatchJSX(
      page,
      `
<affine:paragraph
  prop:text="1432"
  prop:type="text"
/>`,
      paragraphId
    );
  });

  test('should create reference node works', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusTitle(page);
    await type(page, 'title');

    await focusRichText(page);
    await type(page, '@');
    const {
      linkedPagePopover,
      referenceNode,
      assertExistRefText: assertReferenceText,
    } = getLinkedPagePopover(page);
    await expect(linkedPagePopover).toBeVisible();
    await pressEnter(page);
    await expect(linkedPagePopover).toBeHidden();
    await assertRichTexts(page, [' ']);
    await expect(referenceNode).toBeVisible();
    await expect(referenceNode).toHaveCount(1);
    await assertReferenceText('title');
    await focusTitle(page);
    await pressBackspace(page);
    await type(page, '1');
    await assertReferenceText('titl1');
  });

  test('can create linked page', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusTitle(page);
    await type(page, 'page0');

    await focusRichText(page);
    const { createSubpage, findRefNode } = getLinkedPagePopover(page);
    const linkedNode = await createSubpage('page1');
    await linkedNode.click();

    await assertTitle(page, 'page1');
    await assertStoreMatchJSX(
      page,
      `
<affine:page
  prop:title="page1"
>
  <affine:frame>
    <affine:paragraph
      prop:type="text"
    />
  </affine:frame>
</affine:page>`
    );
    await focusRichText(page);
    await type(page, '@page0');
    await pressEnter(page);
    const refNode = await findRefNode('page0');
    await refNode.click();
    await assertTitle(page, 'page0');
    await assertStoreMatchJSX(
      page,
      `
<affine:page
  prop:title="page0"
>
  <affine:frame>
    <affine:paragraph
      prop:text={
        <>
          <text
            insert=" "
            reference={
              Object {
                "pageId": "3",
                "type": "Subpage",
              }
            }
          />
        </>
      }
      prop:type="text"
    />
  </affine:frame>
</affine:page>`
    );
  });
});
