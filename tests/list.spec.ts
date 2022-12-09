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
  pressShiftTab,
  undoByClick,
  undoByKeyboard,
  pressTab,
  initEmptyParagraphState,
} from './utils/actions';

test('add new bulleted list', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page, 0);
  await convertToBulletedListByClick(page);
  await page.keyboard.type('aa');
  await pressEnter(page);
  await page.keyboard.type('aa');
  await pressEnter(page);

  await assertRichTexts(page, ['aa', 'aa', '\n']);
  await assertBlockCount(page, 'list', 3);
});

test('convert to numbered list block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

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
  await page.keyboard.type('aa');
  await pressEnter(page); // created 4
  await assertBlockType(page, '4', 'numbered');

  await page.keyboard.type('aa');
  await pressEnter(page); // created 5
  await assertBlockType(page, '5', 'numbered');

  await page.keyboard.press('Tab');
  await assertBlockType(page, '6', 'numbered');
});

test('indent list block', async ({ page }) => {
  await enterPlaygroundWithList(page); // 0(1(2,3,4))

  await focusRichText(page, 1);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['\n', 'hello', '\n']);

  await page.keyboard.press('Tab'); // 0(1(2(5)4))
  await assertRichTexts(page, ['\n', 'hello', '\n']);
  await assertBlockChildrenIds(page, '1', ['2', '4']);
  await assertBlockChildrenIds(page, '2', ['5']);

  await undoByKeyboard(page); // 0(1(2,3,4))
  await assertBlockChildrenIds(page, '1', ['2', '3', '4']);
});

test('unindent list block', async ({ page }) => {
  await enterPlaygroundWithList(page); // 0(1(2,3,4))

  await focusRichText(page, 1);
  await page.keyboard.press('Tab'); // 0(1(2(5)4))

  await assertBlockChildrenIds(page, '1', ['2', '4']);
  await assertBlockChildrenIds(page, '2', ['5']);

  await pressShiftTab(page); // 0(1(2,6,4))
  await assertBlockChildrenIds(page, '1', ['2', '6', '4']);

  await pressShiftTab(page);
  await assertBlockChildrenIds(page, '1', ['2', '6', '4']);
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
    'affine:list',
    'affine:list',
    'affine:list',
    'affine:list',
  ]);
});

test('delete at start of list block', async ({ page }) => {
  await enterPlaygroundWithList(page);
  await focusRichText(page, 1);
  await page.keyboard.press('Backspace');
  await assertBlockChildrenFlavours(page, '1', [
    'affine:list',
    'affine:paragraph',
    'affine:list',
  ]);
  await assertSelection(page, 1, 0, 0);

  await undoByClick(page);
  await assertBlockChildrenFlavours(page, '1', [
    'affine:list',
    'affine:list',
    'affine:list',
  ]);
  await assertSelection(page, 1, 0, 0);
});

test('nested list blocks', async ({ page }) => {
  await enterPlaygroundWithList(page);

  await focusRichText(page, 0);
  await page.keyboard.type('123');

  await focusRichText(page, 1);
  await pressTab(page);
  await page.keyboard.type('456');

  await focusRichText(page, 2);
  await pressTab(page);
  await pressTab(page);
  await page.keyboard.type('789');

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:group
    prop:xywh="[0,0,720,96]"
  >
    <affine:list
      prop:checked={false}
      prop:text="123"
      prop:type="bulleted"
    >
      <affine:list
        prop:checked={false}
        prop:text="456"
        prop:type="bulleted"
      >
        <affine:list
          prop:checked={false}
          prop:text="789"
          prop:type="bulleted"
        />
      </affine:list>
    </affine:list>
  </affine:group>
</affine:page>`
  );

  await focusRichText(page, 1);
  await pressShiftTab(page);

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:group
    prop:xywh="[0,0,720,96]"
  >
    <affine:list
      prop:checked={false}
      prop:text="123"
      prop:type="bulleted"
    />
    <affine:list
      prop:checked={false}
      prop:text="456"
      prop:type="bulleted"
    >
      <affine:list
        prop:checked={false}
        prop:text="789"
        prop:type="bulleted"
      />
    </affine:list>
  </affine:group>
</affine:page>`
  );
});

test('basic indent and unindent', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await page.keyboard.type('text1');
  await pressEnter(page);
  await page.keyboard.type('text2');

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:group
    prop:xywh="[0,0,720,72]"
  >
    <affine:paragraph
      prop:text="text1"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="text2"
      prop:type="text"
    />
  </affine:group>
</affine:page>`
  );

  await page.keyboard.press('Tab');
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:group
    prop:xywh="[0,0,720,72]"
  >
    <affine:paragraph
      prop:text="text1"
      prop:type="text"
    >
      <affine:paragraph
        prop:text="text2"
        prop:type="text"
      />
    </affine:paragraph>
  </affine:group>
</affine:page>`
  );

  await pressShiftTab(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:group
    prop:xywh="[0,0,720,72]"
  >
    <affine:paragraph
      prop:text="text1"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="text2"
      prop:type="text"
    />
  </affine:group>
</affine:page>`
  );
});

test('enter list block with empty text', async ({ page }) => {
  await enterPlaygroundWithList(page); // 0(1(2,3,4))

  await focusRichText(page, 1);
  await pressTab(page);
  await focusRichText(page, 2);
  await pressTab(page);
  await assertBlockChildrenIds(page, '2', ['5', '6']); // 0(1(2,(5,6)))

  await focusRichText(page, 2);
  await pressEnter(page);
  await assertBlockChildrenIds(page, '2', ['5']);
  await assertBlockType(page, '7', 'bulleted');

  await pressEnter(page);
  await assertBlockType(page, '8', 'text');
  await undoByClick(page);
  await undoByClick(page);
  await assertBlockChildrenIds(page, '2', ['5', '6']); // 0(1(2,(5,6)))

  await focusRichText(page, 1);
  await pressEnter(page);
  await assertBlockChildrenIds(page, '2', ['5', '9', '6']);
  await undoByClick(page);
  await assertBlockChildrenIds(page, '2', ['5', '6']); // 0(1(2,(5,6)))

  await focusRichText(page, 0);
  await pressEnter(page);
  await assertBlockChildrenIds(page, '2', ['10', '5', '6']);
  await undoByClick(page);
  await assertBlockChildrenIds(page, '2', ['5', '6']); // 0(1(2,(5,6)))
});

test('enter list block with non-empty text', async ({ page }) => {
  await enterPlaygroundWithList(page); // 0(1(2,3,4))

  await focusRichText(page, 0);
  await page.keyboard.type('aa');
  await focusRichText(page, 1);
  await page.keyboard.type('bb');
  await pressTab(page);
  await focusRichText(page, 2);
  await page.keyboard.type('cc');
  await pressTab(page);
  await assertBlockChildrenIds(page, '2', ['5', '6']); // 0(1(2,(5,6)))

  await focusRichText(page, 1);
  await pressEnter(page);
  await assertBlockChildrenIds(page, '2', ['5', '7', '6']);
  await undoByClick(page);
  await assertBlockChildrenIds(page, '2', ['5', '6']); // 0(1(2,(5,6)))

  await focusRichText(page, 0);
  await pressEnter(page);
  await assertBlockChildrenIds(page, '2', ['8', '5', '6']);
  await undoByClick(page);
  await assertBlockChildrenIds(page, '2', ['5', '6']); // 0(1(2,(5,6)))
});
