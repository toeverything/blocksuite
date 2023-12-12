import { expect } from '@playwright/test';

import { addNote, switchEditorMode } from './utils/actions/edgeless.js';
import {
  pressBackspace,
  pressEnter,
  redoByKeyboard,
  SHORT_KEY,
  type,
  undoByKeyboard,
  withPressKey,
} from './utils/actions/keyboard.js';
import {
  captureHistory,
  enterPlaygroundRoom,
  focusRichText,
  getInlineSelectionText,
  getSelectionRect,
  initEmptyEdgelessState,
  initEmptyParagraphState,
  insertThreeLevelLists,
  waitNextFrame,
} from './utils/actions/misc.js';
import {
  assertAlmostEqual,
  assertBlockCount,
  assertRichTexts,
  assertStoreMatchJSX,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

test.describe('slash menu should show and hide correctly', () => {
  test.beforeEach(async ({ page }) => {
    await enterPlaygroundRoom(page);
  });

  test('slash menu should hide after click away', async ({ page }) => {
    const id = await initEmptyParagraphState(page);
    const paragraphId = id.paragraphId;
    const slashMenu = page.locator(`.slash-menu`);
    await focusRichText(page);
    await type(page, '/');
    await expect(slashMenu).toBeVisible();
    // Click outside should close slash menu
    await page.mouse.click(0, 50);
    await expect(slashMenu).not.toBeVisible();
    await assertStoreMatchJSX(
      page,
      `
<affine:paragraph
  prop:text="/"
  prop:type="text"
/>`,
      paragraphId
    );
  });

  test('slash menu should hide after input whitespace', async ({ page }) => {
    await initEmptyParagraphState(page);
    const slashMenu = page.locator(`.slash-menu`);
    await focusRichText(page);
    await type(page, '/');
    await expect(slashMenu).toBeVisible();
    await type(page, ' ');
    await expect(slashMenu).not.toBeVisible();
    await assertRichTexts(page, ['/ ']);
    await page.keyboard.press('Backspace');
    await expect(slashMenu).toBeVisible();
  });

  test('delete the slash symbol should close the slash menu', async ({
    page,
  }) => {
    const id = await initEmptyParagraphState(page);
    const paragraphId = id.paragraphId;
    const slashMenu = page.locator(`.slash-menu`);
    await focusRichText(page);
    await type(page, '/');
    await expect(slashMenu).toBeVisible();

    await waitNextFrame(page, 100);
    await pressBackspace(page);
    await expect(slashMenu).not.toBeVisible();
    await assertStoreMatchJSX(
      page,
      `
<affine:paragraph
  prop:type="text"
/>`,
      paragraphId
    );
  });

  test('typing something that does not match should close the slash menu', async ({
    page,
  }) => {
    await initEmptyParagraphState(page);
    const slashMenu = page.locator(`.slash-menu`);
    await focusRichText(page);
    await type(page, '/');
    await expect(slashMenu).toBeVisible();

    await type(page, '_');
    await expect(slashMenu).not.toBeVisible();
    await assertRichTexts(page, ['/_']);

    // And pressing backspace immediately should reappear the slash menu
    await pressBackspace(page);
    await expect(slashMenu).toBeVisible();

    await type(page, '__');
    await pressBackspace(page);
    await expect(slashMenu).not.toBeVisible();
  });

  test('pressing the slash key again should close the old slash menu and open new one', async ({
    page,
  }) => {
    await initEmptyParagraphState(page);
    const slashMenu = page.locator(`.slash-menu`);
    await focusRichText(page);
    await type(page, '/');
    await expect(slashMenu).toBeVisible();

    await type(page, '/');
    await expect(slashMenu).toBeVisible();
    await expect(slashMenu).toHaveCount(1);
    await assertRichTexts(page, ['//']);
  });

  test('pressing esc should close the slash menu', async ({ page }) => {
    await initEmptyParagraphState(page);
    const slashMenu = page.locator(`.slash-menu`);
    await focusRichText(page);
    await type(page, '/');
    await expect(slashMenu).toBeVisible();

    // You may need to press Esc twice in a real browser
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(slashMenu).not.toBeVisible();
    await assertRichTexts(page, ['/']);
  });

  test('should position slash menu correctly', async ({ page }) => {
    await initEmptyParagraphState(page);
    const slashMenu = page.locator(`.slash-menu`);
    await focusRichText(page);
    await type(page, '/');
    await expect(slashMenu).toBeVisible();

    const box = await slashMenu.boundingBox();
    if (!box) {
      throw new Error("slashMenu doesn't exist");
    }
    const rect = await getSelectionRect(page);
    const { x, y } = box;
    assertAlmostEqual(x - rect.x, 0, 10);
    assertAlmostEqual(y - rect.bottom, 5, 10);
  });

  test('should move up down with arrow key', async ({ page }) => {
    await initEmptyParagraphState(page);
    const slashMenu = page.locator(`.slash-menu`);
    await focusRichText(page);
    await type(page, '/');
    await expect(slashMenu).toBeVisible();

    await page.keyboard.press('ArrowDown');
    await expect(slashMenu).toBeVisible();

    const slashItems = slashMenu.locator('icon-button');
    const maybeActivatedItem = slashItems.nth(1);
    await expect(maybeActivatedItem).toHaveText(['Heading 1']);
    await expect(maybeActivatedItem).toHaveAttribute('hover', 'true');
    await assertRichTexts(page, ['/']);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await expect(slashMenu).toBeVisible();

    const maybeActivatedItem2 = slashItems.nth(2);
    await expect(maybeActivatedItem2).toHaveText(['Heading 2']);
    await expect(maybeActivatedItem2).toHaveAttribute('hover', 'true');
    await assertRichTexts(page, ['/']);
  });

  test('should move up down with ctrl/cmd+N and ctrl/cmd+N', async ({
    page,
  }) => {
    await initEmptyParagraphState(page);
    const slashMenu = page.locator(`.slash-menu`);
    await focusRichText(page);
    await type(page, '/');
    await expect(slashMenu).toBeVisible();

    page.keyboard.press(`${SHORT_KEY}+N`);
    await expect(slashMenu).toBeVisible();

    const slashItems = slashMenu.locator('icon-button');
    const maybeActivatedItem = slashItems.nth(1);
    await expect(maybeActivatedItem).toHaveText(['Heading 1']);
    await expect(maybeActivatedItem).toHaveAttribute('hover', 'true');
    await assertRichTexts(page, ['/']);

    page.keyboard.press(`${SHORT_KEY}+P`);
    await expect(slashMenu).toBeVisible();

    const maybeActivatedItem2 = slashItems.nth(0);
    await expect(maybeActivatedItem2).toHaveText(['Text']);
    await expect(maybeActivatedItem2).toHaveAttribute('hover', 'true');
    await assertRichTexts(page, ['/']);
  });

  test('should allow only pressing modifier key', async ({ page }) => {
    await initEmptyParagraphState(page);
    const slashMenu = page.locator(`.slash-menu`);
    await focusRichText(page);
    await type(page, '/');
    await expect(slashMenu).toBeVisible();

    page.keyboard.press(SHORT_KEY);
    await expect(slashMenu).toBeVisible();

    page.keyboard.press('Shift');
    await expect(slashMenu).toBeVisible();
  });

  test('should allow other hotkey to passthrough', async ({ page }) => {
    await initEmptyParagraphState(page);
    const slashMenu = page.locator(`.slash-menu`);
    await focusRichText(page);
    await type(page, '/');
    await expect(slashMenu).toBeVisible();

    page.keyboard.press(`${SHORT_KEY}+A`);
    await expect(slashMenu).not.toBeVisible();
    await assertRichTexts(page, ['/']);

    const selected = await getInlineSelectionText(page);
    expect(selected).toBe('/');
  });

  test('left arrow should active left panel', async ({ page }) => {
    await initEmptyParagraphState(page);
    const slashMenu = page.locator(`.slash-menu`);
    await focusRichText(page);
    await type(page, '/');
    await expect(slashMenu).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowRight');
    await expect(slashMenu).toBeVisible();

    const slashItems = slashMenu.locator('icon-button');
    const maybeActivatedItem = slashItems.nth(-5);
    await expect(maybeActivatedItem).toHaveText(['Move Up']);
    await expect(maybeActivatedItem).toHaveAttribute('hover', 'true');
    await assertRichTexts(page, ['/']);
  });

  test('press tab should move up and down', async ({ page }) => {
    await initEmptyParagraphState(page);
    const slashMenu = page.locator(`.slash-menu`);
    await focusRichText(page);
    await type(page, '/');
    await expect(slashMenu).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(slashMenu).toBeVisible();

    const slashItems = slashMenu.locator('icon-button');
    const slashItem0 = slashItems.nth(0);
    const slashItem1 = slashItems.nth(1);
    await expect(slashItem0).toHaveAttribute('hover', 'false');
    await expect(slashItem1).toHaveAttribute('hover', 'true');

    await assertRichTexts(page, ['/']);
    await withPressKey(page, 'Shift', () => page.keyboard.press('Tab'));
    await expect(slashMenu).toBeVisible();
    await expect(slashItem0).toHaveAttribute('hover', 'true');
    await expect(slashItem1).toHaveAttribute('hover', 'false');
  });

  test('can input search input after click menu', async ({ page }) => {
    await initEmptyParagraphState(page);
    const slashMenu = page.locator(`.slash-menu`);
    await focusRichText(page);
    await type(page, '/');
    await expect(slashMenu).toBeVisible();

    const box = await slashMenu.boundingBox();
    if (!box) {
      throw new Error("slashMenu doesn't exist");
    }
    const { x, y, height } = box;
    await page.mouse.click(x + 10, y + height - 10);
    await type(page, 'a');
    await assertRichTexts(page, ['/a']);
  });
});

test('should slash menu works with fast type', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, 'a/text', 10);
  const slashMenu = page.locator(`.slash-menu`);
  await expect(slashMenu).toBeVisible();
});

test('should clean slash string after soft enter', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/1126',
  });
  await enterPlaygroundRoom(page);
  const { paragraphId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await page.keyboard.press('Shift+Enter', { delay: 50 });
  await waitNextFrame(page);
  await type(page, '/copy');
  await pressEnter(page);

  await assertStoreMatchJSX(
    page,
    `
  <affine:paragraph
  prop:text="hello\n"
  prop:type="text"
/>`,
    paragraphId
  );
});

test.describe('slash search', () => {
  test('should slash menu search and keyboard works', async ({ page }) => {
    await enterPlaygroundRoom(page);
    const { noteId } = await initEmptyParagraphState(page);
    await focusRichText(page);
    const slashMenu = page.locator(`.slash-menu`);
    const slashItems = slashMenu.locator('icon-button');

    await type(page, '/');
    await expect(slashMenu).toBeVisible();
    // Update the snapshot if you add new slash commands
    await type(page, 'todo');
    await expect(slashItems).toHaveCount(1);
    await expect(slashItems).toHaveText(['To-do List']);
    await page.keyboard.press('Enter');
    await assertStoreMatchJSX(
      page,
      `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:edgeless={
    Object {
      "style": Object {
        "borderRadius": 8,
        "borderSize": 4,
        "borderStyle": "solid",
        "shadowType": "--affine-note-shadow-box",
      },
    }
  }
  prop:hidden={false}
  prop:index="a0"
>
  <affine:list
    prop:checked={false}
    prop:collapsed={false}
    prop:type="todo"
  />
</affine:note>`,
      noteId
    );

    await type(page, '/');
    await expect(slashMenu).toBeVisible();
    // first item should be selected by default
    await expect(slashItems.first()).toHaveAttribute('hover', 'true');

    // assert keyboard navigation works
    await page.keyboard.press('ArrowDown');
    await expect(slashItems.first()).toHaveAttribute('hover', 'false');
    await expect(slashItems.nth(1)).toHaveAttribute('hover', 'true');

    // search should reset the active item
    await type(page, 'co');
    await expect(slashItems).toHaveCount(2);
    await expect(slashItems).toHaveText(['Code Block', 'Copy']);
    await expect(slashItems.first()).toHaveAttribute('hover', 'true');
    await type(page, 'p');
    await expect(slashItems).toHaveCount(1);
    // assert backspace works
    await page.keyboard.press('Backspace');
    await expect(slashItems).toHaveCount(2);
  });

  test('slash menu supports fuzzy search', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);

    await type(page, '/');
    const slashMenu = page.locator(`.slash-menu`);
    await expect(slashMenu).toBeVisible();

    const slashItems = slashMenu.locator('icon-button');
    await type(page, 'c');
    await expect(slashItems).toHaveText([
      'Code Block',
      'Italic',
      'File',
      'Copy',
      'Duplicate',
    ]);
    await type(page, 'b');
    await expect(slashItems).toHaveText(['Code Block']);
  });

  test('slash menu supports alias search', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);

    await type(page, '/');
    const slashMenu = page.locator(`.slash-menu`);
    await expect(slashMenu).toBeVisible();

    const slashItems = slashMenu.locator('icon-button');
    await type(page, 'database');
    await expect(slashItems).toHaveCount(2);
    await expect(slashItems).toHaveText(['Table View', 'Kanban View']);
    await type(page, 'v');
    await expect(slashItems).toHaveCount(0);
  });
});

test('should focus on code blocks created by the slash menu', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '000');

  await type(page, '/code');
  const slashMenu = page.locator(`.slash-menu`);
  await expect(slashMenu).toBeVisible();

  const codeBlock = page.getByTestId('Code Block');
  await codeBlock.click();
  await expect(slashMenu).toBeHidden();

  await focusRichText(page); // FIXME: flaky selection asserter
  await type(page, '111');
  await assertRichTexts(page, ['000111']);
});

// Selection is not yet available in edgeless
test('slash menu should work in edgeless mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);

  await switchEditorMode(page);

  await addNote(page, '/', 30, 40);
  await assertRichTexts(page, ['', '/']);

  const slashMenu = page.locator(`.slash-menu`);
  await expect(slashMenu).toBeVisible();
});

test.describe('slash menu with date & time', () => {
  test("should insert Today's time string", async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);

    await type(page, '/');
    const slashMenu = page.locator(`.slash-menu`);
    await expect(slashMenu).toBeVisible();

    const todayBlock = page.getByTestId('Today');
    await todayBlock.click();
    await expect(slashMenu).toBeHidden();

    const date = new Date();
    const strTime = date.toISOString().split('T')[0];

    await assertRichTexts(page, [strTime]);
  });

  test("should create Tomorrow's time string", async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);

    await type(page, '/');
    const slashMenu = page.locator(`.slash-menu`);
    await expect(slashMenu).toBeVisible();

    const todayBlock = page.getByTestId('Tomorrow');
    await todayBlock.click();
    await expect(slashMenu).toBeHidden();

    const date = new Date();
    date.setDate(date.getDate() + 1);
    const strTime = date.toISOString().split('T')[0];

    await assertRichTexts(page, [strTime]);
  });

  test("should insert Yesterday's time string", async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyParagraphState(page);
    await focusRichText(page);

    await type(page, '/');
    const slashMenu = page.locator(`.slash-menu`);
    await expect(slashMenu).toBeVisible();

    const todayBlock = page.getByTestId('Yesterday');
    await todayBlock.click();
    await expect(slashMenu).toBeHidden();

    const date = new Date();
    date.setDate(date.getDate() - 1);
    const strTime = date.toISOString().split('T')[0];

    await assertRichTexts(page, [strTime]);
  });
});

test.describe('slash menu with style', () => {
  test('should style text line works', async ({ page }) => {
    await enterPlaygroundRoom(page);
    const { paragraphId } = await initEmptyParagraphState(page);
    await focusRichText(page);

    await type(page, 'hello/');
    const slashMenu = page.locator(`.slash-menu`);
    await expect(slashMenu).toBeVisible();
    const bold = page.getByTestId('Bold');
    await bold.click();
    await assertStoreMatchJSX(
      page,
      `
<affine:paragraph
  prop:text={
    <>
      <text
        bold={true}
        insert="hello"
      />
    </>
  }
  prop:type="text"
/>`,
      paragraphId
    );
  });

  test('should style empty line works', async ({ page }) => {
    await enterPlaygroundRoom(page);
    const { paragraphId } = await initEmptyParagraphState(page);
    await focusRichText(page);

    await type(page, '/');
    const slashMenu = page.locator(`.slash-menu`);
    await expect(slashMenu).toBeVisible();
    const bold = page.getByTestId('Bold');
    await bold.click();
    await page.waitForTimeout(50);
    await type(page, 'hello');
    await assertStoreMatchJSX(
      page,
      `
<affine:paragraph
  prop:text={
    <>
      <text
        bold={true}
        insert="hello"
      />
    </>
  }
  prop:type="text"
/>`,
      paragraphId
    );
  });
});

test('should insert database', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await assertBlockCount(page, 'paragraph', 1);
  await type(page, '/');
  const tableBlock = page.getByTestId('Table View');
  await tableBlock.click();
  await assertBlockCount(page, 'paragraph', 0);
  await assertBlockCount(page, 'database', 1);

  const database = page.locator('affine-database');
  expect(database).toBeVisible();
  const tagColumn = page.locator('.affine-database-column').nth(1);
  expect(await tagColumn.innerText()).toBe('Status');
  const defaultRows = page.locator('.affine-database-block-row');
  expect(await defaultRows.count()).toBe(4);
});

test.skip('should compatible CJK IME', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, '、');
  const slashMenu = page.locator(`.slash-menu`);

  // Fix playwright can not trigger keyboard event with target: '、'
  test.fail();
  await expect(slashMenu).toBeVisible();
  await type(page, 'h2');
  const slashItems = slashMenu.locator('icon-button');
  await expect(slashItems).toHaveCount(1);
  await expect(slashItems).toHaveText(['Heading 2']);
});

test.describe('slash menu with customize menu', () => {
  test('can remove specified menus', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await page.evaluate(async () => {
      // https://github.com/lit/lit/blob/84df6ef8c73fffec92384891b4b031d7efc01a64/packages/lit-html/src/static.ts#L93
      const fakeLiteral = (strings: TemplateStringsArray) =>
        ({
          ['_$litStatic$']: strings[0],
          r: Symbol.for(''),
        }) as const;

      const editor = document.querySelector('affine-editor-container');
      if (!editor) throw new Error("Can't find affine-editor-container");

      const SlashMenuWidget = window.$blocksuite.blocks.AffineSlashMenuWidget;
      class CustomSlashMenu extends SlashMenuWidget {
        override options = {
          ...SlashMenuWidget.DEFAULT_OPTIONS,
          menus: SlashMenuWidget.DEFAULT_OPTIONS.menus.slice(0, 1),
        };
      }
      // Fix `Illegal constructor` error
      // see https://stackoverflow.com/questions/41521812/illegal-constructor-with-ecmascript-6
      customElements.define('affine-custom-slash-menu', CustomSlashMenu);

      const docSpecs = window.$blocksuite.blocks.DocEditorBlockSpecs;
      const pageBlockSpec = docSpecs.shift();
      if (!pageBlockSpec) throw new Error("Can't find pageBlockSpec");
      // @ts-ignore
      pageBlockSpec.view.widgets['affine-slash-menu-widget'] =
        fakeLiteral`affine-custom-slash-menu`;
      docSpecs.unshift(pageBlockSpec);
      editor.docSpecs = docSpecs;
    });

    await initEmptyParagraphState(page);
    await focusRichText(page);

    const slashMenu = page.locator(`.slash-menu`);
    const slashItems = slashMenu.locator('icon-button');

    await type(page, '/');
    await expect(slashMenu).toBeVisible();
    await expect(slashItems).toHaveCount(10);
  });

  test('can add some menus', async ({ page }) => {
    await enterPlaygroundRoom(page);

    await page.evaluate(async () => {
      // https://github.com/lit/lit/blob/84df6ef8c73fffec92384891b4b031d7efc01a64/packages/lit-html/src/static.ts#L93
      const fakeLiteral = (strings: TemplateStringsArray) =>
        ({
          ['_$litStatic$']: strings[0],
          r: Symbol.for(''),
        }) as const;

      const editor = document.querySelector('affine-editor-container');
      if (!editor) throw new Error("Can't find affine-editor-container");
      const SlashMenuWidget = window.$blocksuite.blocks.AffineSlashMenuWidget;

      class CustomSlashMenu extends SlashMenuWidget {
        override options = {
          ...SlashMenuWidget.DEFAULT_OPTIONS,
          menus: [
            {
              name: 'Custom Menu',
              items: [
                {
                  name: 'Custom Menu Item',
                  groupName: 'Custom Menu',
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  icon: '' as any,
                  action: () => {
                    // do nothing
                  },
                },
              ],
            },
          ],
        };
      }
      // Fix `Illegal constructor` error
      // see https://stackoverflow.com/questions/41521812/illegal-constructor-with-ecmascript-6
      customElements.define('affine-custom-slash-menu', CustomSlashMenu);

      const docSpecs = window.$blocksuite.blocks.DocEditorBlockSpecs;
      const pageBlockSpec = docSpecs.shift();
      if (!pageBlockSpec) throw new Error("Can't find pageBlockSpec");
      // @ts-ignore
      pageBlockSpec.view.widgets['affine-slash-menu-widget'] =
        fakeLiteral`affine-custom-slash-menu`;
      docSpecs.unshift(pageBlockSpec);
      editor.docSpecs = docSpecs;
    });

    await initEmptyParagraphState(page);
    await focusRichText(page);

    const slashMenu = page.locator(`.slash-menu`);
    const slashItems = slashMenu.locator('icon-button');

    await type(page, '/');
    await expect(slashMenu).toBeVisible();
    await expect(slashItems).toHaveCount(1);
  });
});

test('move block up and down by slash menu', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  const slashMenu = page.locator(`.slash-menu`);

  await focusRichText(page);
  await type(page, 'hello');
  await pressEnter(page);
  await type(page, 'world');
  await assertRichTexts(page, ['hello', 'world']);
  await type(page, '/');
  await expect(slashMenu).toBeVisible();

  const moveUp = page.getByTestId('Move Up');
  await moveUp.click();
  await assertRichTexts(page, ['world', 'hello']);
  await type(page, '/');
  await expect(slashMenu).toBeVisible();

  const moveDown = page.getByTestId('Move Down');
  await moveDown.click();
  await assertRichTexts(page, ['hello', 'world']);
});

test('delete block by slash menu should remove children', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { noteId } = await initEmptyParagraphState(page);
  await insertThreeLevelLists(page);
  const slashMenu = page.locator(`.slash-menu`);
  const slashItems = slashMenu.locator('icon-button');

  await captureHistory(page);
  await focusRichText(page, 1);
  await waitNextFrame(page);
  await type(page, '/');

  await expect(slashMenu).toBeVisible();
  await type(page, 'remove');
  await expect(slashItems).toHaveCount(1);
  await pressEnter(page);
  await assertStoreMatchJSX(
    page,
    `
<affine:note
  prop:background="--affine-background-secondary-color"
  prop:edgeless={
    Object {
      "style": Object {
        "borderRadius": 8,
        "borderSize": 4,
        "borderStyle": "solid",
        "shadowType": "--affine-note-shadow-box",
      },
    }
  }
  prop:hidden={false}
  prop:index="a0"
>
  <affine:list
    prop:checked={false}
    prop:collapsed={false}
    prop:text="123"
    prop:type="bulleted"
  />
</affine:note>`,
    noteId
  );

  await undoByKeyboard(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await redoByKeyboard(page);
  await assertRichTexts(page, ['123']);
});
