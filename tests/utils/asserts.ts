/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import './declare-test-window.js';

import type {
  BlockElement,
  EditorHost,
} from '@block-std/view/element/index.js';
import { BLOCK_ID_ATTR, NOTE_WIDTH } from '@blocks/_common/consts.js';
import type { CssVariableName } from '@blocks/_common/theme/css-variables.js';
import type {
  AffineInlineEditor,
  NoteBlockModel,
  RichText,
  RootBlockModel,
} from '@blocks/index.js';
import { assertExists } from '@global/utils/index.js';
import type { InlineRootElement } from '@inline/inline-editor.js';
import type { Locator } from '@playwright/test';
import { expect, type Page } from '@playwright/test';
import { COLLECTION_VERSION, PAGE_VERSION } from '@store/consts.js';
import type { BlockModel, SerializedStore } from '@store/index.js';
import type { JSXElement } from '@store/utils/jsx.js';
import {
  format as prettyFormat,
  plugins as prettyFormatPlugins,
} from 'pretty-format';

import {
  getCanvasElementsCount,
  getConnectorPath,
  getEdgelessSelectedRectModel,
  getGroupChildrenIds,
  getGroupIds,
  getGroupOfElements,
  getNoteRect,
  getSelectedBound,
  getSortedIdsInViewport,
  getZoomLevel,
  toIdCountMap,
} from './actions/edgeless.js';
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
  getClipboardCustomData,
  getCurrentEditorDocId,
  getCurrentThemeCSSPropertyValue,
  getEditorLocator,
  inlineEditorInnerTextToString,
} from './actions/misc.js';
import { getStringFromRichText } from './inline-editor.js';
import { currentEditorIndex } from './multiple-editor.js';

export { assertExists };

export const defaultStore: SerializedStore = {
  meta: {
    pages: [
      {
        id: 'doc:home',
        title: '',
        tags: [],
      },
    ],
    blockVersions: {
      'affine:paragraph': 1,
      'affine:page': 2,
      'affine:database': 3,
      'affine:data-view': 1,
      'affine:list': 1,
      'affine:note': 1,
      'affine:divider': 1,
      'affine:embed-youtube': 1,
      'affine:embed-figma': 1,
      'affine:embed-github': 1,
      'affine:embed-loom': 1,
      'affine:embed-html': 1,
      'affine:embed-linked-doc': 1,
      'affine:embed-synced-doc': 1,
      'affine:image': 1,
      'affine:frame': 1,
      'affine:code': 1,
      'affine:surface': 5,
      'affine:bookmark': 1,
      'affine:attachment': 1,
      'affine:surface-ref': 1,
      'affine:edgeless-text': 1,
    },
    workspaceVersion: COLLECTION_VERSION,
    pageVersion: PAGE_VERSION,
  },
  spaces: {
    'doc:home': {
      blocks: {
        '0': {
          'prop:title': '',
          'sys:id': '0',
          'sys:flavour': 'affine:page',
          'sys:children': ['1'],
          'sys:version': 2,
        },
        '1': {
          'sys:flavour': 'affine:note',
          'sys:id': '1',
          'sys:children': ['2'],
          'sys:version': 1,
          'prop:xywh': `[0,0,${NOTE_WIDTH},95]`,
          'prop:background': '--affine-note-background-blue',
          'prop:index': 'a0',
          'prop:hidden': false,
          'prop:displayMode': 'both',
          'prop:edgeless': {
            style: {
              borderRadius: 0,
              borderSize: 4,
              borderStyle: 'none',
              shadowType: '--affine-note-shadow-sticker',
            },
          },
        },
        '2': {
          'sys:flavour': 'affine:paragraph',
          'sys:id': '2',
          'sys:children': [],
          'sys:version': 1,
          'prop:text': 'hello',
          'prop:type': 'text',
        },
      },
    },
  },
};

export type Bound = [x: number, y: number, w: number, h: number];

export async function assertEmpty(page: Page) {
  await assertRichTexts(page, ['']);
}

export async function assertTitle(page: Page, text: string) {
  const editor = getEditorLocator(page);
  const inlineEditor = editor.locator('.doc-title-container').first();
  const vText = inlineEditorInnerTextToString(await inlineEditor.innerText());
  expect(vText).toBe(text);
}

export async function assertInlineEditorDeltas(
  page: Page,
  deltas: unknown[],
  i = 0
) {
  const actual = await page.evaluate(i => {
    const inlineRoot = document.querySelectorAll<InlineRootElement>(
      '[data-v-root="true"]'
    )[i];
    return inlineRoot.inlineEditor.yTextDeltas;
  }, i);
  expect(actual).toEqual(deltas);
}

export async function assertRichTextInlineDeltas(
  page: Page,
  deltas: unknown[],
  i = 0
) {
  const actual = await page.evaluate(
    ([i, currentEditorIndex]) => {
      const editorHost =
        document.querySelectorAll('editor-host')[currentEditorIndex];
      const inlineRoot = editorHost.querySelectorAll<InlineRootElement>(
        'rich-text [data-v-root="true"]'
      )[i];
      return inlineRoot.inlineEditor.yTextDeltas;
    },
    [i, currentEditorIndex]
  );
  expect(actual).toEqual(deltas);
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
  const actualTexts = await page.evaluate(currentEditorIndex => {
    const editorHost =
      document.querySelectorAll('editor-host')[currentEditorIndex];
    const richTexts = Array.from(
      editorHost?.querySelectorAll<RichText>('rich-text') ?? []
    );
    return richTexts.map(richText => {
      const editor = richText.inlineEditor as AffineInlineEditor;
      return editor.yText.toString();
    });
  }, currentEditorIndex);
  expect(actualTexts).toEqual(texts);
}

export async function assertEdgelessCanvasText(page: Page, text: string) {
  const actualTexts = await page.evaluate(() => {
    const editor = document.querySelector(
      [
        'edgeless-text-editor',
        'edgeless-shape-text-editor',
        'edgeless-frame-title-editor',
        'edgeless-group-title-editor',
        'edgeless-connector-label-editor',
      ].join(',')
    );
    if (!editor) {
      throw new Error('editor not found');
    }
    // @ts-ignore
    const inlineEditor = editor.inlineEditor;
    return inlineEditor?.yText.toString();
  });
  expect(actualTexts).toEqual(text);
}

export async function assertRichImage(page: Page, count: number) {
  const editor = getEditorLocator(page);
  await expect(editor.locator('.resizable-img')).toHaveCount(count);
}

export async function assertDivider(page: Page, count: number) {
  await expect(page.locator('affine-divider')).toHaveCount(count);
}

export async function assertRichDragButton(page: Page) {
  await expect(page.locator('.resize')).toHaveCount(4);
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
  const locator = page.locator('.affine-image-toolbar-container');
  await expect(locator).toBeVisible();
}

export async function assertDocTitleFocus(page: Page) {
  const locator = page.locator('doc-title .inline-editor').nth(0);
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
  await expect(page.locator(`affine-${flavour}`)).toHaveCount(count);
}
export async function assertRowCount(page: Page, count: number) {
  await expect(page.locator('.affine-database-block-row')).toHaveCount(count);
}

export async function assertRichTextInlineRange(
  page: Page,
  richTextIndex: number,
  rangeIndex: number,
  rangeLength = 0
) {
  const actual = await page.evaluate(
    ([richTextIndex, currentEditorIndex]) => {
      const editorHost =
        document.querySelectorAll('editor-host')[currentEditorIndex];
      const richText = editorHost?.querySelectorAll('rich-text')[richTextIndex];
      const inlineEditor = richText.inlineEditor;
      return inlineEditor?.getInlineRange();
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
    const rootModel = window.doc.root as RootBlockModel;
    const note = rootModel.children.find(
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
    ({ richTextIndex, index, currentEditorIndex }) => {
      const editorHost =
        document.querySelectorAll('editor-host')[currentEditorIndex];
      const richText = editorHost.querySelectorAll('rich-text')[richTextIndex];
      const inlineEditor = richText.inlineEditor;
      if (!inlineEditor) {
        throw new Error('Inline editor is undefined');
      }

      const result = inlineEditor.getFormat({
        index,
        length: 0,
      });
      return result;
    },
    { richTextIndex, index, currentEditorIndex }
  );
  expect(actual).toEqual(resultObj);
}

export async function assertRichTextModelType(
  page: Page,
  type: string,
  index = 0
) {
  const actual = await page.evaluate(
    ({ index, BLOCK_ID_ATTR, currentEditorIndex }) => {
      const editorHost =
        document.querySelectorAll('editor-host')[currentEditorIndex];
      const richText = editorHost.querySelectorAll('rich-text')[index];
      const blockElement = richText.closest<BlockElement>(`[${BLOCK_ID_ATTR}]`);

      if (!blockElement) {
        throw new Error('blockElement is undefined');
      }
      return (blockElement.model as BlockModel<{ type: string }>).type;
    },
    { index, BLOCK_ID_ATTR, currentEditorIndex }
  );
  expect(actual).toEqual(type);
}

export async function assertTextFormats(page: Page, resultObj: unknown[]) {
  const actual = await page.evaluate(index => {
    const editorHost = document.querySelectorAll('editor-host')[index];
    const elements = editorHost.querySelectorAll('rich-text');
    return Array.from(elements).map(el => {
      const inlineEditor = el.inlineEditor;
      if (!inlineEditor) {
        throw new Error('Inline editor is undefined');
      }

      const result = inlineEditor.getFormat({
        index: 0,
        length: inlineEditor.yText.length,
      });
      return result;
    });
  }, currentEditorIndex);
  expect(actual).toEqual(resultObj);
}

export async function assertStore(page: Page, expected: SerializedStore) {
  const actual = (await page.evaluate(() => {
    const json = window.collection.doc.toJSON();
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
      const model = element.model as BlockModel;
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
      const model = element.model as BlockModel;
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
      const element = document.querySelector<BlockElement>(
        `[data-block-id="${id}"]`
      );

      if (!element) {
        throw new Error(`Element with id ${id} not found`);
      }

      const model = element.model;
      // @ts-ignore
      return model.type;
    },
    { id }
  );
  expect(actual).toBe(type);
}

export async function assertBlockFlavour(
  page: Page,
  id: string | number,
  flavour: BlockSuite.Flavour
) {
  const actual = await page.evaluate(
    ({ id }) => {
      const element = document.querySelector<BlockElement>(
        `[data-block-id="${id}"]`
      );

      if (!element) {
        throw new Error(`Element with id ${id} not found`);
      }

      const model = element.model;
      return model.flavour;
    },
    { id }
  );
  expect(actual).toBe(flavour);
}

export async function assertBlockTextContent(
  page: Page,
  id: string | number,
  str: string
) {
  const actual = await page.evaluate(
    ({ id }) => {
      const element = document.querySelector<BlockElement>(
        `[data-block-id="${id}"]`
      );

      if (!element) {
        throw new Error(`Element with id ${id} not found`);
      }

      const model = element.model;
      return model.text?.toString() ?? '';
    },
    { id }
  );
  expect(actual).toBe(str);
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
      const model = element.model as BlockModel;
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
    const editor = document.querySelectorAll('affine-editor-container')[index];
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
    window.collection.doc.toJSON()
  )) as SerializedStore;
  const titleNode = jsonDoc['doc:home']['0'] as Record<string, unknown>;

  const markdownVisitor = (node: Record<string, unknown>): string => {
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
    node: Record<string, unknown>,
    visitor: (node: Record<string, unknown>) => string
  ): string[] => {
    if (!('sys:children' in node) || !Array.isArray(node['sys:children'])) {
      throw new Error("Failed to visit nodes: 'sys:children' is not an array");
      // return visitor(node);
    }

    const children = node['sys:children'].map(id => jsonDoc['doc:home'][id]);
    return [
      visitor(node),
      ...children.flatMap(child =>
        visitNodes(child as Record<string, unknown>, visitor).map(line => {
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
  const docId = await getCurrentEditorDocId(page);
  const element = (await page.evaluate(
    ([blockId, docId]) => window.collection.exportJSX(blockId, docId),
    [blockId, docId]
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
  expect(formattedJSX, formattedJSX).toEqual(snapshot.trimStart());
}

type MimeType = 'text/plain' | 'blocksuite/x-c+w' | 'text/html';

export function assertClipItems(_page: Page, _key: MimeType, _value: unknown) {
  // FIXME: use original clipboard API
  // const clipItems = await page.evaluate(() => {
  //   return document
  //     .getElementsByTagName('affine-editor-container')[0]
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

export function assertSameColor(c1?: `#${string}`, c2?: `#${string}`) {
  expect(c1?.toLowerCase()).toEqual(c2?.toLowerCase());
}

type Rect = { x: number; y: number; w: number; h: number };

export async function assertNoteRectEqual(
  page: Page,
  noteId: string,
  expected: Rect
) {
  const rect = await getNoteRect(page, noteId);
  assertRectEqual(rect, expected);
}

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

export async function assertEdgelessDraggingArea(page: Page, xywh: number[]) {
  const [x, y, w, h] = xywh;
  const editor = getEditorLocator(page);
  const draggingArea = editor
    .locator('edgeless-dragging-area-rect')
    .locator('.affine-edgeless-dragging-area');

  const box = await draggingArea.boundingBox();
  if (!box) throw new Error('Missing edgeless dragging area');

  expect(box.x).toBeCloseTo(x, 0);
  expect(box.y).toBeCloseTo(y, 0);
  expect(box.width).toBeCloseTo(w, 0);
  expect(box.height).toBeCloseTo(h, 0);
}

export async function assertEdgelessSelectedRect(page: Page, xywh: number[]) {
  const [x, y, w, h] = xywh;
  const editor = getEditorLocator(page);
  const selectedRect = editor
    .locator('edgeless-selected-rect')
    .locator('.affine-edgeless-selected-rect');
  // FIXME: remove this timeout
  await page.waitForTimeout(50);
  const box = await selectedRect.boundingBox();
  if (!box) throw new Error('Missing edgeless selected rect');

  expect(box.x).toBeCloseTo(x, 0);
  expect(box.y).toBeCloseTo(y, 0);
  expect(box.width).toBeCloseTo(w, 0);
  expect(box.height).toBeCloseTo(h, 0);
}

export async function assertEdgelessSelectedRectModel(
  page: Page,
  xywh: number[]
) {
  const [x, y, w, h] = xywh;
  const box = await getEdgelessSelectedRectModel(page);

  expect(box[0]).toBeCloseTo(x, 0);
  expect(box[1]).toBeCloseTo(y, 0);
  expect(box[2]).toBeCloseTo(w, 0);
  expect(box[3]).toBeCloseTo(h, 0);
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

export async function assertEdgelessSelectedReactCursor(
  page: Page,
  expected: (
    | {
        mode: 'resize';
        handle:
          | 'top'
          | 'right'
          | 'bottom'
          | 'left'
          | 'top-left'
          | 'top-right'
          | 'bottom-right'
          | 'bottom-left';
      }
    | {
        mode: 'rotate';
        handle: 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';
      }
  ) & {
    cursor: string;
  }
) {
  const editor = getEditorLocator(page);
  const selectedRect = editor
    .locator('edgeless-selected-rect')
    .locator('.affine-edgeless-selected-rect');

  const handle = selectedRect
    .getByLabel(expected.handle, { exact: true })
    .locator(`.${expected.mode}`);

  await handle.hover();
  await expect(handle).toHaveCSS('cursor', expected.cursor);
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
      const noteWrapper = ele
        .closest<HTMLDivElement>('.edgeless-block-portal-note')
        ?.querySelector<HTMLDivElement>('.note-background');
      if (!noteWrapper) {
        throw new Error(`Could not find note: ${noteId}`);
      }
      return noteWrapper.style.background;
    });

  expect(backgroundColor).toEqual(`var(${color})`);
}

function toHex(color: string) {
  let r, g, b;

  if (color.startsWith('#')) {
    color = color.substr(1);
    if (color.length === 3) {
      color = color.replace(/./g, '$&$&');
    }
    [r, g, b] = color.match(/.{2}/g)?.map(hex => parseInt(hex, 16)) ?? [];
  } else if (color.startsWith('rgba')) {
    [r, g, b] = color.match(/\d+/g)?.map(Number) ?? [];
  } else if (color.startsWith('rgb')) {
    [r, g, b] = color.match(/\d+/g)?.map(Number) ?? [];
  } else {
    throw new Error('Invalid color format');
  }

  if (r === undefined || g === undefined || b === undefined) {
    throw new Error('Invalid color format');
  }

  const hex = ((r << 16) | (g << 8) | b).toString(16);
  return '#' + '0'.repeat(6 - hex.length) + hex;
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
  expect(z).toBe(Math.ceil(zoom));
}

export async function assertConnectorPath(
  page: Page,
  path: number[][],
  index = 0
) {
  const actualPath = await getConnectorPath(page, index);
  actualPath.every((p, i) => assertPointAlmostEqual(p, path[i], 0.1));
}

export function assertRectExist(
  rect: { x: number; y: number; width: number; height: number } | null
): asserts rect is { x: number; y: number; width: number; height: number } {
  expect(rect).not.toBe(null);
}

export async function assertSelectedBound(
  page: Page,
  expected: Bound,
  index = 0
) {
  const bound = await getSelectedBound(page, index);
  assertBound(bound, expected);
}

/**
 * asserts all groups and they children count at the same time
 * @param page
 * @param expected the expected group id and the count of of its children
 */
export async function assertGroupIds(
  page: Page,
  expected: Record<string, number>
) {
  const ids = await getGroupIds(page);
  const result = toIdCountMap(ids);

  expect(result).toEqual(expected);
}

export async function assertSortedIds(page: Page, expected: string[]) {
  const ids = await getSortedIdsInViewport(page);
  expect(ids).toEqual(expected);
}

export async function assertGroupChildrenIds(
  page: Page,
  expected: Record<string, number>,
  id: string
) {
  const ids = await getGroupChildrenIds(page, id);
  const result = toIdCountMap(ids);

  expect(result).toEqual(expected);
}

export async function assertGroupOfElements(
  page: Page,
  elements: string[],
  groupId: string
) {
  const elementGroups = await getGroupOfElements(page, elements);

  elementGroups.forEach(elementGroup => {
    expect(elementGroup).toEqual(groupId);
  });
}

/**
 * Assert the given group has the expected children count.
 * And the children's group id should equal to the given group id.
 * @param page
 * @param groupId
 * @param childrenCount
 */
export async function assertGroupChildren(
  page: Page,
  groupId: string,
  childrenCount: number
) {
  const ids = await getGroupChildrenIds(page, groupId);

  await assertGroupOfElements(page, ids, groupId);
  expect(new Set(ids).size).toBe(childrenCount);
}

export async function assertCanvasElementsCount(page: Page, expected: number) {
  const number = await getCanvasElementsCount(page);
  expect(number).toEqual(expected);
}

export function assertBound(received: Bound, expected: Bound) {
  expect(received[0]).toBeCloseTo(expected[0], 0);
  expect(received[1]).toBeCloseTo(expected[1], 0);
  expect(received[2]).toBeCloseTo(expected[2], 0);
  expect(received[3]).toBeCloseTo(expected[3], 0);
}

export async function assertClipboardItem(
  page: Page,
  data: unknown,
  type: string
) {
  type Args = [type: string];
  const dataInClipboard = await page.evaluate(
    async ([type]: Args) => {
      const clipItems = await navigator.clipboard.read();
      const item = clipItems.find(item => item.types.includes(type));
      const data = await item?.getType(type);
      return data?.text();
    },
    [type] as Args
  );

  expect(dataInClipboard).toBe(data);
}

export async function assertClipboardCustomData(
  page: Page,
  type: string,
  data: unknown
) {
  const dataInClipboard = await getClipboardCustomData(page, type);
  expect(dataInClipboard).toBe(data);
}

export function assertClipData(
  clipItems: { mimeType: string; data: unknown }[],
  expectClipItems: { mimeType: string; data: unknown }[],
  type: string
) {
  expect(clipItems.find(item => item.mimeType === type)?.data).toBe(
    expectClipItems.find(item => item.mimeType === type)?.data
  );
}

export async function assertHasClass(locator: Locator, className: string) {
  expect(
    (await locator.getAttribute('class'))?.split(' ').includes(className)
  ).toEqual(true);
}

export async function assertNotHasClass(locator: Locator, className: string) {
  expect(
    (await locator.getAttribute('class'))?.split(' ').includes(className)
  ).toEqual(false);
}

export async function assertNoteSequence(page: Page, expected: string) {
  const actual = await page.locator('.edgeless-index-label').innerText();
  expect(expected).toBe(actual);
}

export async function assertBlockSelections(page: Page, paths: string[]) {
  const selections = await page.evaluate(() => {
    const host = document.querySelector<EditorHost>('editor-host');
    if (!host) {
      throw new Error('editor-host host not found');
    }
    return host.selection.filter('block');
  });
  const actualPaths = selections.map(selection => selection.blockId);
  expect(actualPaths).toEqual(paths);
}

export async function assertConnectorStrokeColor(
  page: Page,
  color: CssVariableName
) {
  const colorButton = page
    .locator('edgeless-change-connector-button')
    .locator('edgeless-color-panel')
    .locator(`.color-unit[aria-label="${color}"]`);

  expect(await colorButton.count()).toBe(1);
}
