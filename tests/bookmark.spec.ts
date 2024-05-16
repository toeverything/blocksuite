import './utils/declare-test-window.js';

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { getEmbedCardToolbar } from 'utils/query.js';

import {
  activeNoteInEdgeless,
  copyByKeyboard,
  enterPlaygroundRoom,
  focusRichText,
  initEmptyEdgelessState,
  initEmptyParagraphState,
  pasteByKeyboard,
  pressArrowRight,
  pressArrowUp,
  pressBackspace,
  pressEnter,
  selectAllByKeyboard,
  setInlineRangeInSelectedRichText,
  SHORT_KEY,
  switchEditorMode,
  type,
  waitForInlineEditorStateUpdated,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertAlmostEqual,
  assertBlockCount,
  assertBlockSelections,
  assertExists,
  assertRichTextInlineRange,
  assertStoreMatchJSX,
} from './utils/asserts.js';
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
  await type(page, '/links');
  await pressEnter(page);
  await type(page, inputUrl);
  await pressEnter(page);
};

test(scoped`create bookmark by slash menu`, async ({ page }) => {
  await createBookmarkBlockBySlashMenu(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
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
  await page.click('.embed-card-toolbar-button.link');
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
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
  await type(page, '/links');
  await pressEnter(page);
  await page.keyboard.press(`${SHORT_KEY}+v`);
  await pressEnter(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
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
  await type(page, '/links');
  await pressEnter(page);
  await waitNextFrame(page);
  await page.keyboard.press(`${SHORT_KEY}+v`);
  await pressEnter(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
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
  await type(page, '/links');
  await pressEnter(page);
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
