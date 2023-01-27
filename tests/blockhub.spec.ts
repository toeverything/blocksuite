import { expect, test } from '@playwright/test';
import {
  dragBetweenCoords,
  enterPlaygroundRoom,
  focusRichText,
  getCenterPosition,
  initEmptyParagraphState,
  initThreeParagraphs,
} from './utils/actions/index.js';
import { assertRichTexts, assertStoreMatchJSX } from './utils/asserts.js';

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
  await page.waitForTimeout(200);
  const blankMenu = '.block-hub-icon-container:nth-child(1)';
  const textMenu = '.block-hub-icon-container:nth-child(2)';
  const listMenu = '.block-hub-icon-container:nth-child(3)';

  const textMenuRect = await getCenterPosition(page, textMenu);
  await page.mouse.move(textMenuRect.x, textMenuRect.y);
  const blockHubTextContainer = page.locator(
    '.affine-block-hub-container[type="text"]'
  );
  await expect(blockHubTextContainer).toBeVisible();

  const listMenuRect = await getCenterPosition(page, listMenu);
  await page.mouse.move(listMenuRect.x, listMenuRect.y);
  const blockHubListContainer = page.locator(
    '.affine-block-hub-container[type="list"]'
  );
  await expect(blockHubListContainer).toBeVisible();
  await expect(blockHubTextContainer).toBeHidden();

  const blankMenuRect = await getCenterPosition(page, blankMenu);
  await page.mouse.move(blankMenuRect.x, blankMenuRect.y);
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
  await page.waitForTimeout(200);
  const textMenu = '.block-hub-icon-container:nth-child(2)';

  const textMenuRect = await getCenterPosition(page, textMenu);
  await page.mouse.move(textMenuRect.x, textMenuRect.y);
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

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page
  prop:title=""
>
  <affine:frame
    prop:xywh="[0,0,720,112]"
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
  </affine:frame>
</affine:page>`
  );
});

test('drag quote block from text menu into text area and blockHub text cards will disappear', async ({
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

  const quotePos = await getCenterPosition(
    page,
    '.has-tool-tip[affine-flavour="affine:paragraph"][affine-type="quote"]'
  );
  const targetPos = await getCenterPosition(page, '[data-block-id="2"]');
  await dragBetweenCoords(
    page,
    { x: quotePos.x, y: quotePos.y },
    { x: targetPos.x, y: targetPos.y + 5 },
    { steps: 50 }
  );

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page
  prop:title=""
>
  <affine:frame
    prop:xywh="[0,0,720,112]"
  >
    <affine:paragraph
      prop:text="123"
      prop:type="text"
    />
    <affine:paragraph
      prop:type="quote"
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
  const listMenu = '.block-hub-icon-container:nth-child(3)';

  const listMenuRect = await getCenterPosition(page, listMenu);
  await page.mouse.move(listMenuRect.x, listMenuRect.y);
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

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page
  prop:title=""
>
  <affine:frame
    prop:xywh="[0,0,720,112]"
  >
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
