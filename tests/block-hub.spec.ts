import { expect } from '@playwright/test';

import {
  dragBetweenCoords,
  enterPlaygroundRoom,
  focusRichText,
  getBoundingClientRect,
  getCenterPosition,
  getCenterPositionByLocator,
  initEmptyParagraphState,
  initParagraphsByCount,
  initThreeParagraphs,
  waitNextFrame,
} from './utils/actions/index.js';
import { assertRichTexts, assertStoreMatchJSX } from './utils/asserts.js';
import { test } from './utils/playwright.js';

test.skip('auto-scroll should be activate when adding blank lines or blocks', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initParagraphsByCount(page, 3);
  const paragraph2 = page
    .locator('rich-text')
    .filter({ hasText: 'paragraph 2' });
  await expect(paragraph2).toBeVisible();
  const largeText = `
  # Mozilla Public License Version 2.0

  Copyright (c) TOEVERYTHING PTE. LTD. and its affiliates.

  1. Definitions

  ---

  1.1. Contributor
  means each individual or legal entity that creates, contributes to
  the creation of, or owns Covered Software.

  1.2. Contributor Version
  means the combination of the Contributions of others (if any) used
  by a Contributor and that particular Contributor's Contribution.

  1.3. Contribution
  means Covered Software of a particular Contributor.

  1.4. Covered Software
  means Source Code Form to which the initial Contributor has attached
  the notice in Exhibit A, the Executable Form of such Source Code
  Form, and Modifications of such Source Code Form, in each case
  including portions thereof.

  1.5. Incompatible With Secondary Licenses
  means

      (a) that the initial Contributor has attached the notice described
          in Exhibit B to the Covered Software; or

      (b) that the Covered Software was made available under the terms of
          version 1.1 or earlier of the License, but not also under the
          terms of a Secondary License.

  1.6. Executable Form
  means any form of the work other than Source Code Form.

  1.7. Larger Work
  means a work that combines Covered Software with other material, in
  a separate file or files, that is not Covered Software.

  1.8. License
  means this document.

  1.9. Licensable
  means having the right to grant, to the maximum extent possible,
  whether at the time of the initial grant or subsequently, any and
  all of the rights conveyed by this License.

  1.10. Modifications
  means any of the following:

      (a) any file in Source Code Form that results from an addition to,
          deletion from, or modification of the contents of Covered
          Software; or

      (b) any new file in Source Code Form that contains any Covered
          Software.

  1.11. Patent Claims of a Contributor
  means any patent claim(s), including without limitation, method,
  process, and apparatus claims, in any patent Licensable by such
  Contributor that would be infringed, but for the grant of the
  License, by the making, using, selling, offering for sale, having
  made, import, or transfer of either its Contributions or its
  Contributor Version.

  `;

  // in order to make sure paragraph0 is out of current viewport, proactively to scroll the page by input a large amount of text
  await paragraph2.fill(largeText);
  const paragraph0 = page
    .locator('rich-text')
    .filter({ hasText: 'paragraph 0' });

  // now paragraph0 is out of viewport
  await expect(paragraph0).not.toBeInViewport();

  // drag blank line into paragraph1
  await page.click('.block-hub-menu-container [role="menuitem"]');
  await page.waitForTimeout(200);
  const blankMenu = '.block-hub-icon-container:nth-child(1)';

  const blankMenuRect = await getCenterPosition(page, blankMenu);
  const targetPos = await getCenterPositionByLocator(page, paragraph0);
  await dragBetweenCoords(
    page,
    { x: blankMenuRect.x, y: blankMenuRect.y },
    { x: targetPos.x, y: targetPos.y + 5 },
    { steps: 50 }
  );

  await waitNextFrame(page, 2000);
  // now paragraph0 is in viewport
  await expect(paragraph0).toBeInViewport();

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
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
      prop:text="paragraph 0"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="paragraph 1"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="${largeText}"
      prop:type="text"
    />
    <affine:paragraph
      prop:type="text"
    />
  </affine:note>
</affine:page>`
  );
});

test.skip('first level menu always exists, second level menu can be hidden by click firs level menu', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  const menuEntry = page.locator('.block-hub-menu-container [role="menuitem"]');
  const menuContainer = page.locator(
    '.block-hub-menu-container>div:first-child'
  );

  await expect(menuEntry).toBeVisible();
  await expect(menuContainer).toBeHidden();

  await page.click('.block-hub-menu-container [role="menuitem"]');
  await page.waitForTimeout(200);
  await expect(menuEntry).toBeVisible();
  await expect(menuContainer).toBeVisible();

  await page.click('.block-hub-menu-container [role="menuitem"]');
  await page.waitForTimeout(200);
  await expect(menuContainer).toBeHidden();
});

test.skip('block hub card items should appear and disappear properly with corresponding menu', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await page.click('.block-hub-menu-container [role="menuitem"]');
  const blankMenu = page.locator('.block-hub-icon-container:nth-child(1)');
  const textMenu = page.locator('.block-hub-icon-container:nth-child(2)');
  const listMenu = page.locator('.block-hub-icon-container:nth-child(3)');

  await textMenu.hover();
  const blockHubTextContainer = page.locator(
    '.block-hub-cards-container[type="text"]'
  );
  await expect(blockHubTextContainer).toBeVisible();

  await listMenu.hover();
  const blockHubListContainer = page.locator(
    '.block-hub-cards-container[type="list"]'
  );
  await expect(blockHubListContainer).toBeVisible();
  await page.waitForTimeout(300);
  await expect(blockHubTextContainer).toBeHidden();

  await blankMenu.hover();
  await expect(blockHubTextContainer).toBeHidden();
  await expect(blockHubListContainer).toBeHidden();
});

test.skip('block hub card items can disappear when clicking blank area', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await page.click('.block-hub-menu-container [role="menuitem"]');
  const textMenu = page.locator('.block-hub-icon-container:nth-child(2)');

  await textMenu.hover();
  const blockHubTextContainer = page.locator(
    '.block-hub-cards-container[type="text"]'
  );
  await expect(blockHubTextContainer).toBeVisible();

  const bbox = await page.evaluate((selector: string) => {
    const codeBlock = document.querySelector(selector);
    const bbox = codeBlock?.getBoundingClientRect() as DOMRect;
    return bbox;
  }, '.block-hub-cards-container[type="text"]');

  await page.mouse.click(bbox.left - 10, bbox.top - 10);
  await waitNextFrame(page);
  await expect(blockHubTextContainer).toBeHidden();
});

test.skip('drag blank line into text area', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await page.click('.block-hub-menu-container [role="menuitem"]');
  await page.waitForTimeout(200);
  const blankMenu = '.block-hub-icon-container:nth-child(1)';

  const blankMenuRect = await getCenterPosition(page, blankMenu);
  const targetPos = await getCenterPosition(page, '[data-block-id="2"]');
  await dragBetweenCoords(
    page,
    { x: blankMenuRect.x, y: blankMenuRect.y },
    { x: targetPos.x, y: targetPos.y + 5 },
    { steps: 50 }
  );

  await waitNextFrame(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
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
      prop:text="123"
      prop:type="text"
    />
    <affine:paragraph
      prop:type="text"
    />
    <affine:paragraph
      prop:text="456"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="789"
      prop:type="text"
    />
  </affine:note>
</affine:page>`
  );
});

test.skip('drag Heading1 block from text menu into text area and blockHub text cards will disappear', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await page.click('.block-hub-menu-container [role="menuitem"]');
  await page.waitForTimeout(200);
  const textMenu = '.block-hub-icon-container:nth-child(2)';

  const textMenuRect = await getCenterPosition(page, textMenu);
  await page.mouse.move(textMenuRect.x, textMenuRect.y);
  const blockHubTextContainer = page.locator(
    '.block-hub-cards-container[type="text"]'
  );
  await expect(blockHubTextContainer).toBeVisible();

  const headingPos = await getCenterPosition(
    page,
    '.card-container[affine-flavour="affine:paragraph"][affine-type="h1"]'
  );
  const targetPos = await getCenterPosition(page, '[data-block-id="2"]');
  await dragBetweenCoords(
    page,
    { x: headingPos.x, y: headingPos.y },
    { x: targetPos.x, y: targetPos.y + 5 },
    { steps: 50 }
  );
  await waitNextFrame(page);

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
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
      prop:text="123"
      prop:type="text"
    />
    <affine:paragraph
      prop:type="h1"
    />
    <affine:paragraph
      prop:text="456"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="789"
      prop:type="text"
    />
  </affine:note>
</affine:page>`
  );
  await expect(blockHubTextContainer).toBeHidden();
});

test.skip('drag numbered list block from list menu into text area and blockHub list cards will disappear', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await page.click('.block-hub-menu-container [role="menuitem"]');
  await page.waitForTimeout(200);
  const listMenu = page.locator('.block-hub-icon-container:nth-child(3)');
  await listMenu.hover();
  const blockHubListContainer = page.locator(
    '.block-hub-cards-container[type="list"]'
  );
  await expect(blockHubListContainer).toBeVisible();

  const numberedListPos = await getCenterPosition(
    page,
    '.card-container[affine-flavour="affine:list"][affine-type="numbered"]'
  );
  const targetPos = await getCenterPosition(page, '[data-block-id="2"]');
  await dragBetweenCoords(
    page,
    { x: numberedListPos.x, y: numberedListPos.y },
    { x: targetPos.x, y: targetPos.y + 5 },
    { steps: 50 }
  );
  await waitNextFrame(page);

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
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
      prop:text="123"
      prop:type="text"
    />
    <affine:list
      prop:checked={false}
      prop:collapsed={false}
      prop:type="numbered"
    />
    <affine:paragraph
      prop:text="456"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="789"
      prop:type="text"
    />
  </affine:note>
</affine:page>`
  );
  await expect(blockHubListContainer).toBeHidden();
});

test.skip('should auto hide card list when dragging a card', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await page.click('.block-hub-menu-container [role="menuitem"]');
  await page.waitForTimeout(200);
  const listMenu = page.locator('.block-hub-icon-container:nth-child(3)');
  await listMenu.hover();
  const blockHubListContainer = page.locator(
    '.block-hub-cards-container[type="list"]'
  );
  await expect(blockHubListContainer).toBeVisible();

  const numberedListPos = await getCenterPosition(
    page,
    '.card-container[affine-flavour="affine:list"][affine-type="numbered"]'
  );
  const targetPos = await getCenterPosition(page, '[data-block-id="2"]');
  await dragBetweenCoords(
    page,
    { x: numberedListPos.x, y: numberedListPos.y },
    { x: targetPos.x, y: targetPos.y + 5 },
    { steps: 50 }
  );
  await waitNextFrame(page);

  await expect(blockHubListContainer).toBeHidden();
});

test.skip('drag database', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await page.click('.block-hub-menu-container [role="menuitem"]');
  await page.waitForTimeout(500);
  const databaseMenu = '.block-hub-icon-container:nth-child(5)';

  const databaseRect = await getCenterPosition(page, databaseMenu);
  const targetPos = await getCenterPosition(page, '[data-block-id="2"]');
  await dragBetweenCoords(
    page,
    { x: databaseRect.x, y: databaseRect.y },
    { x: targetPos.x, y: targetPos.y - 5 },
    { steps: 50 }
  );

  const database = page.locator('affine-database');
  await expect(database).toBeVisible();
  const tagColumn = page.locator('.affine-database-column').nth(1);
  expect(await tagColumn.innerText()).toBe('Status');
  const defaultRows = page.locator('.affine-database-block-row');
  expect(await defaultRows.count()).toBe(4);
});

test.describe('Drag block hub can snap to the edge and function properly', () => {
  test.skip('drag blank line to the bottom of editor should insert block', async ({
    page,
  }) => {
    test.info().annotations.push({
      type: 'issue',
      description: 'https://github.com/toeverything/AFFiNE/issues/2125',
    });
    await enterPlaygroundRoom(page);
    const { noteId } = await initEmptyParagraphState(page);

    await page.click('.block-hub-menu-container [role="menuitem"]');
    await page.waitForTimeout(500);
    const blankMenu = '.block-hub-icon-container:nth-child(1)';

    const blankMenuRect = await getCenterPosition(page, blankMenu);
    const targetPos = await getCenterPosition(page, '[data-block-id="1"]');
    await dragBetweenCoords(
      page,
      { x: blankMenuRect.x + 5, y: blankMenuRect.y + 5 },
      { x: targetPos.x, y: targetPos.y + 5 },
      { steps: 50 }
    );

    await waitNextFrame(page);
    await assertStoreMatchJSX(
      page,
      /*xml*/ `
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
  <affine:paragraph
    prop:type="text"
  />
</affine:note>`,
      noteId
    );
  });

  test.skip('drag blank line to the right of editor should not insert block', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    const { noteId } = await initEmptyParagraphState(page);

    await page.click('.block-hub-menu-container [role="menuitem"]');
    await page.waitForTimeout(500);
    const blankMenu = '.block-hub-icon-container:nth-child(1)';

    const blankMenuRect = await getCenterPosition(page, blankMenu);
    const targetPos = await getBoundingClientRect(page, '[data-block-id="1"]');
    await dragBetweenCoords(
      page,
      { x: blankMenuRect.x, y: blankMenuRect.y },
      { x: targetPos.x + targetPos.width + 10, y: targetPos.y },
      { steps: 50 }
    );

    await waitNextFrame(page);
    await assertStoreMatchJSX(
      page,
      /*xml*/ `
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
</affine:note>`,
      noteId
    );
  });
});
