/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import './declare-test-window';
import { expect, type Page } from '@playwright/test';
import type { BaseBlockModel, SerializedStore } from '../../packages/store';
import type { PrefixedBlockProps } from '../../packages/store/src/workspace/page';

import type { JSXElement } from '../../packages/store/src/utils/jsx';
import {
  format as prettyFormat,
  plugins as prettyFormatPlugins,
} from 'pretty-format';

export const defaultStore: SerializedStore = {
  'space:meta': {
    pages: [
      {
        id: 'page0',
        title: '',
      },
    ],
    versions: {
      'affine:paragraph': [1, 0],
      'affine:page': [1, 0],
      'affine:list': [1, 0],
      'affine:group': [1, 0],
      'affine:divider': [1, 0],
      'affine:embed': [1, 0],
      'affine:shape': [1, 0],
      'affine:code-block': [1, 0],
    },
  },
  'space:page0': {
    '0': {
      'sys:id': '0',
      'sys:flavour': 'affine:page',
      'sys:children': ['1'],
    },
    '1': {
      'sys:flavour': 'affine:group',
      'sys:id': '1',
      'sys:children': ['2'],
      'prop:xywh': '[0,0,720,32]',
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
  const locator = page.locator('input').nth(0);
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
  const actual = await page.locator('divider-block').count();
  expect(actual).toEqual(count);
}
export async function assertRichDragButton(page: Page) {
  const actual = await page.locator('.resize').count();
  expect(actual).toEqual(4);
}

export async function assertImageSize(
  page: Page,
  { width, height }: { width: number; height: number }
) {
  const actual = await page.locator('.resizable-img').boundingBox();
  expect(actual?.width).toEqual(width);
  expect(actual?.height).toEqual(height);
}

export async function assertPageTitleFocus(page: Page) {
  const locator = page.locator('input').nth(0);
  await expect(locator).toBeFocused();
}

export async function assertBlockCount(
  page: Page,
  flavour: string,
  count: number
) {
  const actual = await page.locator(`${flavour}-block`).count();
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
    id => window.workspace.toJSXElement(id),
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

export async function assertClipItems(page: Page, key: string, value: unknown) {
  const clipItems = await page.evaluate(() => {
    return document
      .getElementsByTagName('editor-container')[0]
      .clipboard['_copy']['_getClipItems']();
  });
  // @ts-ignore
  const actual = clipItems.find(item => item.mimeType === key)?.data;
  expect(actual).toEqual(value);
}
