import { test } from '@playwright/test';
import {
  assertBlockChildrenFlavours,
  assertBlockChildrenIds,
  assertBlockCount,
  assertBlockType,
  assertRichTexts,
  assertSelection,
  assertStoreMatchJSX,
  assertTextContent,
} from './utils/asserts';
import {
  convertToBulletedListByClick,
  convertToNumberedListByClick,
  enterPlaygroundRoom,
  enterPlaygroundWithList,
  focusRichText,
  pressEnter,
  redoByClick,
  shiftTab,
  undoByClick,
  undoByKeyboard,
} from './utils/actions';

test('add new bulleted list', async ({ page }) => {
  await enterPlaygroundRoom(page);

  await focusRichText(page, 0);
  await convertToBulletedListByClick(page);
  await pressEnter(page);
  await pressEnter(page);

  await assertRichTexts(page, ['\n', '\n', '\n']);
  await assertBlockCount(page, 'list', 3);
});

test('convert to numbered list block', async ({ page }) => {
  await enterPlaygroundRoom(page);

  await focusRichText(page, 0); // created 0, 1, 2
  await convertToBulletedListByClick(page); // replaced 2 to 3
  await convertToNumberedListByClick(page);
  await focusRichText(page, 0);

  const listSelector = '.affine-list-rich-text-wrapper';
  const bulletIconSelector = `${listSelector} > div`;
  await assertTextContent(page, bulletIconSelector, /1 \./);

  await undoByClick(page);
  // const numberIconSelector = `${listSelector} > svg`;
  // await expect(page.locator(numberIconSelector)).toHaveCount(1);

  await redoByClick(page);
  await focusRichText(page, 0);
  await pressEnter(page); // created 4
  await assertBlockType(page, '4', 'numbered');

  await pressEnter(page); // created 5
  await assertBlockType(page, '5', 'numbered');

  await page.keyboard.press('Tab');
  await assertBlockType(page, '5', 'numbered');
});

test('indent list block', async ({ page }) => {
  await enterPlaygroundWithList(page); // 0(1(2,3,4))

  await focusRichText(page, 1);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['\n', 'hello', '\n']);

  await page.keyboard.press('Tab'); // 0(1(2(3)4))
  await assertRichTexts(page, ['\n', 'hello', '\n']);
  await assertBlockChildrenIds(page, '1', ['2', '4']);
  await assertBlockChildrenIds(page, '2', ['3']);

  await undoByKeyboard(page); // 0(1(2,3,4))
  await assertBlockChildrenIds(page, '1', ['2', '3', '4']);
});

test('unindent list block', async ({ page }) => {
  await enterPlaygroundWithList(page); // 0(1(2,3,4))

  await focusRichText(page, 1);
  await page.keyboard.press('Tab'); // 0(1(2(3)4))

  await assertBlockChildrenIds(page, '1', ['2', '4']);
  await assertBlockChildrenIds(page, '2', ['3']);

  await shiftTab(page); // 0(1(2,3,4))
  await assertBlockChildrenIds(page, '1', ['2', '3', '4']);

  await shiftTab(page);
  await assertBlockChildrenIds(page, '1', ['2', '3', '4']);
});

test('insert new list block by enter', async ({ page }) => {
  await enterPlaygroundWithList(page);
  await assertRichTexts(page, ['\n', '\n', '\n']);

  await focusRichText(page, 1);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['\n', 'hello', '\n']);

  await pressEnter(page);
  await page.keyboard.type('world');
  await assertRichTexts(page, ['\n', 'hello', 'world', '\n']);
  await assertBlockChildrenFlavours(page, '1', [
    'list',
    'list',
    'list',
    'list',
  ]);
});

test('delete at start of list block', async ({ page }) => {
  await enterPlaygroundWithList(page);
  await focusRichText(page, 1);
  await page.keyboard.press('Backspace');
  await assertBlockChildrenFlavours(page, '1', ['list', 'paragraph', 'list']);
  await assertSelection(page, 1, 0, 0);

  await undoByClick(page);
  await assertBlockChildrenFlavours(page, '1', ['list', 'list', 'list']);
  await assertSelection(page, 1, 0, 0);
});

test('nested list blocks', async ({ page }) => {
  await enterPlaygroundWithList(page);

  await focusRichText(page, 0);
  await page.keyboard.type('123');

  await focusRichText(page, 1);
  await page.keyboard.press('Tab');
  await page.keyboard.type('456');

  await focusRichText(page, 2);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.type('789');

  await assertRichTexts(page, ['123', '456', '789']);
  await assertBlockChildrenIds(page, '0', ['1']);
  await assertBlockChildrenIds(page, '1', ['2']);
  await assertBlockChildrenIds(page, '2', ['3']);
  await assertBlockChildrenIds(page, '3', ['4']);

  await focusRichText(page, 1);
  await shiftTab(page);

  await assertRichTexts(page, ['123', '456', '789']);
  await assertBlockChildrenIds(page, '1', ['2', '3']);
  await assertBlockChildrenIds(page, '3', ['4']);
});

test('list autofill hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);

  await focusRichText(page, 0);
  await assertBlockType(page, '2', 'text');

  await page.keyboard.type('1. ');
  await assertBlockType(page, '3', 'numbered'); // id updated
  await assertRichTexts(page, ['\n']);

  await undoByClick(page);
  await assertBlockType(page, '2', 'text');
  await assertRichTexts(page, ['\n']);

  await page.keyboard.type('* ');
  await assertBlockType(page, '4', 'bulleted'); // id updated
  await assertRichTexts(page, ['\n']);
});

test('basic indent and unindent', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);

  await page.keyboard.type('text1');
  await pressEnter(page);
  await page.keyboard.type('text2');

  await assertStoreMatchJSX(
    page,
    `<page>
  <group
    prop:xywh="[0,0,300,50]"
  >
    <paragraph
      prop:text="text1"
      prop:type="text"
    />
    <paragraph
      prop:text="text2"
      prop:type="text"
    />
  </group>
</page>`
  );
  await page.keyboard.press('Tab');
  await assertStoreMatchJSX(
    page,
    `<page>
  <group
    prop:xywh="[0,0,300,50]"
  >
    <paragraph
      prop:text="text1"
      prop:type="text"
    >
      <paragraph
        prop:text="text2"
        prop:type="text"
      />
    </paragraph>
  </group>
</page>`
  );
  await shiftTab(page);
  await assertStoreMatchJSX(
    page,
    `<page>
  <group
    prop:xywh="[0,0,300,50]"
  >
    <paragraph
      prop:text="text1"
      prop:type="text"
    />
    <paragraph
      prop:text="text2"
      prop:type="text"
    />
  </group>
</page>`
  );
});
