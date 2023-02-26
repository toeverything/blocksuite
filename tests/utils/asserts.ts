/* eslint-disable @typescript-eslint/no-restricted-imports */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import './declare-test-window.js';

import { expect, Locator, type Page } from '@playwright/test';
import {
  format as prettyFormat,
  plugins as prettyFormatPlugins,
} from 'pretty-format';

import type {
  BaseBlockModel,
  SerializedStore,
} from '../../packages/store/src/index.js';
import type { JSXElement } from '../../packages/store/src/utils/jsx.js';
import type { PrefixedBlockProps } from '../../packages/store/src/workspace/page.js';
import {
  redoByKeyboard,
  SHORT_KEY,
  type,
  undoByKeyboard,
} from './actions/keyboard.js';
import { captureHistory } from './actions/misc.js';

export const defaultStore: SerializedStore = {
  'space:meta': {
    pages: [
      {
        id: 'page0',
        title: '',
      },
    ],
    versions: {
      'affine:paragraph': 1,
      'affine:page': 1,
      'affine:database': 1,
      'affine:list': 1,
      'affine:frame': 1,
      'affine:divider': 1,
      'affine:embed': 1,
      'affine:code': 1,
      'affine:surface': 1,
    },
  },
  'space:page0': {
    '0': {
      'meta:tags': {},
      'meta:tagSchema': {},
      'prop:title': '',
      'sys:id': '0',
      'sys:flavour': 'affine:page',
      'sys:children': ['1'],
    },
    '1': {
      'sys:flavour': 'affine:frame',
      'sys:id': '1',
      'sys:children': ['2'],
      'prop:xywh': '[0,0,720,30]',
    },
    '2': {
      'sys:flavour': 'affine:paragraph',
      'sys:id': '2',
      'sys:children': [],
      'prop:text': 'hello',
      'prop:type': 'text',
    },
  },
};

export async function assertEmpty(page: Page) {
  await assertRichTexts(page, ['\n']);
}

export async function assertTitle(page: Page, text: string) {
  const locator = page.locator('.affine-default-page-block-title').nth(0);
  const actual = await locator.inputValue();
  expect(actual).toBe(text);
}

export async function assertText(page: Page, text: string) {
  const actual = await page.innerText('.ql-editor');
  expect(actual).toBe(text);
}

export async function assertTextContain(page: Page, text: string) {
  const actual = await page.innerText('.ql-editor');
  expect(actual).toContain(text);
}

export async function assertRichTexts(page: Page, texts: string[]) {
  await page.mouse.move(100, 100); // move mouse for focus
  const actual = await page.locator('.ql-editor').allInnerTexts();
  expect(actual).toEqual(texts);
}

export async function assertRichImage(page: Page, count: number) {
  const actual = await page.locator('.resizable-img').count();
  expect(actual).toEqual(count);
}

export async function assertDivider(page: Page, count: number) {
  const actual = await page.locator('affine-divider').count();
  expect(actual).toEqual(count);
}

export async function assertRichDragButton(page: Page) {
  const actual = await page.locator('.resize').count();
  expect(actual).toEqual(4);
}

export async function assertImageSize(
  page: Page,
  size: { width: number; height: number }
) {
  const actual = await page.locator('.resizable-img').boundingBox();
  expect(size).toEqual({
    width: Math.floor(actual?.width ?? NaN),
    height: Math.floor(actual?.height ?? NaN),
  });
}

export async function assertImageOption(page: Page) {
  // const actual = await page.locator('.embed-editing-state').count();
  // expect(actual).toEqual(1);
  const locator = page.locator('.embed-editing-state');
  await expect(locator).toBeVisible();
}

export async function assertPageTitleFocus(page: Page) {
  const locator = page.locator('.affine-default-page-block-title').nth(0);
  await expect(locator).toBeFocused();
}

export async function assertBlockCount(
  page: Page,
  flavour: string,
  count: number
) {
  const actual = await page.locator(`affine-${flavour}`).count();
  expect(actual).toBe(count);
}

export async function assertSelection(
  page: Page,
  richTextIndex: number,
  rangeIndex: number,
  rangeLength: number
) {
  const actual = await page.evaluate(
    ({ richTextIndex }) => {
      const quill =
        // @ts-ignore
        document.querySelectorAll('rich-text')[richTextIndex]?.quill!;
      return quill.getSelection();
    },
    { richTextIndex }
  );
  expect(actual).toEqual({ index: rangeIndex, length: rangeLength });
}

export async function assertNativeSelectionRangeCount(
  page: Page,
  count: number
) {
  const actual = await page.evaluate(() => {
    const selection = window.getSelection();
    return selection?.rangeCount;
  });
  expect(actual).toEqual(count);
}

export async function assertTextFormat(
  page: Page,
  richTextIndex: number,
  quillIndex: number,
  resultObj: unknown
) {
  const actual = await page.evaluate(
    ({ richTextIndex, quillIndex }) => {
      const quill = document.querySelectorAll('rich-text')[richTextIndex].quill;
      return quill.getFormat(quillIndex);
    },
    { richTextIndex, quillIndex }
  );
  expect(actual).toEqual(resultObj);
}

export async function assertTypeFormat(page: Page, type: string) {
  const actual = await page.evaluate(() => {
    const richText = document.querySelectorAll('rich-text')[0];
    return richText.model.type;
  });
  expect(actual).toEqual(type);
}

export async function assertTextFormats(page: Page, resultObj: unknown[]) {
  const actual = await page.evaluate(() => {
    const elements = document.querySelectorAll('rich-text');
    return Array.from(elements).map(el => el.quill.getFormat());
  });
  expect(actual).toEqual(resultObj);
}

export async function assertStore(page: Page, expected: SerializedStore) {
  const actual = (await page.evaluate(() => {
    const json = window.workspace.doc.toJSON();
    delete json['space:meta'].pages[0].createDate;
    return json;
  })) as SerializedStore;
  expect(actual).toEqual(expected);
}

export async function assertBlockChildrenIds(
  page: Page,
  blockId: string,
  ids: string[]
) {
  const actual = await page.evaluate(
    ({ blockId }) => {
      const element = document.querySelector(`[data-block-id="${blockId}"]`);
      // @ts-ignore
      const model = element.model as BaseBlockModel;
      return model.children.map(child => child.id);
    },
    { blockId }
  );
  expect(actual).toEqual(ids);
}

export async function assertBlockChildrenFlavours(
  page: Page,
  blockId: string,
  flavours: string[]
) {
  const actual = await page.evaluate(
    ({ blockId }) => {
      const element = document.querySelector(`[data-block-id="${blockId}"]`);
      // @ts-ignore
      const model = element.model as BaseBlockModel;
      return model.children.map(child => child.flavour);
    },
    { blockId }
  );
  expect(actual).toEqual(flavours);
}

export async function assertClassName(
  page: Page,
  selector: string,
  className: RegExp
) {
  const locator = page.locator(selector);
  await expect(locator).toHaveClass(className);
}

export async function assertTextContent(
  page: Page,
  selector: string,
  text: RegExp
) {
  const locator = page.locator(selector);
  await expect(locator).toHaveText(text);
}

export async function assertBlockType(
  page: Page,
  id: string | number | null,
  type: string
) {
  const actual = await page.evaluate(
    ({ id }) => {
      const element = document.querySelector(`[data-block-id="${id}"]`);
      // @ts-ignore
      const model = element.model as BaseBlockModel;
      // @ts-ignore
      return model.type;
    },
    { id }
  );
  expect(actual).toBe(type);
}

export async function assertBlockProps(
  page: Page,
  id: string,
  props: Record<string, unknown>
) {
  const actual = await page.evaluate(
    ([id, props]) => {
      const element = document.querySelector(`[data-block-id="${id}"]`);
      // @ts-ignore
      const model = element.model as BaseBlockModel;
      return Object.fromEntries(
        // @ts-ignore
        Object.keys(props).map(key => [key, model[key]])
      );
    },
    [id, props] as const
  );
  expect(actual).toEqual(props);
}

export async function assertBlockTypes(page: Page, blockTypes: string[]) {
  const actual = await page.evaluate(() => {
    const elements = document.querySelectorAll('[data-block-id]');
    return (
      Array.from(elements)
        .slice(2)
        // @ts-ignore
        .map(el => el.model.type)
    );
  });
  expect(actual).toEqual(blockTypes);
}

/**
 * @example
 * ```ts
 * await assertMatchMarkdown(
 *   page,
 *   `title
 * text1
 * text2`
 * );
 * ```
 * @deprecated experimental, use {@link assertStoreMatchJSX} instead
 */
export async function assertMatchMarkdown(page: Page, text: string) {
  const jsonDoc = (await page.evaluate(() =>
    window.workspace.doc.toJSON()
  )) as SerializedStore;
  const titleNode = jsonDoc['space:page0']['0'] as PrefixedBlockProps;

  const markdownVisitor = (node: PrefixedBlockProps): string => {
    // TODO use schema
    if (node['sys:flavour'] === 'affine:page') {
      return (node['prop:title'] as string) ?? '';
    }
    if (!('prop:type' in node)) {
      return '[? unknown node]';
    }
    if (node['prop:type'] === 'text') {
      return node['prop:text'] as string;
    }
    if (node['prop:type'] === 'bulleted') {
      return `- ${node['prop:text']}`;
    }
    // TODO please fix this
    return `[? ${node['prop:type']} node]`;
  };

  const INDENT_SIZE = 2;
  const visitNodes = (
    node: PrefixedBlockProps,
    visitor: (node: PrefixedBlockProps) => string
  ): string[] => {
    if (!('sys:children' in node) || !Array.isArray(node['sys:children'])) {
      throw new Error("Failed to visit nodes: 'sys:children' is not an array");
      // return visitor(node);
    }

    const children = node['sys:children'].map(id => jsonDoc['space:page0'][id]);
    return [
      visitor(node),
      ...children.flatMap(child =>
        visitNodes(child as PrefixedBlockProps, visitor).map(line => {
          if (node['sys:flavour'] === 'affine:page') {
            // Ad hoc way to remove the title indent
            return line;
          }

          return ' '.repeat(INDENT_SIZE) + line;
        })
      ),
    ];
  };
  const visitRet = visitNodes(titleNode, markdownVisitor);
  const actual = visitRet.join('\n');

  expect(actual).toEqual(text);
}

export async function assertStoreMatchJSX(
  page: Page,
  snapshot: string,
  id?: string
) {
  const element = (await page.evaluate(
    id => window.workspace.exportJSX(id),
    id
  )) as JSXElement;

  // Fix symbol can not be serialized, we need to set $$typeof manually
  // If the function passed to the page.evaluate(pageFunction[, arg]) returns a non-Serializable value,
  // then page.evaluate(pageFunction[, arg]) resolves to undefined.
  // See https://playwright.dev/docs/api/class-page#page-evaluate
  const testSymbol = Symbol.for('react.test.json');
  const markSymbol = (node: JSXElement) => {
    node.$$typeof = testSymbol;
    if (!node.children) {
      return;
    }
    const propText = node.props['prop:text'];
    if (propText && typeof propText === 'object') {
      markSymbol(propText);
    }
    node.children.forEach(child => {
      if (!(typeof child === 'object')) {
        return;
      }
      markSymbol(child);
    });
  };

  markSymbol(element);

  // See https://github.com/facebook/jest/blob/main/packages/pretty-format
  const formattedJSX = prettyFormat(element, {
    plugins: [prettyFormatPlugins.ReactTestComponent],
    printFunctionName: false,
  });
  expect(snapshot.trimStart(), formattedJSX).toEqual(formattedJSX);
}

type MimeType = 'text/plain' | 'blocksuite/x-c+w' | 'text/html';

export async function assertClipItems(
  page: Page,
  key: MimeType,
  value: unknown
) {
  const clipItems = await page.evaluate(() => {
    return document
      .getElementsByTagName('editor-container')[0]
      .clipboard['_copy']['_getClipItems']();
  });
  const actual = clipItems.find(item => item.mimeType === key)?.data;
  expect(actual).toEqual(value);
}

export function assertAlmostEqual(
  actual: number,
  expected: number,
  precision = 0.001
) {
  expect(
    Math.abs(actual - expected),
    `expected: ${expected}, but actual: ${actual}`
  ).toBeLessThan(precision);
}

/**
 * Assert the locator is visible in the viewport.
 * It will check the bounding box of the locator is within the viewport.
 *
 * See also https://playwright.dev/docs/actionability#visible
 */
export async function assertLocatorVisible(
  page: Page,
  locator: Locator,
  visible = true
) {
  const bodyRect = await page.locator('body').boundingBox();
  const rect = await locator.boundingBox();
  expect(rect).toBeTruthy();
  expect(bodyRect).toBeTruthy();
  if (!rect || !bodyRect) {
    throw new Error('Unreachable');
  }
  if (visible) {
    // Assert the locator is **fully** visible
    await expect(locator).toBeVisible();
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(
      bodyRect.x + bodyRect.width
    );
    expect(rect.y + rect.height).toBeLessThanOrEqual(
      bodyRect.x + bodyRect.height
    );
  } else {
    // Assert the locator is **fully** invisible
    const locatorIsVisible = await locator.isVisible();
    if (!locatorIsVisible) {
      // If the locator is invisible, we don't need to check the bounding box
      return;
    }
    const isInVisible =
      rect.x > bodyRect.x + bodyRect.width ||
      rect.y > bodyRect.y + bodyRect.height ||
      rect.x + rect.width < bodyRect.x ||
      rect.y + rect.height < bodyRect.y;
    expect(isInVisible).toBe(true);
  }
}

/**
 * Assert basic keyboard operation works in input
 *
 * NOTICE:
 *   - it will clear the input value.
 *   - it will pollute undo/redo history.
 */
export async function assertKeyboardWorkInInput(page: Page, locator: Locator) {
  await expect(locator).toBeVisible();
  await locator.focus();
  // Clear input before test
  await locator.clear();
  // type/backspace
  await type(page, '1234');
  await expect(locator).toHaveValue('1234');
  await captureHistory(page);
  await page.keyboard.press('Backspace');
  await expect(locator).toHaveValue('123');

  // undo/redo
  await undoByKeyboard(page);
  await expect(locator).toHaveValue('1234');
  await redoByKeyboard(page);
  await expect(locator).toHaveValue('123');

  // keyboard
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Backspace');
  await expect(locator).toHaveValue('13');

  // copy/cut/paste
  await page.keyboard.press(`${SHORT_KEY}+a`);
  await page.keyboard.press(`${SHORT_KEY}+c`);
  await page.keyboard.press('Backspace');
  await expect(locator).toHaveValue('');
  await page.keyboard.press(`${SHORT_KEY}+v`);
  await expect(locator).toHaveValue('13');
  await page.keyboard.press(`${SHORT_KEY}+a`);
  await page.keyboard.press(`${SHORT_KEY}+x`);
  await expect(locator).toHaveValue('');
}
