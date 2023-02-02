import { expect, test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  initEmptyDatabaseState,
} from './utils/actions/index.js';
import { assertStoreMatchJSX } from './utils/asserts.js';

test('init database block', async ({ page }) => {
  await enterPlaygroundRoom(page, {
    enable_database: true,
  });
  await initEmptyDatabaseState(page);

  const locator = page.locator('affine-database');
  await expect(locator).toBeVisible();
  const databaseTitle = page.locator('.affine-database-block-title');
  await databaseTitle.clear();
  const expected = 'hello';
  await databaseTitle.type(expected);
  await assertStoreMatchJSX(
    page,
    `
<affine:page
  prop:title=""
>
  <affine:frame
    prop:xywh="[0,0,720,117]"
  >
    <affine:database
      prop:columns={Array []}
      prop:mode={2}
      prop:title="${expected}"
    />
  </affine:frame>
</affine:page>`
  );
});
