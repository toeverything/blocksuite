import {
  clickBlockTypeMenuItem,
  enterPlaygroundRoom,
  enterPlaygroundWithList,
  focusRichText,
  initEmptyParagraphState,
  pressEnter,
  pressShiftTab,
  pressSpace,
  pressTab,
  redoByClick,
  type,
  undoByClick,
  undoByKeyboard,
} from './utils/actions/index.js';
import {
  assertBlockChildrenFlavours,
  assertBlockChildrenIds,
  assertBlockCount,
  assertBlockType,
  assertRichTexts,
  assertSelection,
  assertStoreMatchJSX,
  assertTextContent,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

test('add new bulleted list', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page, 0);
  await clickBlockTypeMenuItem(page, 'Bulleted List');
  await type(page, 'aa');
  await pressEnter(page);
  await type(page, 'aa');
  await pressEnter(page);

  await assertRichTexts(page, ['aa', 'aa', '']);
  await assertBlockCount(page, 'list', 3);
});

test('add new toggle list', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page, 0);
  await clickBlockTypeMenuItem(page, 'Toggle List');
  await type(page, 'top');
  await pressTab(page);
  await pressEnter(page);
  await type(page, 'kid 1');
  await pressEnter(page);

  await assertRichTexts(page, ['top', 'kid 1', '']);
  await assertBlockCount(page, 'list', 3);
});

test('convert to numbered list block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page, 0); // created 0, 1, 2
  await clickBlockTypeMenuItem(page, 'Bulleted List'); // replaced 2 to 3
  await clickBlockTypeMenuItem(page, 'Numbered List');
  await focusRichText(page, 0);

  const listSelector = '.affine-list-rich-text-wrapper';
  const bulletIconSelector = `${listSelector} > div`;
  await assertTextContent(page, bulletIconSelector, /1 \./);

  await undoByClick(page);
  // const numberIconSelector = `${listSelector} > svg`;
  // await expect(page.locator(numberIconSelector)).toHaveCount(1);

  await redoByClick(page);
  await focusRichText(page, 0);
  await type(page, 'aa');
  await pressEnter(page); // created 4
  await assertBlockType(page, '4', 'numbered');

  await type(page, 'aa');
  await pressEnter(page); // created 5
  await assertBlockType(page, '5', 'numbered');

  await page.keyboard.press('Tab');
  await assertBlockType(page, '5', 'numbered');
});

test('indent list block', async ({ page }) => {
  await enterPlaygroundWithList(page); // 0(1(2,3,4))

  await focusRichText(page, 1);
  await type(page, 'hello');
  await assertRichTexts(page, ['', 'hello', '']);

  await page.keyboard.press('Tab'); // 0(1(2(3)4))
  await assertRichTexts(page, ['', 'hello', '']);
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

  await pressShiftTab(page); // 0(1(2,3,4))
  await assertBlockChildrenIds(page, '1', ['2', '3', '4']);

  await pressShiftTab(page);
  await assertBlockChildrenIds(page, '1', ['2', '3', '4']);
});

test('insert new list block by enter', async ({ page }) => {
  await enterPlaygroundWithList(page);
  await assertRichTexts(page, ['', '', '']);

  await focusRichText(page, 1);
  await type(page, 'hello');
  await assertRichTexts(page, ['', 'hello', '']);

  await pressEnter(page);
  await type(page, 'world');
  await assertRichTexts(page, ['', 'hello', 'world', '']);
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
  await type(page, '123');

  await focusRichText(page, 1);
  await pressTab(page);
  await type(page, '456');

  await focusRichText(page, 2);
  await pressTab(page);
  await pressTab(page);
  await type(page, '789');

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame>
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
  </affine:frame>
</affine:page>`
  );

  await focusRichText(page, 1);
  await pressShiftTab(page);

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame>
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
  </affine:frame>
</affine:page>`
  );
});

test('basic indent and unindent', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, 'text1');
  await pressEnter(page);
  await type(page, 'text2');

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame>
    <affine:paragraph
      prop:text="text1"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="text2"
      prop:type="text"
    />
  </affine:frame>
</affine:page>`
  );

  await page.keyboard.press('Tab');
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame>
    <affine:paragraph
      prop:text="text1"
      prop:type="text"
    >
      <affine:paragraph
        prop:text="text2"
        prop:type="text"
      />
    </affine:paragraph>
  </affine:frame>
</affine:page>`
  );

  await page.waitForTimeout(100);
  await pressShiftTab(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:frame>
    <affine:paragraph
      prop:text="text1"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="text2"
      prop:type="text"
    />
  </affine:frame>
</affine:page>`
  );
});

test('should indent todo block preserve todo status', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { frameId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'text1');
  await pressEnter(page);

  await type(page, '[x]');
  await pressSpace(page);

  await type(page, 'todo item');
  await pressTab(page);
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
  <affine:paragraph
    prop:text="text1"
    prop:type="text"
  >
    <affine:list
      prop:checked={true}
      prop:text="todo item"
      prop:type="todo"
    />
  </affine:paragraph>
</affine:frame>`,
    frameId
  );
  await pressShiftTab(page);
  await assertStoreMatchJSX(
    page,
    `
<affine:frame>
  <affine:paragraph
    prop:text="text1"
    prop:type="text"
  />
  <affine:list
    prop:checked={true}
    prop:text="todo item"
    prop:type="todo"
  />
</affine:frame>`,
    frameId
  );
});

test('enter list block with empty text', async ({ page }) => {
  await enterPlaygroundWithList(page); // 0(1(2,3,4))

  await focusRichText(page, 1);
  await pressTab(page);
  await focusRichText(page, 2);
  await pressTab(page);
  await assertBlockChildrenIds(page, '2', ['3', '4']); // 0(1(2,(3,4)))

  await focusRichText(page, 2);
  await pressEnter(page);
  await assertBlockChildrenIds(page, '2', ['3']);
  await assertBlockType(page, '4', 'bulleted');

  await pressEnter(page);
  await assertBlockType(page, '5', 'text');
  await undoByClick(page);
  await undoByClick(page);
  await assertBlockChildrenIds(page, '2', ['3', '4']); // 0(1(2,(3,4)))

  await focusRichText(page, 1);
  await pressEnter(page);
  await assertBlockChildrenIds(page, '2', ['3', '6', '4']);
  await undoByClick(page);
  await assertBlockChildrenIds(page, '2', ['3', '4']); // 0(1(2,(3,4)))

  await focusRichText(page, 0);
  await pressEnter(page);
  await assertBlockChildrenIds(page, '2', ['7', '3', '4']);
  await undoByClick(page);
  await assertBlockChildrenIds(page, '2', ['3', '4']); // 0(1(2,(3,4)))
});

test('enter list block with non-empty text', async ({ page }) => {
  await enterPlaygroundWithList(page); // 0(1(2,3,4))

  await focusRichText(page, 0);
  await type(page, 'aa');
  await focusRichText(page, 1);
  await type(page, 'bb');
  await pressTab(page);
  await focusRichText(page, 2);
  await type(page, 'cc');
  await pressTab(page);
  await assertBlockChildrenIds(page, '2', ['3', '4']); // 0(1(2,(3,4)))

  await focusRichText(page, 1);
  await pressEnter(page);
  await assertBlockChildrenIds(page, '2', ['3', '5', '4']);
  await undoByClick(page);
  await assertBlockChildrenIds(page, '2', ['3', '4']); // 0(1(2,(3,4)))

  await focusRichText(page, 0);
  await pressEnter(page);
  await assertBlockChildrenIds(page, '2', ['6', '3', '4']);
  await undoByClick(page);
  await assertBlockChildrenIds(page, '2', ['3', '4']); // 0(1(2,(3,4)))
});
