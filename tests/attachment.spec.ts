import { expect, type Page } from '@playwright/test';
import { moveToImage } from 'utils/actions/drag.js';

import {
  pressBackspace,
  pressEnter,
  SHORT_KEY,
  type,
} from './utils/actions/keyboard.js';
import {
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
  waitNextFrame,
} from './utils/actions/misc.js';
import {
  assertImageOption,
  assertRichImage,
  assertStoreMatchJSX,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

const FILE_NAME = 'test-card-1.png';
const FILE_PATH = `packages/playground/public/${FILE_NAME}`;
const FILE_ID = 'ejImogf-Tb7AuKY-v94uz1zuOJbClqK-tWBxVr_ksGA=';
const FILE_SIZE = 45801;

function getAttachment(page: Page) {
  const attachment = page.locator('affine-attachment');
  const loading = attachment.locator('.affine-attachment-loading');
  const options = page.locator('.affine-attachment-options');
  const insertAttachment = async () => {
    page.evaluate(async () => {
      // Force fallback to input[type=file] in tests
      // See https://github.com/microsoft/playwright/issues/8850
      window.showOpenFilePicker = undefined;
    });

    page.evaluate(async () => {
      // Force fallback to input[type=file] in tests
      // See https://github.com/microsoft/playwright/issues/8850
      window.showOpenFilePicker = undefined;
    });
    const slashMenu = page.locator(`.slash-menu`);
    await waitNextFrame(page);
    await type(page, '/');
    await expect(slashMenu).toBeVisible();
    await type(page, 'file', 100);
    await expect(slashMenu).toBeVisible();

    await pressEnter(page);
    await page.setInputFiles("input[type='file']", FILE_PATH);

    await expect(attachment).toBeVisible();
  };

  const getName = () =>
    attachment.locator('.affine-attachment-name').innerText();

  return {
    attachment,
    options,
    insertAttachment,
    /**
     * Wait for the attachment upload to finish
     */
    waitLoading: () => loading.waitFor({ state: 'hidden' }),
    getName,
    getSize: () => attachment.locator('.affine-attachment-desc').innerText(),

    turnToEmbed: async () => {
      const btn = options
        .locator('icon-button')
        .filter({ hasText: 'Turn into Embed view' });

      await expect(btn).toBeVisible();
      await btn.click();
      await assertRichImage(page, 1);
    },
    rename: async (newName: string) => {
      await attachment.hover();
      await expect(options).toBeVisible();
      const btn = options.locator('icon-button').filter({ hasText: 'Rename' });
      await btn.click();
      await page.keyboard.press(`${SHORT_KEY}+a`, { delay: 50 });
      await pressBackspace(page);
      await type(page, newName);
      await pressEnter(page);
      expect(await getName()).toContain(newName);
    },

    turnImageToCard: async () => {
      await moveToImage(page);
      await assertImageOption(page);
      const btn = page
        .locator('icon-button')
        .filter({ hasText: 'Turn into Card view' });
      await expect(btn).toBeVisible();
      await btn.click();
      await expect(attachment).toBeVisible();
    },
  };
}

test('can insert attachment from slash menu', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);

  const { insertAttachment, waitLoading, getName, getSize } =
    getAttachment(page);

  await focusRichText(page);
  await insertAttachment();

  // Wait for the attachment to be uploaded
  await waitLoading();

  expect(await getName()).toBe(FILE_NAME);
  expect(await getSize()).toBe('45.8 kB');

  await assertStoreMatchJSX(
    page,
    `<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:attachment
    prop:loadingKey={null}
    prop:name="${FILE_NAME}"
    prop:size={${FILE_SIZE}}
    prop:sourceId="${FILE_ID}"
    prop:type="image/png"
  />
</affine:note>`,
    noteId
  );
});

test('should rename attachment works', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/4534',
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  const { insertAttachment, waitLoading, getName, rename } =
    getAttachment(page);

  await focusRichText(page);
  await insertAttachment();
  // Wait for the attachment to be uploaded
  await waitLoading();

  expect(await getName()).toBe(FILE_NAME);
  await rename('new-name');
  expect(await getName()).toBe('new-name.png');
  await rename('');
  expect(await getName()).toBe('.png');
  await rename('abc');
  expect(await getName()).toBe('abc');
});

test('should turn attachment to image works', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  const { insertAttachment, waitLoading, turnToEmbed, turnImageToCard } =
    getAttachment(page);

  await focusRichText(page);
  await insertAttachment();
  // Wait for the attachment to be uploaded
  await waitLoading();

  await turnToEmbed();

  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:image
    prop:caption=""
    prop:height={0}
    prop:sourceId="${FILE_ID}"
    prop:width={0}
  />
</affine:note>`,
    noteId
  );
  await turnImageToCard();
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:attachment
    prop:caption=""
    prop:name="${FILE_NAME}"
    prop:size={${FILE_SIZE}}
    prop:sourceId="${FILE_ID}"
    prop:type="image/png"
  />
</affine:note>`,
    noteId
  );
});
