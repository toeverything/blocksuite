import { test, expect } from '@playwright/test';
import type { SerializedStore } from '../packages/core';
import {
  richTextBox,
  emptyInput,
  assertStore,
  assertText,
  all,
  enterPlaygroundRoom,
} from './utils';

test('basic input', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await page.click(emptyInput);
  await page.type(richTextBox, 'hello');

  const expected: SerializedStore = {
    blocks: { '1': { type: 'text', id: '1', parentId: '0', text: 'hello' } },
    parentMap: { '1': '0' },
  };

  await expect(page).toHaveTitle(/Building Blocks/);
  await assertStore(page, expected);
  await assertText(page, 'hello');
});

test('basic multi user state', async ({ browser, page: pageA }) => {
  const room = await enterPlaygroundRoom(pageA);
  await pageA.click(emptyInput);
  await pageA.type(richTextBox, 'hello');

  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, room);

  const expected: SerializedStore = {
    blocks: { '1': { type: 'text', id: '1', parentId: '0', text: 'hello' } },
    parentMap: { '1': '0' },
  };
  // wait until pageB content updated
  await assertText(pageB, 'hello');
  await all([
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
    blocks: { '1': { type: 'text', id: '1', parentId: '0', text: 'hello' } },
    parentMap: { '1': '0' },
  };
  // wait until pageA content updated
  await assertText(pageA, 'hello');
  await all([
    assertText(pageB, 'hello'),
    assertStore(pageA, expected),
    assertStore(pageB, expected),
  ]);
});
