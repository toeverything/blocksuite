import { expect, test } from '@playwright/test';
import {
  dragBetweenIndices,
  enterPlaygroundRoom,
  initEmptyState,
  initThreeParagraphs,
} from './utils/actions';
import { assertStoreMatchJSX } from './utils/asserts';

test('should format quick bar show when select text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await initThreeParagraphs(page);
  await dragBetweenIndices(page, [0, 0], [2, 3]);
  const formatQuickBarLocator = page.locator(`.format-quick-bar`);
  expect(await formatQuickBarLocator.isVisible()).toBe(true);
});

test('should format quick bar can format text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { groupId } = await initEmptyState(page);
  await initThreeParagraphs(page);
  // drag only the `456` paragraph
  await dragBetweenIndices(page, [1, 0], [1, 3]);

  const boldBtnLocator = page.locator(`[data-testid=bold]`);
  await expect(boldBtnLocator).not.toHaveAttribute('active', '');
  await boldBtnLocator.click();
  // The bold button should be active after click
  expect(boldBtnLocator).toHaveAttribute('active', '');
  await assertStoreMatchJSX(
    page,
    `<affine:group
  prop:xywh="[0,0,720,112]"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={true}
          insert="456"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:group>`,
    groupId
  );
  await boldBtnLocator.click();

  // The bold button should be inactive after click again
  await expect(boldBtnLocator).not.toHaveAttribute('active', '');
  await assertStoreMatchJSX(
    page,
    `<affine:group
  prop:xywh="[0,0,720,112]"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={false}
          insert="456"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text="789"
    prop:type="text"
  />
</affine:group>`,
    groupId
  );
});

test('should format quick bar can format text when select multiple line', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  const { groupId } = await initEmptyState(page);
  await initThreeParagraphs(page);
  await dragBetweenIndices(page, [0, 0], [2, 3]);

  const boldBtnLocator = page.locator(`[data-testid=bold]`);
  await expect(boldBtnLocator).not.toHaveAttribute('active', '');
  await boldBtnLocator.click();
  // The bold button should be active after click
  expect(boldBtnLocator).toHaveAttribute('active', '');
  await assertStoreMatchJSX(
    page,
    `<affine:group
  prop:xywh="[0,0,720,112]"
>
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={true}
          insert="123"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={true}
          insert="456"
        />
      </>
    }
    prop:type="text"
  />
  <affine:paragraph
    prop:text={
      <>
        <text
          bold={true}
          insert="789"
        />
      </>
    }
    prop:type="text"
  />
</affine:group>`,
    groupId
  );

  // TODO FIXME: The bold button should be inactive after click again
  // await boldBtnLocator.click();
  // await assertStoreMatchJSX(page, ``, groupId);
});
