import { expect, type Page } from '@playwright/test';

import { pressEnter, type } from './utils/actions/keyboard.js';
import {
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
} from './utils/actions/misc.js';
import { assertStoreMatchJSX } from './utils/asserts.js';
import { test } from './utils/playwright.js';

function getAttachment(page: Page) {
  const attachment = page.locator('affine-attachment');
  const loading = attachment.locator('.affine-attachment-loading');

  return {
    /**
     * Wait for the attachment upload to finish
     */
    waitLoading: () => loading.waitFor({ state: 'hidden' }),
    getName: () => attachment.locator('.affine-attachment-name').innerText(),
    getSize: () => attachment.locator('.affine-attachment-desc').innerText(),
    loading,
    attachment,
  };
}

test('can insert attachment from slash menu', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);

  page.evaluate(async () => {
    // Force fallback to input[type=file] in tests
    // See https://github.com/microsoft/playwright/issues/8850
    window.showOpenFilePicker = undefined;
  });

  await focusRichText(page);

  const slashMenu = page.locator(`.slash-menu`);
  await type(page, '/');
  await expect(slashMenu).toBeVisible();
  await type(page, 'file', 100);
  await expect(slashMenu).toBeVisible();

  await pressEnter(page);
  await page.setInputFiles(
    "input[type='file']",
    'packages/playground/public/test-card-1.png'
  );

  // Wait for the attachment to be uploaded
  const { waitLoading, getName, getSize } = getAttachment(page);
  await waitLoading();

  expect(await getName()).toBe('test-card-1.png');
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
    prop:name="test-card-1.png"
    prop:size={45801}
    prop:sourceId="ejImogf-Tb7AuKY-v94uz1zuOJbClqK-tWBxVr_ksGA="
    prop:type="image/png"
  />
</affine:note>`,
    noteId
  );
});
