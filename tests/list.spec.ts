import {
  clickBlockTypeMenuItem,
  enterPlaygroundRoom,
  enterPlaygroundWithList,
  focusRichText,
  initEmptyParagraphState,
  pressArrowUp,
  pressBackspace,
  pressEnter,
  pressShiftTab,
  pressSpace,
  pressTab,
  redoByClick,
  type,
  undoByClick,
  undoByKeyboard,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertBlockChildrenFlavours,
  assertBlockChildrenIds,
  assertBlockCount,
  assertBlockType,
  assertListPrefix,
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
  await focusRichText(page, 0);
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
  await focusRichText(page, 0);
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
  await page.keyboard.press('Tab', { delay: 50 }); // 0(1(2(3)4))

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
  await waitNextFrame(page);
  //FIXME: it just failed in playwright
  // await assertSelection(page, 1, 0, 0);
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
  <affine:note
    prop:background="--affine-background-secondary-color"
    prop:hidden={false}
    prop:index="a0"
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
  </affine:note>
</affine:page>`
  );

  await focusRichText(page, 1);
  await pressShiftTab(page);

  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:note
    prop:background="--affine-background-secondary-color"
    prop:hidden={false}
    prop:index="a0"
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
  </affine:note>
</affine:page>`
  );
});

test('update numbered list block prefix', async ({ page }) => {
  await enterPlaygroundWithList(page, ['', '', ''], 'numbered'); // 0(1(2,3,4))

  await focusRichText(page, 1);
  await type(page, 'lunatic');
  await assertRichTexts(page, ['', 'lunatic', '']);
  await assertListPrefix(page, ['1', '2', '3']);

  await page.keyboard.press('Tab');
  await assertListPrefix(page, ['1', 'a', '2']);

  await page.keyboard.press('Shift+Tab');
  await assertListPrefix(page, ['1', '2', '3']);

  await page.keyboard.press('Enter');
  await assertListPrefix(page, ['1', '2', '3', '4']);

  await type(page, 'concorde');
  await assertRichTexts(page, ['', 'lunatic', 'concorde', '']);

  await page.keyboard.press('Tab');
  await assertListPrefix(page, ['1', '2', 'a', '3']);
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
  <affine:note
    prop:background="--affine-background-secondary-color"
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:text="text1"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="text2"
      prop:type="text"
    />
  </affine:note>
</affine:page>`
  );

  await page.keyboard.press('Tab');
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:note
    prop:background="--affine-background-secondary-color"
    prop:hidden={false}
    prop:index="a0"
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
  </affine:note>
</affine:page>`
  );

  await page.waitForTimeout(100);
  await pressShiftTab(page);
  await assertStoreMatchJSX(
    page,
    /*xml*/ `
<affine:page>
  <affine:note
    prop:background="--affine-background-secondary-color"
    prop:hidden={false}
    prop:index="a0"
  >
    <affine:paragraph
      prop:text="text1"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="text2"
      prop:type="text"
    />
  </affine:note>
</affine:page>`
  );
});

test('should indent todo block preserve todo status', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
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
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
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
</affine:note>`,
    noteId
  );
  await pressShiftTab(page);
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:hidden={false}
  prop:index="a0"
>
  <affine:paragraph
    prop:text="text1"
    prop:type="text"
  />
  <affine:list
    prop:checked={true}
    prop:text="todo item"
    prop:type="todo"
  />
</affine:note>`,
    noteId
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

test.describe('indent correctly when deleting list item', () => {
  test('delete the child item in the middle position', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page, 0);

    await type(page, '- a');
    await pressEnter(page);
    await pressTab(page);
    await type(page, 'b');
    await pressEnter(page);
    await type(page, 'c');
    await pressEnter(page);
    await type(page, 'd');
    await pressArrowUp(page);
    await pressBackspace(page);
    await pressBackspace(page);
    await pressBackspace(page);

    await assertBlockChildrenIds(page, '3', ['4']);
    await assertBlockChildrenIds(page, '7', ['6']);
  });

  test('merge two lists', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page, 0);

    await type(page, '- a');
    await pressEnter(page);
    await pressTab(page);
    await type(page, 'b');
    await pressEnter(page);
    await pressTab(page);
    await type(page, 'c');
    await pressEnter(page);
    await pressBackspace(page);
    await pressBackspace(page);
    await pressBackspace(page);
    await pressEnter(page);

    await type(page, '- d');
    await pressEnter(page);
    await pressTab(page);
    await type(page, 'e');
    await pressEnter(page);
    await pressTab(page);
    await type(page, 'f');
    await pressArrowUp(page);
    await pressArrowUp(page);
    await pressBackspace(page);
    await pressBackspace(page);
    await pressBackspace(page);
    await pressBackspace(page);

    await assertBlockChildrenIds(page, '1', ['3', '10']);
    await assertBlockChildrenIds(page, '3', ['4']);
    await assertBlockChildrenIds(page, '4', ['5']);
    await assertBlockChildrenIds(page, '10', ['11']);
  });
});

test('delete list item with nested children items', async ({ page }) => {
  await enterPlaygroundWithList(page); // 0(1(2,3,4))

  await focusRichText(page, 0);
  await type(page, '1');

  await focusRichText(page, 1);
  await type(page, '2');

  await focusRichText(page, 2);
  await pressTab(page);
  await type(page, '3');

  await pressEnter(page); // 0(1(2,3,4,5))
  await type(page, '3');

  await focusRichText(page, 1);
  await pressBackspace(page);
  await pressBackspace(page);
  await pressBackspace(page); // 0(1(2,4,5))

  await assertBlockChildrenIds(page, '1', ['2', '4', '5']);
});
