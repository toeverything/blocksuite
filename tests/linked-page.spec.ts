import { expect } from '@playwright/test';
import { getLinkedDocPopover } from 'utils/actions/linked-doc.js';

import { addNewPage, switchToPage } from './utils/actions/click.js';
import { dragBetweenIndices } from './utils/actions/drag.js';
import {
  copyByKeyboard,
  pasteByKeyboard,
  pressArrowLeft,
  pressArrowRight,
  pressBackspace,
  pressEnter,
  redoByKeyboard,
  selectAllByKeyboard,
  type,
  undoByKeyboard,
} from './utils/actions/keyboard.js';
import {
  captureHistory,
  enterPlaygroundRoom,
  focusRichText,
  focusTitle,
  initEmptyParagraphState,
  waitNextFrame,
} from './utils/actions/misc.js';
import {
  assertRichTexts,
  assertStoreMatchJSX,
  assertTitle,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

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
  <affine:note
    prop:background="--affine-background-secondary-color"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 8,
          "borderSize": 4,
          "borderStyle": "solid",
          "shadowType": "--affine-note-shadow-box",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:text="page0"
      prop:type="text"
    />
  </affine:note>
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
  <affine:surface />
  <affine:note
    prop:background="--affine-background-secondary-color"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 8,
          "borderSize": 4,
          "borderStyle": "solid",
          "shadowType": "--affine-note-shadow-box",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:text="page1"
      prop:type="text"
    />
  </affine:note>
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
    const { linkedDocPopover } = getLinkedDocPopover(page);
    await expect(linkedDocPopover).toBeVisible();
    await pressArrowRight(page);
    await expect(linkedDocPopover).toBeHidden();
    await type(page, '@');
    await expect(linkedDocPopover).toBeVisible();
    await assertRichTexts(page, ['@@']);
    await pressBackspace(page);
    await expect(linkedDocPopover).toBeHidden();
  });

  test('should reference node attributes correctly', async ({ page }) => {
    await enterPlaygroundRoom(page);
    const { paragraphId } = await initEmptyParagraphState(page);
    const { id } = await addNewPage(page);
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
            "pageId": "${id}",
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

  test('should reference node can be seleted', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await addNewPage(page);
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
    await waitNextFrame(page);
    // select the reference node
    await page.keyboard.press('ArrowLeft');

    // delete the reference node and insert text
    await type(page, '4');
    await assertRichTexts(page, ['1432']);
  });

  test('text inserted in the between of reference nodes should not be extend attributes', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    const { paragraphId } = await initEmptyParagraphState(page);
    const { id } = await addNewPage(page);
    await focusRichText(page);

    await type(page, '1');
    await type(page, '@');
    await pressEnter(page);
    await type(page, '@');
    await pressEnter(page);

    await assertRichTexts(page, ['1  ']);
    await type(page, '2');
    await assertRichTexts(page, ['1  2']);
    await page.keyboard.press('ArrowLeft');
    await waitNextFrame(page);
    await page.keyboard.press('ArrowLeft');
    await waitNextFrame(page);
    await page.keyboard.press('ArrowLeft');
    await type(page, '3');
    await assertRichTexts(page, ['1 3 2']);

    const snapshot = `
<affine:paragraph
  prop:text={
    <>
      <text
        insert="1"
      />
      <text
        insert=" "
        reference={
          Object {
            "pageId": "${id}",
            "type": "LinkedPage",
          }
        }
      />
      <text
        insert="3"
      />
      <text
        insert=" "
        reference={
          Object {
            "pageId": "${id}",
            "type": "LinkedPage",
          }
        }
      />
      <text
        insert="2"
      />
    </>
  }
  prop:type="text"
/>`;
    await assertStoreMatchJSX(page, snapshot, paragraphId);
  });

  test('text can be inserted as expected when reference node is in the start or end of line', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    const { paragraphId } = await initEmptyParagraphState(page);
    const { id } = await addNewPage(page);
    await focusRichText(page);

    await type(page, '@');
    await pressEnter(page);
    await type(page, '@');
    await pressEnter(page);

    await assertRichTexts(page, ['  ']);
    await type(page, '2');
    await assertRichTexts(page, ['  2']);
    await page.keyboard.press('ArrowLeft');
    await waitNextFrame(page);
    await page.keyboard.press('ArrowLeft');
    await waitNextFrame(page);
    await page.keyboard.press('ArrowLeft');
    await type(page, '3');
    await assertRichTexts(page, [' 3 2']);
    await page.keyboard.press('ArrowLeft');
    await waitNextFrame(page);
    await page.keyboard.press('ArrowLeft');
    await waitNextFrame(page);
    await page.keyboard.press('ArrowLeft');
    await type(page, '1');
    await assertRichTexts(page, ['1 3 2']);

    const snapshot = `
<affine:paragraph
  prop:text={
    <>
      <text
        insert="1"
      />
      <text
        insert=" "
        reference={
          Object {
            "pageId": "${id}",
            "type": "LinkedPage",
          }
        }
      />
      <text
        insert="3"
      />
      <text
        insert=" "
        reference={
          Object {
            "pageId": "${id}",
            "type": "LinkedPage",
          }
        }
      />
      <text
        insert="2"
      />
    </>
  }
  prop:type="text"
/>`;
    await assertStoreMatchJSX(page, snapshot, paragraphId);
  });

  test('should the cursor move correctly around reference node', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    const { paragraphId } = await initEmptyParagraphState(page);
    const { id } = await addNewPage(page);
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
    await waitNextFrame(page);
    await page.keyboard.press('ArrowLeft');
    await waitNextFrame(page);
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
            "pageId": "${id}",
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
    const defaultPageId = 'doc:home';
    const { id: newId } = await addNewPage(page);
    await switchToPage(page, newId);
    await focusTitle(page);
    await type(page, 'title');
    await switchToPage(page, defaultPageId);

    await focusRichText(page);
    await type(page, '@');
    const {
      linkedDocPopover,
      refNode,
      assertExistRefText: assertReferenceText,
    } = getLinkedDocPopover(page);
    await expect(linkedDocPopover).toBeVisible();
    await pressEnter(page);
    await expect(linkedDocPopover).toBeHidden();
    await assertRichTexts(page, [' ']);
    await expect(refNode).toBeVisible();
    await expect(refNode).toHaveCount(1);
    await assertReferenceText('title');

    await switchToPage(page, newId);
    await focusTitle(page);
    await pressBackspace(page);
    await type(page, '1');
    await switchToPage(page, defaultPageId);
    await assertReferenceText('titl1');
  });

  test('can create linked page and jump', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusTitle(page);
    await type(page, 'page0');

    await focusRichText(page);
    const { createLinkedDoc, findRefNode } = getLinkedDocPopover(page);
    const linkedNode = await createLinkedDoc('page1');
    await linkedNode.click();

    await assertTitle(page, 'page1');
    await assertStoreMatchJSX(
      page,
      `
<affine:page
  prop:title="page1"
>
  <affine:surface />
  <affine:note
    prop:background="--affine-background-secondary-color"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 8,
          "borderSize": 4,
          "borderStyle": "solid",
          "shadowType": "--affine-note-shadow-box",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:type="text"
    />
  </affine:note>
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
  <affine:note
    prop:background="--affine-background-secondary-color"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 8,
          "borderSize": 4,
          "borderStyle": "solid",
          "shadowType": "--affine-note-shadow-box",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
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
  </affine:note>
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

    const { refNode } = getLinkedDocPopover(page);
    await assertRichTexts(page, ['  ']);
    await expect(refNode).toHaveCount(2);
  });
});

test.describe('linked page popover', () => {
  test('should show linked page popover show and hide', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);
    const { linkedDocPopover } = getLinkedDocPopover(page);

    await type(page, '[[');
    await expect(linkedDocPopover).toBeVisible();
    await pressBackspace(page);
    await expect(linkedDocPopover).toBeHidden();

    await type(page, '@');
    await expect(linkedDocPopover).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(linkedDocPopover).toBeHidden();

    await type(page, '@');
    await expect(linkedDocPopover).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(linkedDocPopover).toBeHidden();

    await type(page, '@');
    await expect(linkedDocPopover).toBeVisible();
    await copyByKeyboard(page);
    await expect(linkedDocPopover).toBeHidden();
  });

  test('should fuzzy search works', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    const {
      linkedDocPopover,
      pageBtn,
      assertExistRefText,
      assertActivePageIdx,
    } = getLinkedDocPopover(page);

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
    await expect(linkedDocPopover).toBeVisible();
    await expect(pageBtn).toHaveCount(4);

    await assertActivePageIdx(0);
    await page.keyboard.press('ArrowDown');
    await assertActivePageIdx(1);

    await page.keyboard.press('ArrowUp');
    await assertActivePageIdx(0);
    await page.keyboard.press('Tab');
    await assertActivePageIdx(1);
    await page.keyboard.press('Shift+Tab');
    await assertActivePageIdx(0);

    await expect(pageBtn).toHaveText([
      'page1',
      'page2',
      'Create "Untitled" doc',
      'Import',
    ]);
    // page2
    //  ^  ^
    await type(page, 'a2');
    await expect(pageBtn).toHaveCount(3);
    await expect(pageBtn).toHaveText(['page2', 'Create "a2" doc', 'Import']);
    await pressEnter(page);
    await expect(linkedDocPopover).toBeHidden();
    await assertExistRefText('page2');
  });
});

test.describe.skip('linked page with clipboard', () => {
  test('paste subpage should paste as linked page', async ({ page }) => {
    await enterPlaygroundRoom(page);
    const { paragraphId } = await initEmptyParagraphState(page);
    await focusRichText(page);

    const { createLinkedDoc, createSubpage } = getLinkedDocPopover(page);

    await createSubpage('page0');
    await createLinkedDoc('page1');

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

  test('duplicated subpage should paste as linked page', async ({ page }) => {
    await enterPlaygroundRoom(page);
    const { noteId } = await initEmptyParagraphState(page);
    await focusRichText(page);

    const { createLinkedDoc, createSubpage } = getLinkedDocPopover(page);

    await createLinkedDoc('page0');
    await createSubpage('page1');

    await type(page, '/duplicate');
    await pressEnter(page);
    await assertStoreMatchJSX(
      page,
      `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:displayMode="both"
  prop:edgeless={
    Object {
      "style": Object {
        "borderRadius": 8,
        "borderSize": 4,
        "borderStyle": "solid",
        "shadowType": "--affine-note-shadow-box",
      },
    }
  }
  prop:hidden={false}
  prop:index="a0"
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
</affine:note>`,
      noteId
    );
  });
});

test('should [[Selected text]] converted to linked page', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/2730',
  });
  await enterPlaygroundRoom(page);
  const { paragraphId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '1234');

  await dragBetweenIndices(page, [0, 1], [0, 2]);
  await type(page, '[');
  await assertRichTexts(page, ['1[2]34']);
  await type(page, '[');
  await assertStoreMatchJSX(
    page,
    `
<affine:paragraph
  prop:text={
    <>
      <text
        insert="1"
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
        insert="34"
      />
    </>
  }
  prop:type="text"
/>`,
    paragraphId
  );
  await switchToPage(page, '3');
  await assertTitle(page, '2');
});

test('add reference node before the other reference node', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'aaa');

  const firstRefNode = page.locator('affine-reference').nth(0);

  await type(page, '@bbb');
  await pressEnter(page);

  expect(await firstRefNode.textContent()).toEqual(
    expect.stringContaining('bbb')
  );
  expect(await firstRefNode.textContent()).not.toEqual(
    expect.stringContaining('ccc')
  );

  await pressArrowLeft(page, 3);
  await type(page, '@ccc');
  await pressEnter(page);

  expect(await firstRefNode.textContent()).not.toEqual(
    expect.stringContaining('bbb')
  );
  expect(await firstRefNode.textContent()).toEqual(
    expect.stringContaining('ccc')
  );
});
