import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';
import { getEmbedCardToolbar } from 'utils/query.js';

import {
  SHORT_KEY,
  activeNoteInEdgeless,
  copyByKeyboard,
  dragBlockToPoint,
  enterPlaygroundRoom,
  focusRichText,
  initEmptyEdgelessState,
  initEmptyParagraphState,
  pasteByKeyboard,
  pressArrowDown,
  pressArrowRight,
  pressArrowUp,
  pressBackspace,
  pressEnter,
  pressShiftTab,
  pressTab,
  selectAllByKeyboard,
  setInlineRangeInSelectedRichText,
  switchEditorMode,
  type,
  waitForInlineEditorStateUpdated,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertAlmostEqual,
  assertBlockChildrenIds,
  assertBlockCount,
  assertBlockFlavour,
  assertBlockSelections,
  assertExists,
  assertParentBlockFlavour,
  assertRichTextInlineRange,
  assertStoreMatchJSX,
} from './utils/asserts.js';
import './utils/declare-test-window.js';
import { scoped, test } from './utils/playwright.js';

const inputUrl = 'http://localhost';

test.beforeEach(async ({ page }) => {
  await page.route(
    'https://affine-worker.toeverything.workers.dev/api/worker/link-preview',
    async route => {
      await route.fulfill({
        json: {},
      });
    }
  );
});

const createBookmarkBlockBySlashMenu = async (page: Page) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.waitForTimeout(100);
  await type(page, '/link', 100);
  await pressEnter(page);
  await page.waitForTimeout(100);
  await type(page, inputUrl);
  await pressEnter(page);
};

test(scoped`create bookmark by slash menu`, async ({ page }) => {
  await createBookmarkBlockBySlashMenu(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
  <affine:note
    prop:background="--affine-note-background-blue"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 0,
          "borderSize": 4,
          "borderStyle": "none",
          "shadowType": "--affine-note-shadow-sticker",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:bookmark
      prop:caption={null}
      prop:description={null}
      prop:icon={null}
      prop:image={null}
      prop:index="a0"
      prop:rotate={0}
      prop:style="horizontal"
      prop:title={null}
      prop:url="${inputUrl}"
    />
  </affine:note>
</affine:page>`
  );
});

test.skip(scoped`create bookmark by blockhub`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await page.click('.block-hub-menu-container [role="menuitem"]');
  await page.waitForTimeout(200);
  const listMenu = page.locator('.block-hub-icon-container:nth-child(4)');
  await listMenu.hover();
  const blockHubListContainer = page.locator(
    '.block-hub-cards-container[type="file"]'
  );
  await expect(blockHubListContainer).toBeVisible();
  await page.click(
    '.card-container[affine-flavour="affine:bookmark"][affine-type="bookmark"]'
  );
  await page.waitForTimeout(200);
  await type(page, inputUrl);
  await pressEnter(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
  <affine:note
    prop:background="--affine-note-background-blue"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 0,
          "borderSize": 4,
          "borderStyle": "none",
          "shadowType": "--affine-note-shadow-sticker",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:type="text"
    />
    <affine:bookmark
      prop:caption={null}
      prop:description={null}
      prop:icon={null}
      prop:image={null}
      prop:index="a0"
      prop:rotate={0}
      prop:style="horizontal"
      prop:title={null}
      prop:url="${inputUrl}"
    />
  </affine:note>
</affine:page>`
  );
});

test(scoped`covert bookmark block to link text`, async ({ page }) => {
  await createBookmarkBlockBySlashMenu(page);
  const bookmark = page.locator('affine-bookmark');
  await bookmark.click();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: 'Switch view' }).click();
  await page.getByRole('button', { name: 'Inline view' }).click();
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
  <affine:note
    prop:background="--affine-note-background-blue"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 0,
          "borderSize": 4,
          "borderStyle": "none",
          "shadowType": "--affine-note-shadow-sticker",
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
            insert="${inputUrl}"
            link="${inputUrl}"
          />
        </>
      }
      prop:type="text"
    />
  </affine:note>
</affine:page>`
  );
});

test(scoped`copy url to create bookmark in page mode`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, inputUrl);
  await setInlineRangeInSelectedRichText(page, 0, inputUrl.length);
  await copyByKeyboard(page);
  await focusRichText(page);
  await type(page, '/link');
  await pressEnter(page);
  await page.keyboard.press(`${SHORT_KEY}+v`);
  await pressEnter(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
  <affine:note
    prop:background="--affine-note-background-blue"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 0,
          "borderSize": 4,
          "borderStyle": "none",
          "shadowType": "--affine-note-shadow-sticker",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:text="${inputUrl}"
      prop:type="text"
    />
    <affine:bookmark
      prop:caption={null}
      prop:description={null}
      prop:icon={null}
      prop:image={null}
      prop:index="a0"
      prop:rotate={0}
      prop:style="horizontal"
      prop:title={null}
      prop:url="${inputUrl}"
    />
  </affine:note>
</affine:page>`
  );
});

test(scoped`copy url to create bookmark in edgeless mode`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, inputUrl);

  await switchEditorMode(page);

  await activeNoteInEdgeless(page, ids.noteId);
  await waitForInlineEditorStateUpdated(page);
  await selectAllByKeyboard(page);
  await copyByKeyboard(page);
  await pressArrowRight(page);
  await waitNextFrame(page);
  await type(page, '/link', 100);
  await pressEnter(page);
  await page.waitForTimeout(100);
  await waitNextFrame(page);
  await page.keyboard.press(`${SHORT_KEY}+v`);
  await pressEnter(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
  <affine:surface />
  <affine:note
    prop:background="--affine-note-background-blue"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 0,
          "borderSize": 4,
          "borderStyle": "none",
          "shadowType": "--affine-note-shadow-sticker",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:text="${inputUrl}"
      prop:type="text"
    />
    <affine:bookmark
      prop:caption={null}
      prop:description={null}
      prop:icon={null}
      prop:image={null}
      prop:index="a0"
      prop:rotate={0}
      prop:style="horizontal"
      prop:title={null}
      prop:url="${inputUrl}"
    />
  </affine:note>
</affine:page>`
  );
});

test(scoped`support dragging bookmark block directly`, async ({ page }) => {
  await createBookmarkBlockBySlashMenu(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
  <affine:note
    prop:background="--affine-note-background-blue"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 0,
          "borderSize": 4,
          "borderStyle": "none",
          "shadowType": "--affine-note-shadow-sticker",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:bookmark
      prop:caption={null}
      prop:description={null}
      prop:icon={null}
      prop:image={null}
      prop:index="a0"
      prop:rotate={0}
      prop:style="horizontal"
      prop:title={null}
      prop:url="${inputUrl}"
    />
  </affine:note>
</affine:page>`
  );

  const bookmark = page.locator('affine-bookmark');
  const rect = await bookmark.boundingBox();
  if (!rect) {
    throw new Error('image not found');
  }

  // add new paragraph blocks
  await page.mouse.click(rect.x + 20, rect.y + rect.height + 20);
  await focusRichText(page);
  await type(page, '111');
  await page.waitForTimeout(200);
  await pressEnter(page);

  await type(page, '222');
  await page.waitForTimeout(200);
  await pressEnter(page);

  await type(page, '333');
  await page.waitForTimeout(200);

  await page.waitForTimeout(200);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
  <affine:note
    prop:background="--affine-note-background-blue"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 0,
          "borderSize": 4,
          "borderStyle": "none",
          "shadowType": "--affine-note-shadow-sticker",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:bookmark
      prop:caption={null}
      prop:description={null}
      prop:icon={null}
      prop:image={null}
      prop:index="a0"
      prop:rotate={0}
      prop:style="horizontal"
      prop:title={null}
      prop:url="${inputUrl}"
    />
    <affine:paragraph
      prop:text="111"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="222"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="333"
      prop:type="text"
    />
  </affine:note>
</affine:page>`
  );

  // drag bookmark block
  await page.mouse.move(rect.x + 20, rect.y + 20);
  await page.mouse.down();
  await page.waitForTimeout(200);

  await page.mouse.move(rect.x + 40, rect.y + rect.height + 80, {
    steps: 5,
  });
  await page.waitForTimeout(200);

  await page.mouse.up();
  await page.waitForTimeout(200);

  const rects = page.locator('affine-block-selection').locator('visible=true');
  await expect(rects).toHaveCount(1);

  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
  <affine:note
    prop:background="--affine-note-background-blue"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 0,
          "borderSize": 4,
          "borderStyle": "none",
          "shadowType": "--affine-note-shadow-sticker",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:text="111"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="222"
      prop:type="text"
    />
    <affine:bookmark
      prop:caption={null}
      prop:description={null}
      prop:icon={null}
      prop:image={null}
      prop:index="a0"
      prop:rotate={0}
      prop:style="horizontal"
      prop:title={null}
      prop:url="${inputUrl}"
    />
    <affine:paragraph
      prop:text="333"
      prop:type="text"
    />
  </affine:note>
</affine:page>`
  );
});

test('press backspace after bookmark block can select bookmark block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await pressEnter(page);
  await pressArrowUp(page);
  await type(page, '/link');
  await pressEnter(page);
  await page.waitForTimeout(100);
  await type(page, inputUrl);
  await pressEnter(page);

  await focusRichText(page);
  await assertBlockCount(page, 'paragraph', 1);
  await assertRichTextInlineRange(page, 0, 0);
  await pressBackspace(page);
  await assertBlockSelections(page, ['4']);
  await assertBlockCount(page, 'paragraph', 0);
});

test.describe('embed card toolbar', () => {
  async function showEmbedCardToolbar(page: Page) {
    await createBookmarkBlockBySlashMenu(page);
    const bookmark = page.locator('affine-bookmark');
    await bookmark.click();
    await page.waitForTimeout(100);
    const { embedCardToolbar } = getEmbedCardToolbar(page);
    await expect(embedCardToolbar).toBeVisible();
  }

  test('show toolbar when bookmark selected', async ({ page }) => {
    await showEmbedCardToolbar(page);
  });

  test('copy bookmark url by copy button', async ({ page }) => {
    await showEmbedCardToolbar(page);
    const { copyButton } = getEmbedCardToolbar(page);
    await copyButton.click();
    await page.mouse.click(600, 600);
    await waitNextFrame(page);

    await pasteByKeyboard(page);
    await assertStoreMatchJSX(
      page,
      /*xml*/ `<affine:page>
  <affine:note
    prop:background="--affine-note-background-blue"
    prop:displayMode="both"
    prop:edgeless={
      Object {
        "style": Object {
          "borderRadius": 0,
          "borderSize": 4,
          "borderStyle": "none",
          "shadowType": "--affine-note-shadow-sticker",
        },
      }
    }
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:bookmark
      prop:caption={null}
      prop:description={null}
      prop:icon={null}
      prop:image={null}
      prop:index="a0"
      prop:rotate={0}
      prop:style="horizontal"
      prop:title={null}
      prop:url="${inputUrl}"
    />
    <affine:paragraph
      prop:text={
        <>
          <text
            insert="${inputUrl}"
            link="${inputUrl}"
          />
        </>
      }
      prop:type="text"
    />
  </affine:note>
</affine:page>`
    );
  });

  test('change card style', async ({ page }) => {
    await showEmbedCardToolbar(page);
    const bookmark = page.locator('affine-bookmark');
    const { openCardStyleMenu } = getEmbedCardToolbar(page);
    await openCardStyleMenu();
    const { cardStyleHorizontalButton, cardStyleListButton } =
      getEmbedCardToolbar(page);
    await cardStyleListButton.click();
    await waitNextFrame(page);
    const listStyleBookmarkBox = await bookmark.boundingBox();
    assertExists(listStyleBookmarkBox);
    assertAlmostEqual(listStyleBookmarkBox.width, 752, 2);
    assertAlmostEqual(listStyleBookmarkBox.height, 46, 2);

    await openCardStyleMenu();
    await cardStyleHorizontalButton.click();
    await waitNextFrame(page);
    const horizontalStyleBookmarkBox = await bookmark.boundingBox();
    assertExists(horizontalStyleBookmarkBox);
    assertAlmostEqual(horizontalStyleBookmarkBox.width, 752, 2);
    assertAlmostEqual(horizontalStyleBookmarkBox.height, 116, 2);
  });
});

test('indent bookmark block to paragraph', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await pressEnter(page);
  await type(page, '/link', 100);
  await pressEnter(page);
  await type(page, inputUrl);
  await pressEnter(page);

  await assertBlockChildrenIds(page, '1', ['2', '4']);
  await assertBlockFlavour(page, '1', 'affine:note');
  await assertBlockFlavour(page, '2', 'affine:paragraph');
  await assertBlockFlavour(page, '4', 'affine:bookmark');

  await focusRichText(page);
  await pressArrowDown(page);
  await assertBlockSelections(page, ['4']);
  await pressTab(page);
  await assertBlockChildrenIds(page, '1', ['2']);
  await assertBlockChildrenIds(page, '2', ['4']);

  await pressShiftTab(page);
  await assertBlockChildrenIds(page, '1', ['2', '4']);
});

test('indent bookmark block to list', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, '- a');
  await pressEnter(page);
  await type(page, '/link', 100);
  await pressEnter(page);
  await type(page, inputUrl);
  await pressEnter(page);

  await assertBlockChildrenIds(page, '1', ['3', '5']);
  await assertBlockFlavour(page, '1', 'affine:note');
  await assertBlockFlavour(page, '3', 'affine:list');
  await assertBlockFlavour(page, '5', 'affine:bookmark');

  await focusRichText(page);
  await pressArrowDown(page);
  await assertBlockSelections(page, ['5']);
  await pressTab(page);
  await assertBlockChildrenIds(page, '1', ['3']);
  await assertBlockChildrenIds(page, '3', ['5']);

  await pressShiftTab(page);
  await assertBlockChildrenIds(page, '1', ['3', '5']);
});

test('bookmark can be dragged from note to surface top level block', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await focusRichText(page);
  await page.waitForTimeout(100);
  await type(page, '/link', 100);
  await pressEnter(page);
  await page.waitForTimeout(100);
  await type(page, inputUrl);
  await pressEnter(page);

  await switchEditorMode(page);
  await page.mouse.dblclick(450, 450);

  await dragBlockToPoint(page, '4', { x: 200, y: 200 });

  await waitNextFrame(page);
  await assertParentBlockFlavour(page, '5', 'affine:surface');
});
