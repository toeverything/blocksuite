import './utils/declare-test-window.js';

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import {
  activeNoteInEdgeless,
  copyByKeyboard,
  enterPlaygroundRoom,
  focusRichText,
  initEmptyEdgelessState,
  initEmptyParagraphState,
  pressArrowRight,
  pressEnter,
  selectAllByKeyboard,
  setInlineRangeInSelectedRichText,
  SHORT_KEY,
  switchEditorMode,
  type,
  waitForInlineEditorStateUpdated,
  waitNextFrame,
} from './utils/actions/index.js';
import { assertStoreMatchJSX } from './utils/asserts.js';
import { scoped, test } from './utils/playwright.js';

const inputUrl = 'http://localhost';

const createBookmarkBlockBySlashMenu = async (page: Page) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '/bookmark');
  await pressEnter(page);
  await type(page, inputUrl);
  await pressEnter(page);
};

const hoverBookmarkBlock = async (page: Page) => {
  const listMenu = page.locator('affine-bookmark');
  await listMenu.hover();
};

test(scoped`create bookmark by slash menu`, async ({ page }) => {
  await createBookmarkBlockBySlashMenu(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
  <affine:note
    prop:background="--affine-background-secondary-color"
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
  await hoverBookmarkBlock(page);
  await page.click('.bookmark-toolbar-button.link');
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
  <affine:note
    prop:background="--affine-background-secondary-color"
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
  await type(page, '/bookmark');
  await pressEnter(page);
  await page.keyboard.press(`${SHORT_KEY}+v`);
  await pressEnter(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
  <affine:note
    prop:background="--affine-background-secondary-color"
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
  await type(page, '/bookmark');
  await pressEnter(page);
  await page.keyboard.press(`${SHORT_KEY}+v`);
  await pressEnter(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
  <affine:surface />
  <affine:note
    prop:background="--affine-background-secondary-color"
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

  await page.mouse.move(rect.x + 40, rect.y + rect.height + 80);
  await page.waitForTimeout(200);

  await page.mouse.up();
  await page.waitForTimeout(200);

  const rects = page.locator('affine-block-selection');
  await expect(rects).toHaveCount(1);

  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
  <affine:note
    prop:background="--affine-background-secondary-color"
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
