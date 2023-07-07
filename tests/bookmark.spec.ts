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
  pressEnter,
  setVirgoSelection,
  SHORT_KEY,
  switchEditorMode,
  type,
  waitForVirgoStateUpdated,
} from './utils/actions/index.js';
import { assertStoreMatchJSX } from './utils/asserts.js';
import { scoped, test } from './utils/playwright.js';

const inputUrl = 'https://google.com';

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
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:type="text"
    />
    <affine:bookmark
      prop:bookmarkTitle=""
      prop:caption=""
      prop:crawled={false}
      prop:description=""
      prop:icon=""
      prop:image=""
      prop:url="https://google.com"
    />
  </affine:note>
</affine:page>`
  );
});

test(scoped`create bookmark by blockhub`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await page.click('.block-hub-menu-container [role="menuitem"]');
  await page.waitForTimeout(200);
  const listMenu = page.locator('.block-hub-icon-container:nth-child(4)');
  await listMenu.hover();
  const blockHubListContainer = page.locator(
    '.affine-block-hub-container[type="file"]'
  );
  await expect(blockHubListContainer).toBeVisible();
  await page.click(
    '.has-tool-tip[affine-flavour="affine:bookmark"][affine-type="bookmark"]'
  );
  await page.waitForTimeout(200);
  await type(page, inputUrl);
  await pressEnter(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
  <affine:note
    prop:background="--affine-background-secondary-color"
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:type="text"
    />
    <affine:bookmark
      prop:bookmarkTitle=""
      prop:caption=""
      prop:crawled={false}
      prop:description=""
      prop:icon=""
      prop:image=""
      prop:url="https://google.com"
    />
  </affine:note>
</affine:page>`
  );
});
// This function is in AFFine
// test.skip(scoped`create bookmark by paste`, async ({ page }) => {});
test(scoped`covert bookmark block to link text`, async ({ page }) => {
  await createBookmarkBlockBySlashMenu(page);
  await hoverBookmarkBlock(page);
  await page.click('.bookmark-toolbar-button.link');
  await assertStoreMatchJSX(
    page,
    /*xml*/ `<affine:page>
  <affine:note
    prop:background="--affine-background-secondary-color"
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:type="text"
    />
    <affine:paragraph
      prop:text={
        <>
          <text
            insert="https://google.com"
            link="https://google.com"
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

  await type(page, 'https://google.com');
  await setVirgoSelection(page, 0, 18);
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
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:text={
        <>
          <text
            insert="https://google.com"
            link="https://google.com/bookmark"
          />
        </>
      }
      prop:type="text"
    />
    <affine:bookmark
      prop:bookmarkTitle=""
      prop:caption=""
      prop:crawled={false}
      prop:description=""
      prop:icon=""
      prop:image=""
      prop:url="https://google.com"
    />
  </affine:note>
</affine:page>`
  );
});

test(scoped`copy url to create bookmark in edgeless mode`, async ({ page }) => {
  await enterPlaygroundRoom(page);
  const ids = await initEmptyEdgelessState(page);
  await focusRichText(page);
  await type(page, 'https://google.com');

  await switchEditorMode(page);

  await activeNoteInEdgeless(page, ids.noteId);
  await waitForVirgoStateUpdated(page);
  await setVirgoSelection(page, 0, 18);
  await copyByKeyboard(page);
  await focusRichText(page);
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
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:text={
        <>
          <text
            insert="https://google.com"
            link="https://google.com/bookmark"
          />
        </>
      }
      prop:type="text"
    />
    <affine:bookmark
      prop:bookmarkTitle=""
      prop:caption=""
      prop:crawled={false}
      prop:description=""
      prop:icon=""
      prop:image=""
      prop:url="https://google.com"
    />
  </affine:note>
</affine:page>`
  );
});
