import { expect } from '@playwright/test';

import {
  dragBetweenCoords,
  enterPlaygroundRoom,
  focusRichText,
  getCenterPosition,
  initEmptyParagraphState,
  initThreeParagraphs,
  waitNextFrame,
} from './utils/actions/index.js';
import { assertRichTexts, assertStoreMatchJSX } from './utils/asserts.js';
import { test } from './utils/playwright.js';

test('first level menu always exists, second level menu can be hidden by click firs level menu', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  const menuEntry = page.locator(
    '.block-hub-menu-container [role="menu-entry"]'
  );
  const menuContainer = page.locator(
    '.block-hub-menu-container>div:first-child'
  );

  await expect(menuEntry).toBeVisible();
  await expect(menuContainer).toBeHidden();

  await page.click('.block-hub-menu-container [role="menu-entry"]');
  await page.waitForTimeout(200);
  await expect(menuEntry).toBeVisible();
  await expect(menuContainer).toBeVisible();

  await page.click('.block-hub-menu-container [role="menu-entry"]');
  await page.waitForTimeout(200);
  await expect(menuContainer).toBeHidden();
});

test('blockHub card items should appear and disappear properly with corresponding menu', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await page.click('.block-hub-menu-container [role="menu-entry"]');
  const blankMenu = page.locator('.block-hub-icon-container:nth-child(1)');
  const textMenu = page.locator('.block-hub-icon-container:nth-child(2)');
  const listMenu = page.locator('.block-hub-icon-container:nth-child(3)');

  await textMenu.hover();
  const blockHubTextContainer = page.locator(
    '.affine-block-hub-container[type="text"]'
  );
  await expect(blockHubTextContainer).toBeVisible();

  await listMenu.hover();
  const blockHubListContainer = page.locator(
    '.affine-block-hub-container[type="list"]'
  );
  await expect(blockHubListContainer).toBeVisible();
  await expect(blockHubTextContainer).toBeHidden();

  await blankMenu.hover();
  await expect(blockHubTextContainer).toBeHidden();
  await expect(blockHubListContainer).toBeHidden();
});

test('blockHub card items can disappear when clicking blank area', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await page.click('.block-hub-menu-container [role="menu-entry"]');
  const textMenu = page.locator('.block-hub-icon-container:nth-child(2)');

  await textMenu.hover();
  const blockHubTextContainer = page.locator(
    '.affine-block-hub-container[type="text"]'
  );
  await expect(blockHubTextContainer).toBeVisible();

  const bbox = await page.evaluate((selector: string) => {
    const codeBlock = document.querySelector(selector);
    const bbox = codeBlock?.getBoundingClientRect() as DOMRect;
    return bbox;
  }, '.affine-block-hub-container[type="text"]');

  await page.mouse.click(bbox.left - 10, bbox.top - 10);
  await waitNextFrame(page);
  await expect(blockHubTextContainer).toBeHidden();
});

test('drag blank line into text area', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await page.click('.block-hub-menu-container [role="menu-entry"]');
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
  <affine:frame>
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
  </affine:frame>
</affine:page>`
  );
});

test('drag Heading1 block from text menu into text area and blockHub text cards will disappear', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await page.click('.block-hub-menu-container [role="menu-entry"]');
  await page.waitForTimeout(200);
  const textMenu = '.block-hub-icon-container:nth-child(2)';

  const textMenuRect = await getCenterPosition(page, textMenu);
  await page.mouse.move(textMenuRect.x, textMenuRect.y);
  const blockHubTextContainer = page.locator(
    '.affine-block-hub-container[type="text"]'
  );
  await expect(blockHubTextContainer).toBeVisible();

  const headingPos = await getCenterPosition(
    page,
    '.has-tool-tip[affine-flavour="affine:paragraph"][affine-type="h1"]'
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
  <affine:frame>
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
  </affine:frame>
</affine:page>`
  );
  await expect(blockHubTextContainer).toBeHidden();
});

test('drag numbered list block from list menu into text area and blockHub list cards will disappear', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await page.click('.block-hub-menu-container [role="menu-entry"]');
  await page.waitForTimeout(200);
  const listMenu = page.locator('.block-hub-icon-container:nth-child(3)');
  await listMenu.hover();
  const blockHubListContainer = page.locator(
    '.affine-block-hub-container[type="list"]'
  );
  await expect(blockHubListContainer).toBeVisible();

  const numberedListPos = await getCenterPosition(
    page,
    '.has-tool-tip[affine-flavour="affine:list"][affine-type="numbered"]'
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
  <affine:frame>
    <affine:paragraph
      prop:text="123"
      prop:type="text"
    />
    <affine:list
      prop:checked={false}
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
  </affine:frame>
</affine:page>`
  );
  await expect(blockHubListContainer).toBeHidden();
});
