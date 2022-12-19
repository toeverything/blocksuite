import { expect, test } from '@playwright/test';
import {
  addCodeBlock,
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
  keyDownCtrlOrMeta,
  keyDownOptionMeta,
  keyUpCtrlOrMeta,
  keyUpOptionMeta,
} from './utils/actions';

test('use debug menu can create code block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await addCodeBlock(page);

  const locator = page.locator('affine-code');
  await expect(locator).toBeVisible();
});

test('use markdown syntax can create code block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await page.keyboard.type('```');
  await page.keyboard.type(' ');

  const locator = page.locator('affine-code');
  await expect(locator).toBeVisible();
});

// TODO confirm shortcut
test('use shortcut can create code block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await keyDownCtrlOrMeta(page);
  await keyDownOptionMeta(page);
  await page.keyboard.press('c');
  await keyUpCtrlOrMeta(page);
  await keyUpOptionMeta(page);

  const locator = page.locator('affine-code');
  await expect(locator).toBeVisible();
});

test('change code language can work', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await addCodeBlock(page);

  const codeLangSelector = '.lang-container > code-block-button:nth-child(1)';
  await page.click(codeLangSelector);
  const locator = page.locator('.lang-list-button-container');
  await expect(locator).toBeVisible();

  await page.keyboard.type('rust');
  await page.click(
    '.lang-list-button-container > code-block-button:nth-child(1)'
  );
  await expect(locator).toBeHidden();

  await expect(page.locator(codeLangSelector)).toHaveText('rust');
});

test('language select list can disappear when click other place', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await addCodeBlock(page);

  const codeLangSelector = '.lang-container > code-block-button:nth-child(1)';
  await page.click(codeLangSelector);
  const locator = page.locator('.lang-list-button-container');
  await expect(locator).toBeVisible();

  const position = await page.evaluate(() => {
    const paragraph = document.querySelector('.lang-list-button-container');
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return { x: bbox.right + 10, y: bbox.top + 10 };
  });
  page.mouse.click(position.x, position.y);

  await expect(locator).toBeHidden();
});

/*
- 初始化
  - Debug menu 初始化代码块（done）
  - ``` markdown 语法（done）
  - 快捷键（done）
- 语言选择
  - 点击 button 出现语言选择下拉框，自动 focus 输入框，然后选择语言，能够正常切换（done）
  - 点击 button 出现语言选择下拉框后，在空白的地方点击下拉框消失（done）
TODO
- 复制
  - 复制多行代码，内容在代码块里
  - 拖选复制
  - 键盘选择复制
- 删除
  - 在代码块开始按两次退格键，删除
  - 框选删除
- 跳出
  - 最后按两次回车跳出代码块
  - 最后按下箭头跳出代码块（还没搞定）
- 进入
  - 代码块后按退格进入代码块的起始位置
  - 代码块后按上箭头，进入代码块最后一行
- 键盘行为
  - Markdown 语法禁用
- Format bar（功能待开发）
  - 代码块内拖选，支持的格式：段落（多行的代码块是否会换成多行），复制
- Undo redo
 */
