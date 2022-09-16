import { test, expect } from '@playwright/test';
import type { SerializedStore } from '../packages/framework';
import { enterPlaygroundRoom, emptyInput, richTextBox } from './utils/actions';
import { assertStore, assertText } from './utils/asserts';

test('basic input', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await page.click(emptyInput);
  await page.keyboard.type('hello');

  const expected: SerializedStore = {
    blocks: { '1': { type: 'text', id: '1', text: 'hello' } },
  };

  await expect(page).toHaveTitle(/Building Blocks/);
  await assertStore(page, expected);
  await assertText(page, 'hello');
});

test('basic multi user state', async ({ browser, page: pageA }) => {
  const room = await enterPlaygroundRoom(pageA);
  await pageA.click(emptyInput);
  await pageA.keyboard.type('hello');

  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, room);

  const expected: SerializedStore = {
    blocks: { '1': { type: 'text', id: '1', text: 'hello' } },
  };
  // wait until pageB content updated
  await assertText(pageB, 'hello');
  await Promise.all([
    assertText(pageA, 'hello'),
    assertStore(pageA, expected),
    assertStore(pageB, expected),
  ]);
});

test('A first init, B first edit', async ({ browser, page: pageA }) => {
  const room = await enterPlaygroundRoom(pageA);
  await pageA.click(emptyInput); // first init

  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, room);
  await pageB.type(richTextBox, 'hello');

  const expected: SerializedStore = {
    blocks: { '1': { type: 'text', id: '1', text: 'hello' } },
  };
  // wait until pageA content updated
  await assertText(pageA, 'hello');
  await Promise.all([
    assertText(pageB, 'hello'),
    assertStore(pageA, expected),
    assertStore(pageB, expected),
  ]);
});

test('conflict occurs as expected when two same id generated together', async ({
  browser,
  page: pageA,
}) => {
  test.fail();

  const room = await enterPlaygroundRoom(pageA);
  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, room);

  // click together, both init with default id leads to conflicts
  await Promise.all([pageB.click(emptyInput), pageA.click(emptyInput)]);
  await pageB.keyboard.type('hello');

  await assertText(pageB, 'hello');
  await assertText(pageA, 'hello'); // actually '\n'
});
