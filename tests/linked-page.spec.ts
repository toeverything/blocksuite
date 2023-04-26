import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { addNewPage, switchToPage } from 'utils/actions/click.js';
import {
  copyByKeyboard,
  pasteByKeyboard,
  pressBackspace,
  pressEnter,
  redoByKeyboard,
  selectAllByKeyboard,
  type,
  undoByKeyboard,
} from 'utils/actions/keyboard.js';
import {
  captureHistory,
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
  const REFERENCE_NODE = ' ' as const;
  const refNode = page.locator('affine-reference');
  const linkedPagePopover = page.locator('.linked-page-popover');
  const pageBtn = linkedPagePopover.locator('.group > icon-button');

  const findRefNode = async (title: string) => {
    const refNode = page.locator(`affine-reference`, {
      has: page.locator(`.affine-reference-title[data-title="${title}"]`),
    });
    await expect(refNode).toBeVisible();
    return refNode;
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
    return findRefNode(pageName);
  };

  const assertActivePageIdx = async (idx: number) => {
    if (idx !== 0) {
      await expect(pageBtn.nth(0)).not.toHaveAttribute('hover', '');
    }
    await expect(pageBtn.nth(idx)).toHaveAttribute('hover', '');
  };

  return {
    REFERENCE_NODE,
    linkedPagePopover,
    refNode,
    pageBtn,

    findRefNode,
    assertExistRefText,
    createLinkedPage: async (pageName?: string) =>
      createPage('LinkedPage', pageName),
    /**
     * @deprecated
     */
    createSubpage: async (pageName?: string) => createPage('Subpage', pageName),
    assertActivePageIdx,
  };
}

test.describe('multiple page', () => {
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
  <affine:frame
    prop:background="--affine-background-secondary-color"
  >
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
    await focusRichText(page);
    await type(page, 'page1');
    await assertRichTexts(page, ['page1']);

    await assertStoreMatchJSX(
      page,
      `
<affine:page
  prop:title="title1"
>
  <affine:frame
    prop:background="--affine-background-secondary-color"
  >
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

test.describe('reference node', () => {
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

    const snapshot = `
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
/>`;
    await assertStoreMatchJSX(page, snapshot, paragraphId);

    await page.keyboard.press('ArrowRight');
    await captureHistory(page);
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
    await undoByKeyboard(page);
    await assertStoreMatchJSX(page, snapshot, paragraphId);
    await redoByKeyboard(page);
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
      refNode,
      assertExistRefText: assertReferenceText,
    } = getLinkedPagePopover(page);
    await expect(linkedPagePopover).toBeVisible();
    await pressEnter(page);
    await expect(linkedPagePopover).toBeHidden();
    await assertRichTexts(page, [' ']);
    await expect(refNode).toBeVisible();
    await expect(refNode).toHaveCount(1);
    await assertReferenceText('title');
    await focusTitle(page);
    await pressBackspace(page);
    await type(page, '1');
    await assertReferenceText('titl1');
  });

  test('can create linked page and jump', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusTitle(page);
    await type(page, 'page0');

    await focusRichText(page);
    const { createLinkedPage, findRefNode } = getLinkedPagePopover(page);
    const linkedNode = await createLinkedPage('page1');
    await linkedNode.click();

    await assertTitle(page, 'page1');
    await assertStoreMatchJSX(
      page,
      `
<affine:page
  prop:title="page1"
>
  <affine:frame
    prop:background="--affine-background-secondary-color"
  >
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
  <affine:frame
    prop:background="--affine-background-secondary-color"
  >
    <affine:paragraph
      prop:text={
        <>
          <text
            insert=" "
            reference={
              Object {
                "pageId": "3",
                "type": "LinkedPage",
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

  test('should not merge consecutive identical reference nodes for rendering', async ({
    page,
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/toeverything/blocksuite/issues/2136',
    });
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);
    await type(page, '[[');
    await pressEnter(page);
    await type(page, '[[');
    await pressEnter(page);

    const { refNode } = getLinkedPagePopover(page);
    await assertRichTexts(page, ['  ']);
    await expect(refNode).toHaveCount(2);
  });
});

test.describe('linked page popover', () => {
  test('should show linked page popover show and hide', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);
    const { linkedPagePopover } = getLinkedPagePopover(page);

    await type(page, '[[');
    await expect(linkedPagePopover).toBeVisible();
    await pressBackspace(page);
    await expect(linkedPagePopover).toBeHidden();

    await type(page, '@');
    await expect(linkedPagePopover).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(linkedPagePopover).toBeHidden();

    await type(page, '@');
    await expect(linkedPagePopover).toBeVisible();
    await page.mouse.click(0, 0);
    await expect(linkedPagePopover).toBeHidden();

    await type(page, '@');
    await expect(linkedPagePopover).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(linkedPagePopover).toBeHidden();

    await type(page, '@');
    await expect(linkedPagePopover).toBeVisible();
    await copyByKeyboard(page);
    await expect(linkedPagePopover).toBeHidden();
  });

  test('should fuzzy search works', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    const {
      linkedPagePopover,
      pageBtn,
      assertExistRefText,
      assertActivePageIdx,
    } = getLinkedPagePopover(page);

    await focusTitle(page);
    await type(page, 'page0');

    const page1 = await addNewPage(page);
    await switchToPage(page, page1.id);
    await focusTitle(page);
    await type(page, 'page1');

    const page2 = await addNewPage(page);
    await switchToPage(page, page2.id);
    await focusTitle(page);
    await type(page, 'page2');

    await switchToPage(page);
    await focusRichText(page);
    await type(page, '@');
    await expect(linkedPagePopover).toBeVisible();
    await expect(pageBtn).toHaveCount(3);

    await assertActivePageIdx(0);
    await page.keyboard.press('ArrowDown');
    await assertActivePageIdx(1);

    await page.keyboard.press('ArrowUp');
    await assertActivePageIdx(0);
    await page.keyboard.press('Tab');
    await assertActivePageIdx(1);
    await page.keyboard.press('Shift+Tab');
    await assertActivePageIdx(0);

    await expect(pageBtn).toHaveText(['page0', 'page1', 'page2']);
    // page2
    //  ^  ^
    await type(page, 'a2');
    await expect(pageBtn).toHaveCount(1);
    await expect(pageBtn).toHaveText(['page2']);
    await pressEnter(page);
    await expect(linkedPagePopover).toBeHidden();
    await assertExistRefText('page2');
  });
});

test.describe.skip('linked page with clipboard', () => {
  test('paste subpage should paste as linked page', async ({ page }) => {
    await enterPlaygroundRoom(page);
    const { paragraphId } = await initEmptyParagraphState(page);
    await focusRichText(page);

    const { createLinkedPage, createSubpage } = getLinkedPagePopover(page);

    await createSubpage('page0');
    await createLinkedPage('page1');

    await selectAllByKeyboard(page);
    await copyByKeyboard(page);
    await focusRichText(page);
    await pasteByKeyboard(page);
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
            "pageId": "3",
            "type": "Subpage",
          }
        }
      />
      <text
        insert=" "
        reference={
          Object {
            "pageId": "8",
            "type": "LinkedPage",
          }
        }
      />
      <text
        insert=" "
        reference={
          Object {
            "pageId": "3",
            "type": "LinkedPage",
          }
        }
      />
      <text
        insert=" "
        reference={
          Object {
            "pageId": "8",
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
  });

  test(' duplicated subpage should paste as linked page', async ({ page }) => {
    await enterPlaygroundRoom(page);
    const { frameId } = await initEmptyParagraphState(page);
    await focusRichText(page);

    const { createLinkedPage, createSubpage } = getLinkedPagePopover(page);

    await createLinkedPage('page0');
    await createSubpage('page1');

    await type(page, '/duplicate');
    await pressEnter(page);
    await assertStoreMatchJSX(
      page,
      `
<affine:frame
  prop:background="--affine-background-secondary-color"
>
  <affine:paragraph
    prop:text={
      <>
        <text
          insert=" "
          reference={
            Object {
              "pageId": "3",
              "type": "LinkedPage",
            }
          }
        />
        <text
          insert=" "
          reference={
            Object {
              "pageId": "8",
              "type": "LinkedPage",
            }
          }
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          insert=" "
          reference={
            Object {
              "pageId": "3",
              "type": "LinkedPage",
            }
          }
        />
        <text
          insert=" "
          reference={
            Object {
              "pageId": "8",
              "type": "Subpage",
            }
          }
        />
      </>
    }
    prop:type="text"
  />
</affine:frame>`,
      frameId
    );
  });
});
