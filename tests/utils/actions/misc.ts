/* eslint-disable @typescript-eslint/no-restricted-imports */
import '../declare-test-window.js';

import type { ConsoleMessage, Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import type { ClipboardItem } from '../../../packages/blocks/src/_legacy/clipboard/clipboard-item.js';
import {
  type CssVariableName,
  type DatabaseBlockModel,
  type ListType,
  type PageBlockModel,
  type ThemeObserver,
} from '../../../packages/blocks/src/index.js';
import { assertExists } from '../../../packages/global/src/utils.js';
import type { DebugMenu } from '../../../packages/playground/apps/starter/components/debug-menu.js';
import type { RichText } from '../../../packages/playground/examples/virgo/test-page.js';
import type { BaseBlockModel } from '../../../packages/store/src/index.js';
import {
  type VirgoRootElement,
  type VRange,
} from '../../../packages/virgo/src/index.js';
import { currentEditorIndex, multiEditor } from '../multiple-editor.js';
import {
  pressEnter,
  pressSpace,
  pressTab,
  SHORT_KEY,
  type,
} from './keyboard.js';

declare global {
  interface WindowEventMap {
    'blocksuite:page-ready': CustomEvent<string>;
  }
}

export const defaultPlaygroundURL = new URL(`http://localhost:5173/starter/`);

const NEXT_FRAME_TIMEOUT = 100;
const DEFAULT_PLAYGROUND = defaultPlaygroundURL.toString();
const RICH_TEXT_SELECTOR = '.virgo-editor';

function shamefullyIgnoreConsoleMessage(message: ConsoleMessage): boolean {
  if (!process.env.CI) {
    return true;
  }
  const ignoredMessages = [
    // basic.spec.ts
    "Caught error while handling a Yjs update TypeError: Cannot read properties of undefined (reading 'toJSON')",
    // clipboard.spec.ts
    "TypeError: Cannot read properties of null (reading 'model')",
    // basic.spec.ts › should readonly mode not be able to modify text
    'cannot modify data in readonly mode',
    // Firefox warn on quill
    // See https://github.com/quilljs/quill/issues/2030
    '[JavaScript Warning: "Use of Mutation Events is deprecated. Use MutationObserver instead."',
    "addRange(): The given range isn't in document.",
    //#region embed.spec.ts
    'Failed to load resource: the server responded with a status of 404 (Not Found)',
    'Error while getting blob HTTPError: Request failed with status code 404 Not Found',
    'Error: Failed to fetch blob',
    'Error: Cannot find blob',
    'Cannot find blob',
    //#endregion
  ];
  return ignoredMessages.some(msg => message.text().startsWith(msg));
}

function generateRandomRoomId() {
  return `playwright-${Math.random().toFixed(8).substring(2)}`;
}

export const getSelectionRect = async (page: Page): Promise<DOMRect> => {
  const rect = await page.evaluate(() => {
    return getSelection()?.getRangeAt(0).getBoundingClientRect();
  });
  assertExists(rect);
  return rect;
};

/**
 * @example
 * ```ts
 * await initEmptyEditor(page, { enable_some_flag: true });
 * ```
 */
async function initEmptyEditor({
  page,
  flags = {},
  noInit = false,
  multiEditor = false,
}: {
  page: Page;
  flags?: Partial<BlockSuiteFlags>;
  noInit?: boolean;
  multiEditor?: boolean;
}) {
  await page.evaluate(
    ([flags, noInit, multiEditor]) => {
      const { workspace } = window;

      async function initPage(page: ReturnType<typeof workspace.createPage>) {
        page.waitForLoaded();
        for (const [key, value] of Object.entries(flags)) {
          page.awarenessStore.setFlag(key as keyof typeof flags, value);
        }
        // add app root from https://github.com/toeverything/blocksuite/commit/947201981daa64c5ceeca5fd549460c34e2dabfa
        const appRoot = document.querySelector('#app');
        if (!appRoot) {
          throw new Error('Cannot find app root element(#app).');
        }
        const createEditor = () => {
          const editor = document.createElement('editor-container');
          editor.page = page;
          editor.autofocus = true;
          editor.slots.pageLinkClicked.on(({ pageId }) => {
            const newPage = workspace.getPage(pageId);
            if (!newPage) {
              throw new Error(`Failed to jump to page ${pageId}`);
            }
            editor.page = newPage;
          });
          appRoot.append(editor);
          editor.createBlockHub().then(blockHub => {
            document.body.appendChild(blockHub);
          });
          return editor;
        };
        const editor = createEditor();
        if (multiEditor) createEditor();

        const debugMenu: DebugMenu = document.createElement('debug-menu');
        debugMenu.workspace = workspace;
        debugMenu.editor = editor;
        debugMenu.contentParser = editor.createContentParser();
        document.body.appendChild(debugMenu);
        window.debugMenu = debugMenu;
        window.editor = editor;
        window.page = page;
        window.dispatchEvent(
          new CustomEvent('blocksuite:page-ready', { detail: page.id })
        );
      }

      if (noInit) {
        workspace.meta.pageMetas.forEach(meta => {
          const pageId = meta.id;
          const page = workspace.getPage(pageId);
          if (page) {
            initPage(page);
          }
        });
        workspace.slots.pageAdded.on(pageId => {
          const page = workspace.getPage(pageId);
          if (!page) {
            throw new Error(`Failed to get page ${pageId}`);
          }
          initPage(page);
        });
      } else {
        const page = workspace.createPage({ id: 'page:home' });
        page.waitForLoaded().then(() => {
          initPage(page);
        });
      }
    },
    [flags, noInit, multiEditor] as const
  );
  await waitNextFrame(page);
}

export const getEditorLocator = (page: Page) => {
  return page.locator('editor-container').nth(currentEditorIndex);
};
export const getBlockHub = (page: Page) => {
  return page.locator('affine-block-hub').nth(currentEditorIndex);
};

export async function enterPlaygroundRoom(
  page: Page,
  ops?: {
    flags?: Partial<BlockSuiteFlags>;
    room?: string;
    blobStorage?: ('memory' | 'idb' | 'mock')[];
    noInit?: boolean;
  }
) {
  const url = new URL(DEFAULT_PLAYGROUND);
  let room = ops?.room;
  const blobStorage = ops?.blobStorage;
  if (!room) {
    room = generateRandomRoomId();
  }
  url.searchParams.set('room', room);
  url.searchParams.set('blobStorage', blobStorage?.join(',') || 'idb');
  await page.goto(url.toString());
  const readyPromise = waitForPageReady(page);

  // See https://github.com/microsoft/playwright/issues/5546
  // See https://github.com/microsoft/playwright/discussions/17813
  page.on('console', message => {
    const ignore = shamefullyIgnoreConsoleMessage(message);
    if (!ignore) {
      expect('Unexpected console message: ' + message.text()).toBe(
        'Please remove the "console.log" statements from the code. It is advised not to output logs in a production environment.'
      );
      // throw new Error('Unexpected console message: ' + message.text());
    }
    if (message.type() === 'warning') {
      console.warn(message.text());
    }
    if (message.type() === 'error') {
      console.error('Unexpected console error: ' + message.text());
    }
  });

  // Log all uncaught errors
  page.on('pageerror', exception => {
    throw new Error(`Uncaught exception: "${exception}"\n${exception.stack}`);
  });

  await initEmptyEditor({
    page,
    flags: ops?.flags,
    noInit: ops?.noInit,
    multiEditor,
  });

  await readyPromise;

  await page.evaluate(() => {
    if (typeof window.$blocksuite !== 'object') {
      throw new Error('window.$blocksuite is not object');
    }
  }, []);
  return room;
}

export async function waitDefaultPageLoaded(page: Page) {
  await page.waitForSelector('affine-doc-page[data-block-id="0"]');
}

export async function waitEmbedLoaded(page: Page) {
  await page.waitForSelector('.resizable-img');
}

export async function waitNextFrame(
  page: Page,
  frameTimeout = NEXT_FRAME_TIMEOUT
) {
  await page.waitForTimeout(frameTimeout);
}

export async function waitForPageReady(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>(resolve => {
        window.addEventListener('blocksuite:page-ready', () => resolve(), {
          once: true,
        });
      })
  );
}

export async function clearLog(page: Page) {
  await page.evaluate(() => console.clear());
}

export async function captureHistory(page: Page) {
  await page.evaluate(() => {
    window.page.captureSync();
  });
}

export async function resetHistory(page: Page) {
  await page.evaluate(() => {
    const space = window.page;
    space.resetHistory();
  });
}

// XXX: This doesn't add surface yet, the page state should not be switched to edgeless.
export async function enterPlaygroundWithList(
  page: Page,
  contents: string[] = ['', '', ''],
  type: ListType = 'bulleted'
) {
  const room = generateRandomRoomId();
  await page.goto(`${DEFAULT_PLAYGROUND}?room=${room}`);
  await initEmptyEditor({ page });

  await page.evaluate(
    async ({ contents, type }: { contents: string[]; type: ListType }) => {
      const { page } = window;
      await page.waitForLoaded();

      const pageId = page.addBlock('affine:page', {
        title: new page.Text(),
      });
      const noteId = page.addBlock('affine:note', {}, pageId);
      for (let i = 0; i < contents.length; i++) {
        page.addBlock(
          'affine:list',
          contents.length > 0
            ? { text: new page.Text(contents[i]), type }
            : { type },
          noteId
        );
      }
    },
    { contents, type }
  );
  await waitNextFrame(page);
}

// XXX: This doesn't add surface yet, the page state should not be switched to edgeless.
export async function initEmptyParagraphState(page: Page, pageId?: string) {
  const ids = await page.evaluate(async pageId => {
    const { page } = window;
    await page.waitForLoaded();
    page.captureSync();

    if (!pageId) {
      pageId = page.addBlock('affine:page', {
        title: new page.Text(),
      });
    }

    const noteId = page.addBlock('affine:note', {}, pageId);
    const paragraphId = page.addBlock('affine:paragraph', {}, noteId);
    // page.addBlock('affine:surface', {}, pageId);
    page.captureSync();
    return { pageId, noteId, paragraphId };
  }, pageId);
  return ids;
}

export async function initEmptyEdgelessState(page: Page) {
  const ids = await page.evaluate(async () => {
    const { page } = window;
    await page.waitForLoaded();

    const pageId = page.addBlock('affine:page', {
      title: new page.Text(),
    });
    page.addBlock('affine:surface', {}, pageId);
    const noteId = page.addBlock('affine:note', {}, pageId);
    const paragraphId = page.addBlock('affine:paragraph', {}, noteId);
    page.resetHistory();

    return { pageId, noteId, paragraphId };
  });
  return ids;
}

export async function initEmptyDatabaseState(page: Page, pageId?: string) {
  const ids = await page.evaluate(async pageId => {
    const { page } = window;
    await page.waitForLoaded();

    page.captureSync();
    if (!pageId) {
      pageId = page.addBlock('affine:page', {
        title: new page.Text(),
      });
    }
    const noteId = page.addBlock('affine:note', {}, pageId);
    const databaseId = page.addBlock(
      'affine:database',
      {
        title: new page.Text('Database 1'),
      },
      noteId
    );
    const model = page.getBlockById(databaseId) as DatabaseBlockModel;
    model.initEmpty('table');
    model.applyColumnUpdate();
    page.captureSync();
    return { pageId, noteId, databaseId };
  }, pageId);
  return ids;
}

export async function initKanbanViewState(
  page: Page,
  config: {
    rows: string[];
    columns: { type: string; value?: unknown[] }[];
  },
  pageId?: string
) {
  const ids = await page.evaluate(
    async ({ pageId, config }) => {
      const { page } = window;
      await page.waitForLoaded();

      page.captureSync();
      if (!pageId) {
        pageId = page.addBlock('affine:page', {
          title: new page.Text(),
        });
      }
      const noteId = page.addBlock('affine:note', {}, pageId);
      const databaseId = page.addBlock(
        'affine:database',
        {
          title: new page.Text('Database 1'),
        },
        noteId
      );
      const model = page.getBlockById(databaseId) as DatabaseBlockModel;
      const database = page.getBlockById(databaseId) as DatabaseBlockModel;

      const rowIds = config.rows.map(rowText => {
        const rowId = page.addBlock(
          'affine:paragraph',
          { type: 'text', text: new page.Text(rowText) },
          databaseId
        );
        return rowId;
      });
      config.columns.forEach(column => {
        const columnId = database.addColumn('end', {
          data: {},
          name: column.type,
          type: column.type,
        });
        rowIds.forEach((rowId, index) => {
          const value = column.value?.[index];
          if (value !== undefined) {
            model.updateCell(rowId, {
              columnId,
              value,
            });
          }
        });
      });

      model.initEmpty('kanban');
      model.applyColumnUpdate();
      page.captureSync();
      return { pageId, noteId, databaseId };
    },
    { pageId, config }
  );
  return ids;
}

export async function initEmptyDatabaseWithParagraphState(
  page: Page,
  pageId?: string
) {
  const ids = await page.evaluate(async pageId => {
    const { page } = window;
    await page.waitForLoaded();

    page.captureSync();
    if (!pageId) {
      pageId = page.addBlock('affine:page', {
        title: new page.Text(),
      });
    }
    const noteId = page.addBlock('affine:note', {}, pageId);
    const databaseId = page.addBlock(
      'affine:database',
      {
        title: new page.Text('Database 1'),
      },
      noteId
    );
    const model = page.getBlockById(databaseId) as DatabaseBlockModel;
    model.initEmpty('table');
    model.applyColumnUpdate();
    page.addBlock('affine:paragraph', {}, noteId);
    page.captureSync();
    return { pageId, noteId, databaseId };
  }, pageId);
  return ids;
}

export async function initDatabaseRow(page: Page) {
  const editor = getEditorLocator(page);
  const addRow = editor.locator('.data-view-table-group-add-row');
  await addRow.click();
}

export async function initDatabaseRowWithData(page: Page, data: string) {
  await initDatabaseRow(page);
  await waitNextFrame(page, 50);
  await type(page, data);
}

export async function initDatabaseDynamicRowWithData(
  page: Page,
  data: string,
  addRow = false,
  index = 0
) {
  const editor = getEditorLocator(page);
  if (addRow) {
    await initDatabaseRow(page);
  }
  await focusDatabaseTitle(page);
  const lastRow = editor.locator('.affine-database-block-row').last();
  const cell = lastRow.locator('.database-cell').nth(index + 1);
  await cell.click();
  await waitNextFrame(page);
  await type(page, data);
  await pressEnter(page);
}

export async function focusDatabaseTitle(page: Page) {
  const dbTitle = page.locator('[data-block-is-database-title="true"]');
  await dbTitle.click();

  await page.evaluate(() => {
    const dbTitle = document.querySelector(
      'affine-database-title rich-text'
    ) as RichText | null;
    if (!dbTitle) {
      throw new Error('Cannot find database title');
    }

    dbTitle.vEditor.focusEnd();
  });
  await waitNextFrame(page);
}

export async function assertDatabaseColumnOrder(page: Page, order: string[]) {
  const columns = await page
    .locator('affine-database-column-header')
    .locator('affine-database-header-column')
    .all();
  expect(await Promise.all(columns.slice(1).map(v => v.innerText()))).toEqual(
    order
  );
}

export async function initEmptyCodeBlockState(
  page: Page,
  codeBlockProps = {} as { language?: string }
) {
  const ids = await page.evaluate(async codeBlockProps => {
    const { page } = window;
    await page.waitForLoaded();

    page.captureSync();
    const pageId = page.addBlock('affine:page');
    const noteId = page.addBlock('affine:note', {}, pageId);
    const codeBlockId = page.addBlock('affine:code', codeBlockProps, noteId);
    page.captureSync();
    return { pageId, noteId, codeBlockId };
  }, codeBlockProps);
  await page.waitForSelector(`[data-block-id="${ids.codeBlockId}"] rich-text`);
  return ids;
}

type FocusRichTextOptions = {
  clickPosition?: { x: number; y: number };
};

export async function focusRichText(
  page: Page,
  i = 0,
  options?: FocusRichTextOptions
) {
  await page.mouse.move(0, 0);
  const editor = getEditorLocator(page);
  const locator = editor.locator(RICH_TEXT_SELECTOR).nth(i);
  // need to set `force` to true when clicking on `affine-selected-blocks`
  await locator.click({ force: true, position: options?.clickPosition });
}

export async function focusRichTextEnd(page: Page, i = 0) {
  await page.evaluate(
    ([i]) => {
      const editor = document.querySelectorAll('editor-container')[i];
      const richTexts = Array.from(editor.querySelectorAll('rich-text'));

      richTexts[i].vEditor?.focusEnd();
    },
    [i, currentEditorIndex]
  );
  await waitNextFrame(page);
}

export async function initThreeParagraphs(page: Page) {
  await focusRichText(page);
  await type(page, '123');
  await pressEnter(page);
  await type(page, '456');
  await pressEnter(page);
  await type(page, '789');
  await resetHistory(page);
}

export async function initSixParagraphs(page: Page) {
  await focusRichText(page);
  await type(page, '1');
  await pressEnter(page);
  await type(page, '2');
  await pressEnter(page);
  await type(page, '3');
  await pressEnter(page);
  await type(page, '4');
  await pressEnter(page);
  await type(page, '5');
  await pressEnter(page);
  await type(page, '6');
  await resetHistory(page);
}

export async function initThreeLists(page: Page) {
  await focusRichText(page);
  await type(page, '-');
  await pressSpace(page);
  await type(page, '123');
  await pressEnter(page);
  await type(page, '456');
  await pressEnter(page);
  await pressTab(page);
  await type(page, '789');
}

export async function insertThreeLevelLists(page: Page, i = 0) {
  await focusRichText(page, i);
  await type(page, '-');
  await pressSpace(page);
  await type(page, '123');
  await pressEnter(page);
  await pressTab(page);
  await type(page, '456');
  await pressEnter(page);
  await pressTab(page);
  await type(page, '789');
}

export async function initThreeDividers(page: Page) {
  await focusRichText(page);
  await type(page, '123');
  await pressEnter(page);
  await type(page, '---');
  await pressSpace(page);
  await type(page, '---');
  await pressSpace(page);
  await type(page, '---');
  await pressSpace(page);
  await type(page, '123');
}

export async function initParagraphsByCount(page: Page, count: number) {
  await focusRichText(page);
  for (let i = 0; i < count; i++) {
    await type(page, `paragraph ${i}`);
    await pressEnter(page);
  }
  await resetHistory(page);
}

export async function getVirgoSelectionIndex(page: Page) {
  return await page.evaluate(() => {
    const selection = window.getSelection() as Selection;

    const range = selection.getRangeAt(0);
    const component = range.startContainer.parentElement?.closest('rich-text');
    const index = component?.vEditor?.getVRange()?.index;
    return index !== undefined ? index : -1;
  });
}

export async function getVirgoSelectionText(page: Page) {
  return await page.evaluate(() => {
    const selection = window.getSelection() as Selection;
    const range = selection.getRangeAt(0);
    const component = range.startContainer.parentElement?.closest('rich-text');
    return component?.vEditor?.yText.toString() ?? '';
  });
}

export async function getSelectedTextByVirgo(page: Page) {
  return await page.evaluate(() => {
    const selection = window.getSelection() as Selection;
    const range = selection.getRangeAt(0);
    const component = range.startContainer.parentElement?.closest('rich-text');

    const vRange = component?.vEditor?.getVRange();
    if (!vRange) return '';

    const { index, length } = vRange;
    return component?.vEditor?.yText.toString().slice(index, length) || '';
  });
}

export async function getSelectedText(page: Page) {
  return await page.evaluate(() => {
    let content = '';
    const selection = window.getSelection() as Selection;

    if (selection.rangeCount === 0) return content;

    const range = selection.getRangeAt(0);
    const components =
      range.commonAncestorContainer.parentElement?.querySelectorAll(
        'rich-text'
      ) || [];

    components.forEach(component => {
      const vRange = component.vEditor?.getVRange();
      if (!vRange) return;
      const { index, length } = vRange;
      content +=
        component?.vEditor?.yText.toString().slice(index, index + length) || '';
    });

    return content;
  });
}

export async function setVRangeInSelectedRichText(
  page: Page,
  index: number,
  length: number
) {
  await page.evaluate(
    ({ index, length }) => {
      const selection = window.getSelection() as Selection;

      const range = selection.getRangeAt(0);
      const component =
        range.startContainer.parentElement?.closest('rich-text');
      component?.vEditor?.setVRange({
        index,
        length,
      });
    },
    { index, length }
  );
  await waitNextFrame(page);
}

export async function setVRangeInVEditor(page: Page, vRange: VRange, i = 0) {
  await page.evaluate(
    ({ i, vRange }) => {
      const vEditor = document.querySelectorAll<VirgoRootElement>(
        '[data-virgo-root="true"]'
      )[i]?.virgoEditor;
      if (!vEditor) {
        throw new Error('Cannot find vEditor');
      }
      vEditor.setVRange(vRange);
    },
    { i, vRange }
  );
  await waitNextFrame(page);
}

export async function pasteContent(
  page: Page,
  clipData: Record<string, unknown>
) {
  await page.evaluate(
    ({ clipData }) => {
      const e = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer(),
      });
      Object.defineProperty(e, 'target', {
        writable: false,
        value: document,
      });
      Object.keys(clipData).forEach(key => {
        e.clipboardData?.setData(key, clipData[key] as string);
      });
      document.dispatchEvent(e);
    },
    { clipData }
  );
  await waitNextFrame(page);
}

export async function pasteBlocks(page: Page, json: unknown) {
  const createHTMLStringForCustomData = (data: string, type: string) => {
    return `<blocksuite style="display: none" data-type="${type}" data-clipboard="${data.replace(
      /"/g,
      '&quot;'
    )}"></blocksuite>`;
  };
  const stringifiesData = JSON.stringify(json);

  const customClipboardFragment = createHTMLStringForCustomData(
    stringifiesData,
    'blocksuite/page'
  );

  await pasteContent(page, {
    'text/html': customClipboardFragment,
    'blocksuite/page': stringifiesData,
  });
}

export async function importMarkdown(
  page: Page,
  focusedBlockId: string,
  data: string
) {
  await page.evaluate(
    ({ data, focusedBlockId }) => {
      const contentParser = new window.ContentParser(window.page);
      contentParser.importMarkdown(data, focusedBlockId);
    },
    { data, focusedBlockId }
  );
}

export async function setSelection(
  page: Page,
  anchorBlockId: number,
  anchorOffset: number,
  focusBlockId: number,
  focusOffset: number
) {
  await page.evaluate(
    ({ anchorBlockId, anchorOffset, focusBlockId, focusOffset }) => {
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      const anchorRichText = document.querySelector<RichText>(
        `[data-block-id="${anchorBlockId}"] rich-text`
      )!;
      const anchorRichTextRange = anchorRichText.vEditor.toDomRange({
        index: anchorOffset,
        length: 0,
      })!;
      const focusRichText = document.querySelector<RichText>(
        `[data-block-id="${focusBlockId}"] rich-text`
      )!;
      const focusRichTextRange = focusRichText.vEditor.toDomRange({
        index: focusOffset,
        length: 0,
      })!;

      const sl = getSelection();
      if (!sl) throw new Error('Cannot get selection');
      const range = document.createRange();
      range.setStart(
        anchorRichTextRange.startContainer,
        anchorRichTextRange.startOffset
      );
      range.setEnd(
        focusRichTextRange.startContainer,
        focusRichTextRange.startOffset
      );
      sl.removeAllRanges();
      sl.addRange(range);
    },
    { anchorBlockId, anchorOffset, focusBlockId, focusOffset }
  );
}

export async function readClipboardText(
  page: Page,
  type: 'input' | 'textarea' = 'input'
) {
  const id = 'clipboard-test';
  const selector = `#${id}`;
  await page.evaluate(
    ({ type, id }) => {
      const input = document.createElement(type);
      input.setAttribute('id', id);
      document.body.appendChild(input);
    },
    { type, id }
  );
  const input = page.locator(selector);
  await input.focus();
  await page.keyboard.press(`${SHORT_KEY}+v`);
  const text = await input.inputValue();
  await page.evaluate(
    ({ selector }) => {
      const input = document.querySelector(selector);
      input?.remove();
    },
    { selector }
  );
  return text;
}

export const getCenterPosition: (
  page: Page,
  // TODO use `locator` directly
  selector: string
) => Promise<{ x: number; y: number }> = async (
  page: Page,
  selector: string
) => {
  const locator = page.locator(selector);
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error("Failed to getCenterPosition! Can't get bounding box");
  }
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
};

export const getCenterPositionByLocator: (
  page: Page,
  locator: Locator
) => Promise<{ x: number; y: number }> = async (
  _page: Page,
  locator: Locator
) => {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error("Failed to getCenterPosition! Can't get bounding box");
  }
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
};

/**
 * @deprecated Use `page.locator(selector).boundingBox()` instead
 */
export const getBoundingClientRect: (
  page: Page,
  selector: string
) => Promise<DOMRect> = async (page: Page, selector: string) => {
  return await page.evaluate((selector: string) => {
    return document.querySelector(selector)?.getBoundingClientRect() as DOMRect;
  }, selector);
};

export async function getBoundingBox(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Missing column box');
  return box;
}

export async function getBlockModel<Model extends BaseBlockModel>(
  page: Page,
  blockId: string
) {
  const result: BaseBlockModel | null | undefined = await page.evaluate(
    blockId => {
      return window.page?.getBlockById(blockId);
    },
    blockId
  );
  expect(result).not.toBeNull();
  return result as Model;
}

export async function getIndexCoordinate(
  page: Page,
  [richTextIndex, vIndex]: [number, number],
  coordOffSet: { x: number; y: number } = { x: 0, y: 0 }
) {
  const coord = await page.evaluate(
    ({ richTextIndex, vIndex, coordOffSet }) => {
      const richText = document.querySelectorAll('rich-text')[
        richTextIndex
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any;
      const domRange = richText.vEditor.toDomRange({
        index: vIndex,
        length: 0,
      });
      const pointBound = domRange.getBoundingClientRect();
      return {
        x: pointBound.left + coordOffSet.x,
        y: pointBound.top + pointBound.height / 2 + coordOffSet.y,
      };
    },
    {
      richTextIndex,
      vIndex,
      coordOffSet,
    }
  );
  return coord;
}

export function virgoEditorInnerTextToString(innerText: string): string {
  return innerText.replace('\u200B', '').trim();
}

export async function focusTitle(page: Page) {
  // click to ensure editor is active
  await page.mouse.move(0, 0);
  const editor = getEditorLocator(page);
  const locator = editor.locator('affine-doc-page').first();
  // need to set `force` to true when clicking on `affine-selected-blocks`
  await locator.click({ force: true });
  // avoid trigger double click
  await page.waitForTimeout(500);
  await page.evaluate(i => {
    const defaultPageComponent =
      document.querySelectorAll('affine-doc-page')[i];
    if (!defaultPageComponent) {
      throw new Error('default page component not found');
    }
    defaultPageComponent.titleVEditor.focusEnd();
  }, currentEditorIndex);
  await waitNextFrame(page);
}

/**
 * XXX: this is a workaround for the bug in Playwright
 */
export async function shamefullyBlurActiveElement(page: Page) {
  await page.evaluate(() => {
    if (
      !document.activeElement ||
      !(document.activeElement instanceof HTMLElement)
    ) {
      throw new Error("document.activeElement doesn't exist");
    }
    document.activeElement.blur();
  });
}

/**
 * FIXME:
 * Sometimes virgo state is not updated in time. Bad case like below:
 *
 * ```
 * await focusRichText(page);
 * await type(page, 'hello');
 * await assertRichTexts(page, ['hello']);
 * ```
 *
 * output(failed or flaky):
 *
 * ```
 * - Expected  - 1
 * + Received  + 1
 *   Array [
 * -   "hello",
 * +   "ello",
 *   ]
 * ```
 *
 */
export async function waitForVirgoStateUpdated(page: Page) {
  return await page.evaluate(async () => {
    const selection = window.getSelection() as Selection;

    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const component = range.startContainer.parentElement?.closest('rich-text');
    await component?.vEditor?.waitForUpdate();
  });
}

export async function initImageState(page: Page) {
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.evaluate(() => {
    const clipData = {
      'text/html': `<img src='${location.origin}/test-card-1.png' />`,
    };
    const e = new ClipboardEvent('paste', {
      clipboardData: new DataTransfer(),
    });
    Object.defineProperty(e, 'target', {
      writable: false,
      value: document.body,
    });
    Object.entries(clipData).forEach(([key, value]) => {
      e.clipboardData?.setData(key, value);
    });
    document.dispatchEvent(e);
  });

  // due to pasting img calls fetch, so we need timeout for downloading finished.
  await page.waitForTimeout(500);
}

export async function getCurrentEditorPageId(page: Page) {
  return await page.evaluate(index => {
    const editor = document.querySelectorAll('editor-container')[index];
    if (!editor) throw new Error("Can't find editor-container");
    const pageId = editor.page.id;
    return pageId;
  }, currentEditorIndex);
}

export async function getCurrentHTMLTheme(page: Page) {
  const root = page.locator('html');
  return await root.getAttribute('data-theme');
}

export async function getCurrentEditorTheme(page: Page) {
  const mode = await page
    .locator('editor-container')
    .first()
    .evaluate(ele => {
      return (ele as unknown as Element & { themeObserver: ThemeObserver })
        .themeObserver.cssVariables?.['--affine-theme-mode'];
    });
  return mode;
}

export async function getCurrentThemeCSSPropertyValue(
  page: Page,
  property: CssVariableName
) {
  const value = await page
    .locator('editor-container')
    .evaluate((ele, property: CssVariableName) => {
      return (ele as unknown as Element & { themeObserver: ThemeObserver })
        .themeObserver.cssVariables?.[property];
    }, property);
  return value;
}

export async function transformMarkdown(page: Page, data: string) {
  const promiseResult = await page.evaluate(
    ({ data }) => {
      const contentParser = new window.ContentParser(window.page);
      return contentParser.markdown2Block(data);
    },
    { data }
  );
  return promiseResult;
}

export async function transformHtml(page: Page, data: string) {
  const promiseResult = await page.evaluate(
    ({ data }) => {
      const contentParser = new window.ContentParser(window.page);
      return contentParser.htmlText2Block(data, 'NotionHtml');
    },
    { data }
  );
  return promiseResult;
}

export async function export2Html(page: Page) {
  const promiseResult = await page.evaluate(() => {
    const contentParser = new window.ContentParser(window.page);
    const root = window.page.root as PageBlockModel;
    return contentParser.block2Html(
      [contentParser.getSelectedBlock(root)],
      new Map()
    );
  });
  return promiseResult;
}

export async function export2markdown(page: Page) {
  const promiseResult = await page.evaluate(() => {
    const contentParser = new window.ContentParser(window.page);
    const root = window.page.root as PageBlockModel;
    return contentParser.block2markdown(
      [contentParser.getSelectedBlock(root)],
      new Map()
    );
  });
  return promiseResult;
}

export async function getCopyClipItemsInPage(page: Page) {
  const clipItems: ClipboardItem[] = await page.evaluate(() => {
    return document
      .getElementsByTagName('affine-doc-page')[0]
      .clipboard['_copyBlocksInPage']();
  });
  return clipItems;
}

export async function scrollToTop(page: Page) {
  await page.mouse.wheel(0, -1000);

  await page.waitForFunction(() => {
    const scrollContainer = document.querySelector('.affine-doc-viewport');
    if (!scrollContainer) {
      throw new Error("Can't find scroll container");
    }
    return scrollContainer.scrollTop < 10;
  });
}

export async function scrollToBottom(page: Page) {
  // await page.mouse.wheel(0, 1000);

  await page
    .locator('.affine-doc-viewport')
    .evaluate(node =>
      node.scrollTo({ left: 0, top: 1000, behavior: 'smooth' })
    );
  // TODO switch to `scrollend`
  // See https://developer.chrome.com/en/blog/scrollend-a-new-javascript-event/
  await page.waitForFunction(() => {
    const scrollContainer = document.querySelector('.affine-doc-viewport');
    if (!scrollContainer) {
      throw new Error("Can't find scroll container");
    }

    return (
      // Wait for scrolled to the bottom
      // Refer to https://stackoverflow.com/questions/3898130/check-if-a-user-has-scrolled-to-the-bottom-not-just-the-window-but-any-element
      Math.abs(
        scrollContainer.scrollHeight -
          scrollContainer.scrollTop -
          scrollContainer.clientHeight
      ) < 10
    );
  });
}
