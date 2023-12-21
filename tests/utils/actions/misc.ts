/* eslint-disable @typescript-eslint/no-restricted-imports */
import '../declare-test-window.js';

import type { ConsoleMessage, Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import lz from 'lz-string';

import type { CssVariableName } from '../../../packages/blocks/src/_common/theme/css-variables.js';
import type { RichText } from '../../../packages/blocks/src/index.js';
import {
  type DatabaseBlockModel,
  type ListType,
  type ThemeObserver,
} from '../../../packages/blocks/src/index.js';
import { assertExists } from '../../../packages/global/src/utils.js';
import {
  type InlineRange,
  type InlineRootElement,
} from '../../../packages/inline/src/index.js';
import type { DebugMenu } from '../../../packages/playground/apps/starter/components/debug-menu.js';
import type { PagesPanel } from '../../../packages/playground/apps/starter/components/pages-panel.js';
import type { BaseBlockModel } from '../../../packages/store/src/index.js';
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
const RICH_TEXT_SELECTOR = '.inline-editor';

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
    async ([flags, noInit, multiEditor]) => {
      const { workspace } = window;

      async function initPage(page: ReturnType<typeof workspace.createPage>) {
        await page.load();
        for (const [key, value] of Object.entries(flags)) {
          page.awarenessStore.setFlag(key as keyof typeof flags, value);
        }
        // add app root from https://github.com/toeverything/blocksuite/commit/947201981daa64c5ceeca5fd549460c34e2dabfa
        const appRoot = document.querySelector('#app');
        if (!appRoot) {
          throw new Error('Cannot find app root element(#app).');
        }
        const createEditor = () => {
          const editor = document.createElement('affine-editor-container');
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
          return editor;
        };
        const editor = createEditor();
        if (multiEditor) createEditor();

        const debugMenu: DebugMenu = document.createElement('debug-menu');
        const pagesPanel: PagesPanel = document.createElement('pages-panel');
        pagesPanel.editor = editor;
        debugMenu.workspace = workspace;
        debugMenu.editor = editor;
        debugMenu.pagesPanel = pagesPanel;
        const leftSidePanel = document.createElement('left-side-panel');
        debugMenu.leftSidePanel = leftSidePanel;
        debugMenu.contentParser = new window.ContentParser(page);
        document.body.appendChild(debugMenu);
        document.body.appendChild(leftSidePanel);
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
          if (page) initPage(page).catch(console.error);
        });
        workspace.slots.pageAdded.on(async pageId => {
          const page = workspace.getPage(pageId);
          if (!page) {
            throw new Error(`Failed to get page ${pageId}`);
          }
          await initPage(page);
        });
      } else {
        const page = workspace.createPage({ id: 'page:home' });
        await initPage(page);
      }
    },
    [flags, noInit, multiEditor] as const
  );
  await waitNextFrame(page);
}

export const getEditorLocator = (page: Page) => {
  return page.locator('affine-editor-container').nth(currentEditorIndex);
};

export const getEditorHostLocator = (page: Page) => {
  return page.locator('editor-host').nth(currentEditorIndex);
};

export const getBlockHub = (page: Page) => {
  return page.locator('affine-block-hub').nth(currentEditorIndex);
};

type TaggedConsoleMessage = ConsoleMessage & { __ignore?: boolean };
function ignoredLog(message: ConsoleMessage) {
  (message as TaggedConsoleMessage).__ignore = true;
}
function isIgnoredLog(
  message: ConsoleMessage
): message is TaggedConsoleMessage {
  return '__ignore' in message && !!message.__ignore;
}

/**
 * Expect console message to be called in the test.
 *
 * This function **should** be called before the `enterPlaygroundRoom` function!
 *
 * ```ts
 * expectConsoleMessage(page, 'Failed to load resource'); // Default type is 'error'
 * expectConsoleMessage(page, '[vite] connected.', 'warning'); // Specify type
 * ```
 */
export function expectConsoleMessage(
  page: Page,
  logPrefixOrRegex: string | RegExp,
  type:
    | 'log'
    | 'debug'
    | 'info'
    | 'error'
    | 'warning'
    | 'dir'
    | 'dirxml'
    | 'table'
    | 'trace'
    | 'clear'
    | 'startGroup'
    | 'startGroupCollapsed'
    | 'endGroup'
    | 'assert'
    | 'profile'
    | 'profileEnd'
    | 'count'
    | 'timeEnd' = 'error'
) {
  page.on('console', (message: ConsoleMessage) => {
    if (
      [
        '[vite] connecting...',
        '[vite] connected.',
        'Lit is in dev mode. Not recommended for production! See https://lit.dev/msg/dev-mode for more information.',
        '%cDownload the React DevTools for a better development experience: https://reactjs.org/link/react-devtools font-weight:bold',
      ].includes(message.text())
    ) {
      ignoredLog(message);
      return;
    }
    const sameType = message.type() === type;
    const textMatch =
      logPrefixOrRegex instanceof RegExp
        ? logPrefixOrRegex.test(message.text())
        : message.text().startsWith(logPrefixOrRegex);
    if (sameType && textMatch) {
      ignoredLog(message);
    }
  });
}

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
  // const readyPromise = waitForPageReady(page);

  // See https://github.com/microsoft/playwright/issues/5546
  // See https://github.com/microsoft/playwright/discussions/17813
  page.on('console', message => {
    const ignore = isIgnoredLog(message) || !process.env.CI;
    if (!ignore) {
      expect
        .soft('Unexpected console message: ' + message.text())
        .toBe(
          'Please remove the "console.log" or declare `expectConsoleMessage` before `enterPlaygroundRoom`. It is advised not to output logs in a production environment.'
        );
    }
    console.log(`Console ${message.type()}: ${message.text()}`);
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

  // await readyPromise;

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
  await page.evaluate(async () => {
    return new Promise<void>(resolve => {
      window.addEventListener('blocksuite:page-ready', () => resolve(), {
        once: true,
      });
    });
  });
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
      await page.load(() => {
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
      });
    },
    { contents, type }
  );
  await waitNextFrame(page);
}

// XXX: This doesn't add surface yet, the page state should not be switched to edgeless.
export async function initEmptyParagraphState(page: Page, pageId?: string) {
  const ids = await page.evaluate(async pageId => {
    const { page } = window;
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
  const editorHost = getEditorHostLocator(page);
  const addRow = editorHost.locator('.data-view-table-group-add-row');
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
  const editorHost = getEditorHostLocator(page);
  if (addRow) {
    await initDatabaseRow(page);
  }
  await focusDatabaseTitle(page);
  const lastRow = editorHost.locator('.affine-database-block-row').last();
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

    dbTitle.inlineEditor!.focusEnd();
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
  const editor = getEditorHostLocator(page);
  const locator = editor.locator(RICH_TEXT_SELECTOR).nth(i);
  // need to set `force` to true when clicking on `affine-selected-blocks`
  await locator.click({ force: true, position: options?.clickPosition });
}

export async function focusRichTextEnd(page: Page, i = 0) {
  await page.evaluate(
    ([i, currentEditorIndex]) => {
      const editorHost =
        document.querySelectorAll('editor-host')[currentEditorIndex];
      const richTexts = Array.from(editorHost.querySelectorAll('rich-text'));

      richTexts[i].inlineEditor?.focusEnd();
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

export async function getInlineSelectionIndex(page: Page) {
  return await page.evaluate(() => {
    const selection = window.getSelection() as Selection;

    const range = selection.getRangeAt(0);
    const component = range.startContainer.parentElement?.closest('rich-text');
    const index = component?.inlineEditor?.getInlineRange()?.index;
    return index !== undefined ? index : -1;
  });
}

export async function getInlineSelectionText(page: Page) {
  return await page.evaluate(() => {
    const selection = window.getSelection() as Selection;
    const range = selection.getRangeAt(0);
    const component = range.startContainer.parentElement?.closest('rich-text');
    return component?.inlineEditor?.yText.toString() ?? '';
  });
}

export async function getSelectedTextByInlineEditor(page: Page) {
  return await page.evaluate(() => {
    const selection = window.getSelection() as Selection;
    const range = selection.getRangeAt(0);
    const component = range.startContainer.parentElement?.closest('rich-text');

    const inlineRange = component?.inlineEditor?.getInlineRange();
    if (!inlineRange) return '';

    const { index, length } = inlineRange;
    return component?.inlineEditor?.yText.toString().slice(index, length) || '';
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
      const inlineRange = component.inlineEditor?.getInlineRange();
      if (!inlineRange) return;
      const { index, length } = inlineRange;
      content +=
        component?.inlineEditor?.yText
          .toString()
          .slice(index, index + length) || '';
    });

    return content;
  });
}

export async function setInlineRangeInSelectedRichText(
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
      component?.inlineEditor?.setInlineRange({
        index,
        length,
      });
    },
    { index, length }
  );
  await waitNextFrame(page);
}

export async function setInlineRangeInInlineEditor(
  page: Page,
  inlineRange: InlineRange,
  i = 0
) {
  await page.evaluate(
    ({ i, inlineRange, currentEditorIndex }) => {
      const editorHost =
        document.querySelectorAll('editor-host')[currentEditorIndex];
      const inlineEditor = editorHost.querySelectorAll<InlineRootElement>(
        '[data-v-root="true"]'
      )[i]?.inlineEditor;
      if (!inlineEditor) {
        throw new Error('Cannot find inline editor');
      }
      inlineEditor.setInlineRange(inlineRange);
    },
    { i, inlineRange, currentEditorIndex }
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

export async function getClipboardHTML(page: Page) {
  const dataInClipboard = await page.evaluate(async () => {
    function format(node: HTMLElement, level: number) {
      const indentBefore = new Array(level++ + 1).join('  ');
      const indentAfter = new Array(level - 1).join('  ');
      let textNode;

      for (let i = 0; i < node.children.length; i++) {
        textNode = document.createTextNode('\n' + indentBefore);
        node.insertBefore(textNode, node.children[i]);

        format(node.children[i] as HTMLElement, level);

        if (node.lastElementChild == node.children[i]) {
          textNode = document.createTextNode('\n' + indentAfter);
          node.appendChild(textNode);
        }
      }

      return node;
    }
    const clipItems = await navigator.clipboard.read();
    const item = clipItems.find(item => item.types.includes('text/html'));
    const data = await item?.getType('text/html');
    const text = await data?.text();
    const html = new DOMParser().parseFromString(text ?? '', 'text/html');
    const container = html.querySelector<HTMLDivElement>(
      '[data-blocksuite-snapshot]'
    );
    if (!container) {
      return '';
    }
    return format(container, 0).innerHTML.trim();
  });

  return dataInClipboard;
}

export async function getClipboardText(page: Page) {
  const dataInClipboard = await page.evaluate(async () => {
    const clipItems = await navigator.clipboard.read();
    const item = clipItems.find(item => item.types.includes('text/plain'));
    const data = await item?.getType('text/plain');
    const text = await data?.text();
    return text ?? '';
  });
  return dataInClipboard;
}

export async function getClipboardCustomData(page: Page, type: string) {
  const dataInClipboard = await page.evaluate(async () => {
    const clipItems = await navigator.clipboard.read();
    const item = clipItems.find(item => item.types.includes('text/html'));
    const data = await item?.getType('text/html');
    const text = await data?.text();
    const html = new DOMParser().parseFromString(text ?? '', 'text/html');
    const container = html.querySelector<HTMLDivElement>(
      '[data-blocksuite-snapshot]'
    );
    return container?.dataset.blocksuiteSnapshot ?? '';
  });

  const decompressed = lz.decompressFromEncodedURIComponent(dataInClipboard);
  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(decompressed);
  } catch {
    throw new Error(`Invalid snapshot in clipboard: ${dataInClipboard}`);
  }

  return json?.[type];
}

export async function getClipboardSnapshot(page: Page) {
  const dataInClipboard = await getClipboardCustomData(
    page,
    'BLOCKSUITE/SNAPSHOT'
  );
  assertExists(dataInClipboard);
  const json = JSON.parse(dataInClipboard as string);
  return json;
}

export async function setSelection(
  page: Page,
  anchorBlockId: number,
  anchorOffset: number,
  focusBlockId: number,
  focusOffset: number
) {
  await page.evaluate(
    ({
      anchorBlockId,
      anchorOffset,
      focusBlockId,
      focusOffset,
      currentEditorIndex,
    }) => {
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      const editorHost =
        document.querySelectorAll('editor-host')[currentEditorIndex];
      const anchorRichText = editorHost.querySelector<RichText>(
        `[data-block-id="${anchorBlockId}"] rich-text`
      )!;
      const anchorRichTextRange = anchorRichText.inlineEditor!.toDomRange({
        index: anchorOffset,
        length: 0,
      })!;
      const focusRichText = editorHost.querySelector<RichText>(
        `[data-block-id="${focusBlockId}"] rich-text`
      )!;
      const focusRichTextRange = focusRichText.inlineEditor!.toDomRange({
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
    {
      anchorBlockId,
      anchorOffset,
      focusBlockId,
      focusOffset,
      currentEditorIndex,
    }
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
    ({ richTextIndex, vIndex, coordOffSet, currentEditorIndex }) => {
      const editorHost =
        document.querySelectorAll('editor-host')[currentEditorIndex];
      const richText = editorHost.querySelectorAll('rich-text')[
        richTextIndex
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any;
      const domRange = richText.inlineEditor.toDomRange({
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
      currentEditorIndex,
    }
  );
  return coord;
}

export function inlineEditorInnerTextToString(innerText: string): string {
  return innerText.replace('\u200B', '').trim();
}

export async function focusTitle(page: Page) {
  // click to ensure editor is active
  await page.mouse.move(0, 0);
  const editor = getEditorHostLocator(page);
  const locator = editor.locator('affine-doc-page').first();
  // need to set `force` to true when clicking on `affine-selected-blocks`
  await locator.click({ force: true });
  // avoid trigger double click
  await page.waitForTimeout(500);
  await page.evaluate(i => {
    const docTitle = document.querySelectorAll('doc-title')[i];
    if (!docTitle) {
      throw new Error('Doc title component not found');
    }
    const docTitleRichText = docTitle.querySelector('rich-text');
    if (!docTitleRichText) {
      throw new Error('Doc title rich text component not found');
    }
    if (!docTitleRichText.inlineEditor) {
      throw new Error('Doc title inline editor not found');
    }
    docTitleRichText.inlineEditor.focusEnd();
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
 * Sometimes inline editor state is not updated in time. Bad case like below:
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
export async function waitForInlineEditorStateUpdated(page: Page) {
  return await page.evaluate(async () => {
    const selection = window.getSelection() as Selection;

    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const component = range.startContainer.parentElement?.closest('rich-text');
    await component?.inlineEditor?.waitForUpdate();
  });
}

export async function initImageState(page: Page) {
  // await initEmptyParagraphState(page);
  // await focusRichText(page);

  await page.evaluate(async () => {
    const { page } = window;
    const pageId = page.addBlock('affine:page', {
      title: new page.Text(),
    });
    const noteId = page.addBlock('affine:note', {}, pageId);

    await new Promise(res => setTimeout(res, 200));

    const docPage = document.querySelector('affine-doc-page');
    if (!docPage) throw new Error('Cannot find doc page');
    const imageBlob = await fetch(`${location.origin}/test-card-1.png`).then(
      response => response.blob()
    );
    const storage = docPage.page.blob;
    const sourceId = await storage.set(imageBlob);
    const imageId = page.addBlock(
      'affine:image',
      {
        sourceId,
      },
      noteId
    );

    page.resetHistory();

    return { pageId, noteId, imageId };
  });

  // due to pasting img calls fetch, so we need timeout for downloading finished.
  await page.waitForTimeout(500);
}

export async function getCurrentEditorPageId(page: Page) {
  return await page.evaluate(index => {
    const editor = document.querySelectorAll('affine-editor-container')[index];
    if (!editor) throw new Error("Can't find affine-editor-container");
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
    .locator('affine-editor-container')
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
    .locator('affine-editor-container')
    .evaluate((ele, property: CssVariableName) => {
      return (ele as unknown as Element & { themeObserver: ThemeObserver })
        .themeObserver.cssVariables?.[property];
    }, property);
  return value;
}

export async function getCopyClipItemsInPage(page: Page) {
  const clipItems = await page.evaluate(() => {
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
