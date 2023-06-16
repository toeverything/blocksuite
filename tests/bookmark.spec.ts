import './utils/declare-test-window.js';

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import {
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
  pressEnter,
  type,
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
  <affine:frame
    prop:background="--affine-background-secondary-color"
    prop:index="a0"
  >
    <affine:paragraph
      prop:type="text"
    />
    <affine:bookmark
      prop:caption=""
      prop:crawled={false}
      prop:description=""
      prop:icon=""
      prop:image=""
      prop:title=""
      prop:url="https://google.com"
    />
  </affine:frame>
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
  <affine:frame
    prop:background="--affine-background-secondary-color"
    prop:index="a0"
  >
    <affine:paragraph
      prop:type="text"
    />
    <affine:bookmark
      prop:caption=""
      prop:crawled={false}
      prop:description=""
      prop:icon=""
      prop:image=""
      prop:title=""
      prop:url="https://google.com"
    />
  </affine:frame>
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
  <affine:frame
    prop:background="--affine-background-secondary-color"
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
  </affine:frame>
</affine:page>`
  );
});
