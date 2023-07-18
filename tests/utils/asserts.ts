/* eslint-disable @typescript-eslint/no-restricted-imports */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import './declare-test-window.js';

import type {
  CssVariableName,
  NoteBlockModel,
  PageBlockModel,
} from '@blocksuite/blocks';
import { EDITOR_WIDTH, WORKSPACE_VERSION } from '@blocksuite/global/config';
import type { Locator } from '@playwright/test';
import { expect, type Page } from '@playwright/test';
import {
  format as prettyFormat,
  plugins as prettyFormatPlugins,
} from 'pretty-format';

import { toHex } from '../../packages/blocks/src/__internal__/utils/common.js';
import type { RichText } from '../../packages/playground/examples/virgo/test-page.js';
import type {
  BaseBlockModel,
  SerializedStore,
} from '../../packages/store/src/index.js';
import type { JSXElement } from '../../packages/store/src/utils/jsx.js';
import type { PrefixedBlockProps } from '../../packages/store/src/workspace/page.js';
import { getConnectorPath, getZoomLevel } from './actions/edgeless.js';
import {
  pressArrowLeft,
  pressArrowRight,
  pressBackspace,
  redoByKeyboard,
  SHORT_KEY,
  type,
  undoByKeyboard,
} from './actions/keyboard.js';
import {
  captureHistory,
  getCurrentEditorPageId,
  getCurrentThemeCSSPropertyValue,
  getEditorLocator,
  virgoEditorInnerTextToString,
} from './actions/misc.js';
import { currentEditorIndex } from './multiple-editor.js';
import { getStringFromRichText } from './virgo.js';

export const defaultStore: SerializedStore = {
  meta: {
    properties: {
      tags: {
        options: [],
      },
    },
    pages: [
      {
        id: 'page0',
        title: '',
        tags: [],
      },
    ],
    blockVersions: {
      'affine:paragraph': 1,
      'affine:page': 2,
      'affine:database': 2,
      'affine:data-view': 1,
      'affine:list': 1,
      'affine:note': 1,
      'affine:divider': 1,
      'affine:image': 1,
      'affine:code': 1,
      'affine:surface': 3,
      'affine:bookmark': 1,
    },
    workspaceVersion: WORKSPACE_VERSION,
  },
  spaces: {
    'space:page0': {
      blocks: {
        '0': {
          'prop:title': '',
          'sys:id': '0',
          'sys:flavour': 'affine:page',
          'sys:children': ['1'],
        },
        '1': {
          'sys:flavour': 'affine:note',
          'sys:id': '1',
          'sys:children': ['2'],
          'prop:xywh': `[0,0,${EDITOR_WIDTH},80]`,
          'prop:background': '--affine-background-secondary-color',
          'prop:index': 'a0',
          'prop:hidden': false,
        },
        '2': {
          'sys:flavour': 'affine:paragraph',
          'sys:id': '2',
          'sys:children': [],
          'prop:text': 'hello',
          'prop:type': 'text',
        },
      },
    },
  },
};

export async function assertEmpty(page: Page) {
  await assertRichTexts(page, ['']);
}

export async function assertTitle(page: Page, text: string) {
  const editor = getEditorLocator(page);
  const vEditor = editor.locator('[data-block-is-title="true"]').first();
  const vText = virgoEditorInnerTextToString(await vEditor.innerText());
  expect(vText).toBe(text);
}

export async function assertText(page: Page, text: string, i = 0) {
  const actual = await getStringFromRichText(page, i);
  expect(actual).toBe(text);
}

export async function assertTextContain(page: Page, text: string, i = 0) {
  const actual = await getStringFromRichText(page, i);
  expect(actual).toContain(text);
}

export async function assertRichTexts(page: Page, texts: string[]) {
  const actualTexts = await page.evaluate(index => {
    const editor = document.querySelectorAll('editor-container')[index];
    const richTexts = Array.from(
      editor?.querySelectorAll<RichText>('rich-text') ?? []
    );
    return richTexts.map(richText => {
      const editor = richText.vEditor;
      return editor.yText.toString();
    });
  }, currentEditorIndex);
  expect(actualTexts).toEqual(texts);
}

export async function assertEdgelessCanvasText(page: Page, text: string) {
  const actualTexts = await page.evaluate(() => {
    const editor = document.querySelector(
      'edgeless-text-editor,edgeless-shape-text-editor'
    );
    if (!editor) {
      throw new Error('editor not found');
    }
    // @ts-ignore
    const vEditor = editor.vEditor;
    return vEditor?.yText.toString();
  });
  expect(actualTexts).toEqual(text);
}

export async function assertRichImage(page: Page, count: number) {
  const editor = getEditorLocator(page);
  const actual = await editor.locator('.resizable-img').count();
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

export async function assertListPrefix(
  page: Page,
  predict: (string | RegExp)[],
  range?: [number, number]
) {
  const prefixs = page.locator('.affine-list-block__prefix');

  let start = 0;
  let end = await prefixs.count();
  if (range) {
    [start, end] = range;
  }

  for (let i = start; i < end; i++) {
    const prefix = await prefixs.nth(i).innerText();
    expect(prefix).toContain(predict[i]);
  }
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
  rangeLength = 0
) {
  const actual = await page.evaluate(
    ([richTextIndex, index]) => {
      const editor = document.querySelectorAll('editor-container')[index];
      const richText = editor?.querySelectorAll('rich-text')[richTextIndex];
      const vEditor = richText.vEditor;
      return vEditor?.getVRange();
    },
    [richTextIndex, currentEditorIndex]
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

export async function assertNoteXYWH(
  page: Page,
  expected: [number, number, number, number]
) {
  const actual = await page.evaluate(() => {
    const root = window.page.root as PageBlockModel;
    const note = root.children.find(
      x => x.flavour === 'affine:note'
    ) as NoteBlockModel;
    return JSON.parse(note.xywh) as number[];
  });
  expect(actual[0]).toBeCloseTo(expected[0]);
  expect(actual[1]).toBeCloseTo(expected[1]);
  expect(actual[2]).toBeCloseTo(expected[2]);
  expect(actual[3]).toBeCloseTo(expected[3]);
}

export async function assertTextFormat(
  page: Page,
  richTextIndex: number,
  index: number,
  resultObj: unknown
) {
  const actual = await page.evaluate(
    ({ richTextIndex, index }) => {
      const richText = document.querySelectorAll('rich-text')[richTextIndex];
      const vEditor = richText.vEditor;
      if (!vEditor) {
        throw new Error('vEditor is undefined');
      }

      const result = vEditor.getFormat({
        index,
        length: 0,
      });
      return result;
    },
    { richTextIndex, index }
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
  const actual = await page.evaluate(index => {
    const editor = document.querySelectorAll('editor-container')[index];
    const elements = editor?.querySelectorAll('rich-text');
    return Array.from(elements).map(el => {
      const vEditor = el.vEditor;
      if (!vEditor) {
        throw new Error('vEditor is undefined');
      }

      const result = vEditor.getFormat({
        index: 0,
        length: vEditor.yText.length,
      });
      return result;
    });
  }, currentEditorIndex);
  expect(actual).toEqual(resultObj);
}

export async function assertStore(page: Page, expected: SerializedStore) {
  const actual = (await page.evaluate(() => {
    const json = window.workspace.doc.toJSON();
    delete json.meta.pages[0].createDate;
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
        Object.keys(props).map(key => [key, (model[key] as unknown).toString()])
      );
    },
    [id, props] as const
  );
  expect(actual).toEqual(props);
}

export async function assertBlockTypes(page: Page, blockTypes: string[]) {
  const actual = await page.evaluate(index => {
    const editor = document.querySelectorAll('editor-container')[index];
    const elements = editor?.querySelectorAll('[data-block-id]');
    return (
      Array.from(elements)
        .slice(2)
        // @ts-ignore
        .map(el => el.model.type)
    );
  }, currentEditorIndex);
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
      return (node['prop:title'] as Text).toString() ?? '';
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
  blockId?: string
) {
  const pageId = await getCurrentEditorPageId(page);
  const element = (await page.evaluate(
    ([blockId, pageId]) => window.workspace.exportJSX(blockId, pageId),
    [blockId, pageId]
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
  // FIXME: use original clipboard API
  // const clipItems = await page.evaluate(() => {
  //   return document
  //     .getElementsByTagName('editor-container')[0]
  //     .clipboard['_copy']['_getClipItems']();
  // });
  // const actual = clipItems.find(item => item.mimeType === key)?.data;
  // expect(actual).toEqual(value);
  return true;
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

export function assertPointAlmostEqual(
  actual: number[],
  expected: number[],
  precision = 0.001
) {
  assertAlmostEqual(actual[0], expected[0], precision);
  assertAlmostEqual(actual[1], expected[1], precision);
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
  await type(page, '12/34');
  await expect(locator).toHaveValue('12/34');
  await captureHistory(page);
  await pressBackspace(page);
  await expect(locator).toHaveValue('12/3');

  // undo/redo
  await undoByKeyboard(page);
  await expect(locator).toHaveValue('12/34');
  await redoByKeyboard(page);
  await expect(locator).toHaveValue('12/3');

  // keyboard
  await pressArrowLeft(page, 2);
  await pressArrowRight(page, 1);
  await pressBackspace(page);
  await expect(locator).toHaveValue('123');
  await pressBackspace(page);
  await expect(locator).toHaveValue('13');

  // copy/cut/paste
  await page.keyboard.press(`${SHORT_KEY}+a`, { delay: 50 });
  await page.keyboard.press(`${SHORT_KEY}+c`, { delay: 50 });
  await pressBackspace(page);
  await expect(locator).toHaveValue('');
  await page.keyboard.press(`${SHORT_KEY}+v`, { delay: 50 });
  await expect(locator).toHaveValue('13');
  await page.keyboard.press(`${SHORT_KEY}+a`, { delay: 50 });
  await page.keyboard.press(`${SHORT_KEY}+x`, { delay: 50 });
  await expect(locator).toHaveValue('');
}

export async function assertEdgelessHoverRect(page: Page, xywh: number[]) {
  const [x, y, w, h] = xywh;
  const hoverRect = page.locator('.affine-edgeless-hover-rect');
  const box = await hoverRect.boundingBox();
  if (!box) throw new Error('Missing edgeless hover rect');

  expect(box.x).toBeCloseTo(x, 0);
  expect(box.y).toBeCloseTo(y, 0);
  expect(box.width).toBeCloseTo(w, 0);
  expect(box.height).toBeCloseTo(h, 0);
}

export async function assertEdgelessNonHoverRect(page: Page) {
  const hoverRect = page.locator('.affine-edgeless-hover-rect');
  await expect(hoverRect).toBeHidden();
}

export function assertSameColor(c1?: `#${string}`, c2?: `#${string}`) {
  expect(c1?.toLowerCase()).toEqual(c2?.toLowerCase());
}

type Rect = { x: number; y: number; w: number; h: number };

export function assertRectEqual(a: Rect, b: Rect) {
  expect(a.x).toBeCloseTo(b.x, 0);
  expect(a.y).toBeCloseTo(b.y, 0);
  expect(a.w).toBeCloseTo(b.w, 0);
  expect(a.h).toBeCloseTo(b.h, 0);
}

export function assertDOMRectEqual(a: DOMRect, b: DOMRect) {
  expect(a.x).toBeCloseTo(b.x, 0);
  expect(a.y).toBeCloseTo(b.y, 0);
  expect(a.width).toBeCloseTo(b.width, 0);
  expect(a.height).toBeCloseTo(b.height, 0);
}

export async function assertEdgelessSelectedRect(page: Page, xywh: number[]) {
  const [x, y, w, h] = xywh;
  const editor = getEditorLocator(page);
  const selectedRect = editor
    .locator('edgeless-selected-rect')
    .locator('.affine-edgeless-selected-rect');
  const box = await selectedRect.boundingBox();
  if (!box) throw new Error('Missing edgeless selected rect');

  expect(box.x).toBeCloseTo(x, 0);
  expect(box.y).toBeCloseTo(y, 0);
  expect(box.width).toBeCloseTo(w, 0);
  expect(box.height).toBeCloseTo(h, 0);
}

export async function assertEdgelessSelectedRectRotation(page: Page, deg = 0) {
  const editor = getEditorLocator(page);
  const selectedRect = editor
    .locator('edgeless-selected-rect')
    .locator('.affine-edgeless-selected-rect');

  const transform = await selectedRect.evaluate(el => el.style.transform);
  const r = new RegExp(`rotate\\(${deg}deg\\)`);
  expect(transform).toMatch(r);
}

export async function assertEdgelessNonSelectedRect(page: Page) {
  const rect = page.locator('edgeless-selected-rect');
  await expect(rect).toBeHidden();
}

export async function assertSelectionInNote(page: Page, noteId: string) {
  const closestNoteId = await page.evaluate(() => {
    const selection = window.getSelection();
    const note = selection?.anchorNode?.parentElement?.closest('affine-note');
    return note?.getAttribute('data-block-id');
  });
  expect(closestNoteId).toEqual(noteId);
}

export async function assertEdgelessNoteBackground(
  page: Page,
  noteId: string,
  color: CssVariableName
) {
  const editor = getEditorLocator(page);
  const backgroundColor = await editor
    .locator(`affine-note[data-block-id="${noteId}"]`)
    .evaluate(ele => {
      const noteWrapper = ele.closest<HTMLDivElement>(
        '.affine-edgeless-child-note'
      );
      if (!noteWrapper) {
        throw new Error(`Could not find note: ${noteId}`);
      }
      return noteWrapper.style.background;
    });

  expect(backgroundColor).toEqual(`var(${color})`);
}

export async function assertEdgelessColorSameWithHexColor(
  page: Page,
  edgelessColor: CssVariableName,
  hexColor: `#${string}`
) {
  const themeColor = await getCurrentThemeCSSPropertyValue(page, edgelessColor);
  expect(themeColor).toBeTruthy();
  const edgelessHexColor = toHex(themeColor as string);

  assertSameColor(hexColor, edgelessHexColor as `#${string}`);
}

export async function assertZoomLevel(page: Page, zoom: number) {
  const z = await getZoomLevel(page);
  expect(z).toBe(zoom);
}

export async function assertConnectorPath(
  page: Page,
  path: number[][],
  index = 0
) {
  const actualPath = await getConnectorPath(page, index);
  actualPath.every((p, i) => assertPointAlmostEqual(p, path[i]));
}

export function assertRectExist(
  rect: { x: number; y: number; width: number; height: number } | null
): asserts rect is { x: number; y: number; width: number; height: number } {
  expect(rect).not.toBe(null);
}
