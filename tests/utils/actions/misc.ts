/* eslint-disable @typescript-eslint/no-restricted-imports */
import '../declare-test-window.js';
import type {
  BaseBlockModel,
  Page as StorePage,
} from '../../../packages/store/src/index.js';
import { ConsoleMessage, expect, Page } from '@playwright/test';
import { pressEnter, SHORT_KEY, type } from './keyboard.js';
import type { DeltaInsert, VRange } from '@blocksuite/virgo';
import type { VEditor } from '@blocksuite/virgo';

const NEXT_FRAME_TIMEOUT = 100;
const DEFAULT_PLAYGROUND = 'http://localhost:5173/';
const RICH_TEXT_SELECTOR = '.ql-editor';
const TITLE_SELECTOR = '.affine-default-page-block-title';

function shamefullyIgnoreConsoleMessage(message: ConsoleMessage): boolean {
  if (!process.env.CI) {
    return true;
  }
  const ignoredMessages = [
    // basic.spec.ts
    "Caught error while handling a Yjs update TypeError: Cannot read properties of undefined (reading 'toJSON')",
    // embed.spec.ts
    'Failed to load resource: the server responded with a status of 404 (Not Found)',
    // embed.spec.ts
    'Error while getting blob HTTPError: Request failed with status code 404 Not Found',
    // clipboard.spec.ts
    "TypeError: Cannot read properties of null (reading 'model')",
    // basic.spec.ts › should readonly mode not be able to modify text
    'cannot modify data in readonly mode',
    // Firefox warn on quill
    // See https://github.com/quilljs/quill/issues/2030
    '[JavaScript Warning: "Use of Mutation Events is deprecated. Use MutationObserver instead."',
  ];
  return ignoredMessages.some(msg => message.text().startsWith(msg));
}

function generateRandomRoomId() {
  return `playwright-${Math.random().toFixed(8).substring(2)}`;
}

/**
 * @example
 * ```ts
 * await initEmptyEditor(page, { enable_some_flag: true });
 * ```
 */
async function initEmptyEditor(
  page: Page,
  flags: Partial<BlockSuiteFlags> = {}
) {
  await page.evaluate(flags => {
    const { workspace } = window;

    workspace.signals.pageAdded.once(async pageId => {
      const page = workspace.getPage(pageId) as StorePage;
      for (const [key, value] of Object.entries(flags)) {
        page.awarenessStore.setFlag(key as keyof typeof flags, value);
      }

      const editor = document.createElement('editor-container');
      editor.page = page;

      const debugMenu = document.createElement('debug-menu');
      debugMenu.workspace = workspace;
      debugMenu.editor = editor;

      document.body.appendChild(editor);
      document.body.appendChild(debugMenu);
      const blockHub = await editor.createBlockHub();
      document.body.appendChild(blockHub);

      window.debugMenu = debugMenu;
      window.editor = editor;
      window.page = page;
    });

    workspace.createPage('page0');
  }, flags);
  await waitNextFrame(page);
}

export async function enterVirgoPlayground(page: Page) {
  const url = new URL('examples/virgo/index.html', DEFAULT_PLAYGROUND);
  await page.goto(url.toString());
}

export async function enterPlaygroundRoom(
  page: Page,
  flags?: Partial<BlockSuiteFlags>,
  room?: string
) {
  const url = new URL(DEFAULT_PLAYGROUND);
  if (!room) {
    room = generateRandomRoomId();
  }
  url.searchParams.set('room', room);
  await page.goto(url.toString());
  await page.evaluate(() => {
    if (typeof window.$blocksuite !== 'object') {
      throw new Error('window.$blocksuite is not object');
    }
  }, []);

  // See https://github.com/microsoft/playwright/issues/5546
  // See https://github.com/microsoft/playwright/discussions/17813
  page.on('console', message => {
    const ignore = shamefullyIgnoreConsoleMessage(message);
    if (!ignore) {
      throw new Error('Unexpected console message: ' + message.text());
    }
    if (message.type() === 'warning') {
      console.warn(message.text());
    }
    if (message.type() === 'error') {
      console.error('Unexpected console error: ' + message.text());
    }
  });

  await initEmptyEditor(page, flags);
  return room;
}

export async function waitDefaultPageLoaded(page: Page) {
  await page.waitForSelector('affine-default-page[data-block-id="0"]');
}

export async function waitEmbedLoaded(page: Page) {
  await page.waitForSelector('.resizable-img');
}

export async function waitNextFrame(page: Page) {
  await page.waitForTimeout(NEXT_FRAME_TIMEOUT);
}

export async function waitForRemoteUpdateSignal(page: Page) {
  return page.evaluate(() => {
    return new Promise<void>(resolve => {
      const DebugDocProvider = window.$blocksuite.store.DebugDocProvider;
      const debugProvider = window.workspace.providers.find(
        provider => provider instanceof DebugDocProvider
      ) as InstanceType<typeof DebugDocProvider>;
      const callback = window.$blocksuite.blocks.debounce(() => {
        disposable.dispose();
        resolve();
      }, 500);
      const disposable = debugProvider.remoteUpdateSignal.on(callback);
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

export async function enterPlaygroundWithList(page: Page) {
  const room = generateRandomRoomId();
  await page.goto(`${DEFAULT_PLAYGROUND}?room=${room}`);
  await initEmptyEditor(page);

  await page.evaluate(() => {
    const { page } = window;
    const pageId = page.addBlock({ flavour: 'affine:page' });
    const frameId = page.addBlock({ flavour: 'affine:frame' }, pageId);
    for (let i = 0; i < 3; i++) {
      page.addBlock({ flavour: 'affine:list' }, frameId);
    }
  });
  await waitNextFrame(page);
}

export async function initEmptyParagraphState(page: Page, pageId?: string) {
  const ids = await page.evaluate(pageId => {
    const { page } = window;
    page.captureSync();
    if (!pageId) {
      pageId = page.addBlock({ flavour: 'affine:page' });
    }
    const frameId = page.addBlock({ flavour: 'affine:frame' }, pageId);
    const paragraphId = page.addBlock({ flavour: 'affine:paragraph' }, frameId);
    page.captureSync();
    return { pageId, frameId, paragraphId };
  }, pageId);
  return ids;
}

export async function initEmptyDatabaseState(page: Page, pageId?: string) {
  const ids = await page.evaluate(pageId => {
    const { page } = window;
    page.captureSync();
    if (!pageId) {
      pageId = page.addBlockByFlavour('affine:page');
    }
    const frameId = page.addBlockByFlavour('affine:frame', {}, pageId);
    const paragraphId = page.addBlockByFlavour(
      'affine:database',
      {
        title: 'Database 1',
      },
      frameId
    );
    page.captureSync();
    return { pageId, frameId, paragraphId };
  }, pageId);
  return ids;
}

export async function initEmptyCodeBlockState(page: Page) {
  const ids = await page.evaluate(() => {
    const { page } = window;
    page.captureSync();
    const pageId = page.addBlock({ flavour: 'affine:page' });
    const frameId = page.addBlock({ flavour: 'affine:frame' }, pageId);
    const codeBlockId = page.addBlock({ flavour: 'affine:code' }, frameId);
    page.captureSync();
    return { pageId, frameId, codeBlockId };
  });
  await page.waitForSelector(`[data-block-id="${ids.codeBlockId}"] rich-text`);
  return ids;
}

export async function focusTitle(page: Page) {
  const locator = page.locator(TITLE_SELECTOR);
  await locator.click();
}

export async function focusRichText(page: Page, i = 0) {
  await page.mouse.move(0, 0);
  const locator = page.locator(RICH_TEXT_SELECTOR).nth(i);
  await locator.click();
}

export async function focusVirgoRichText(page: Page): Promise<void> {
  const editorPosition = await page.evaluate(() => {
    const editor = document
      .querySelector('test-page')
      ?.shadowRoot?.querySelector('rich-text')
      ?.shadowRoot?.querySelector('[data-virgo-root="true"]');

    if (!editor) {
      throw new Error('Cannot find editor');
    }

    return editor.getBoundingClientRect();
  });

  await page.mouse.click(editorPosition.x + 400, editorPosition.y + 400);
}

export async function initThreeParagraphs(page: Page) {
  await focusRichText(page);
  await type(page, '123');
  await pressEnter(page);
  await type(page, '456');
  await pressEnter(page);
  await type(page, '789');
}

export async function initThreeLists(page: Page) {
  await focusRichText(page);
  await type(page, '-');
  await page.keyboard.press('Space', { delay: 50 });
  await type(page, '123');
  await pressEnter(page);
  await type(page, '456');
  await pressEnter(page);
  await page.keyboard.press('Tab', { delay: 50 });
  await type(page, '789');
}

export async function initThreeDividers(page: Page) {
  await focusRichText(page);
  await type(page, '123');
  await pressEnter(page);
  await type(page, '---');
  await page.keyboard.press('Space', { delay: 50 });
  await type(page, '---');
  await page.keyboard.press('Space', { delay: 50 });
  await type(page, '---');
  await page.keyboard.press('Space', { delay: 50 });
  await type(page, '123');
}

export async function getQuillSelectionIndex(page: Page) {
  return await page.evaluate(() => {
    const selection = window.getSelection() as Selection;

    const range = selection.getRangeAt(0);
    const component = range.startContainer.parentElement?.closest('rich-text');
    const index = component?.quill?.getSelection()?.index;
    return index !== undefined ? index : -1;
  });
}

export async function getQuillSelectionText(page: Page) {
  return await page.evaluate(() => {
    const selection = window.getSelection() as Selection;
    const range = selection.getRangeAt(0);
    const component = range.startContainer.parentElement?.closest('rich-text');
    return component?.quill?.getText() || '';
  });
}

export async function getSelectedTextByQuill(page: Page) {
  return await page.evaluate(() => {
    const selection = window.getSelection() as Selection;
    const range = selection.getRangeAt(0);
    const component = range.startContainer.parentElement?.closest('rich-text');
    // @ts-expect-error
    const { index, length } = component.quill.getSelection();
    return component?.quill?.getText(index, length) || '';
  });
}

export async function setQuillSelection(
  page: Page,
  index: number,
  length: number
) {
  return await page.evaluate(
    ({ index, length }) => {
      const selection = window.getSelection() as Selection;

      const range = selection.getRangeAt(0);
      const component =
        range.startContainer.parentElement?.closest('rich-text');
      component?.quill?.setSelection(index, length);
    },
    { index, length }
  );
}

export async function pasteContent(
  page: Page,
  clipData: Record<string, unknown>
) {
  await page.evaluate(
    ({ clipData }) => {
      const e = {
        target: document.body,
        preventDefault: () => null,
        stopPropagation: () => null,
        clipboardData: {
          types: Object.keys(clipData),
          getData: (mime: string) => {
            return clipData[mime];
          },
        },
      };
      document
        .getElementsByTagName('editor-container')[0]
        .clipboard['_clipboardEventDispatcher']['_onPaste'](
          e as unknown as ClipboardEvent
        );
    },
    { clipData }
  );
}

export async function importMarkdown(
  page: Page,
  data: string,
  insertPositionId: string
) {
  await page.evaluate(
    ({ data, insertPositionId }) => {
      document
        .getElementsByTagName('editor-container')[0]
        .clipboard.importMarkdown(data, insertPositionId);
    },
    { data, insertPositionId }
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
      const begin = document.querySelector(
        `[data-block-id="${anchorBlockId}"] p`
      );
      const paragraph = document.querySelector(
        `[data-block-id="${focusBlockId}"] p`
      );
      begin &&
        paragraph &&
        getSelection()?.setBaseAndExtent(
          begin,
          anchorOffset,
          paragraph,
          focusOffset
        );
    },
    { anchorBlockId, anchorOffset, focusBlockId, focusOffset }
  );
}

export async function readClipboardText(page: Page) {
  await page.evaluate(() => {
    const textarea = document.createElement('textarea');
    textarea.setAttribute('id', 'textarea-test');
    document.body.appendChild(textarea);
  });
  const textarea = page.locator('#textarea-test');
  await textarea.focus();
  await page.keyboard.press(`${SHORT_KEY}+v`);
  const text = await textarea.inputValue();
  await page.evaluate(() => {
    const textarea = document.querySelector('#textarea-test');
    textarea?.remove();
  });
  return text;
}

export const getCenterPosition: (
  page: Page,
  selector: string
) => Promise<{ x: number; y: number }> = async (
  page: Page,
  selector: string
) => {
  return await page.evaluate((selector: string) => {
    const bbox = document
      .querySelector(selector)
      ?.getBoundingClientRect() as DOMRect;
    return {
      x: bbox.left + bbox.width / 2,
      y: bbox.top + bbox.height / 2,
    };
  }, selector);
};

export const getBoundingClientRect: (
  page: Page,
  selector: string
) => Promise<DOMRect> = async (page: Page, selector: string) => {
  return await page.evaluate((selector: string) => {
    return document.querySelector(selector)?.getBoundingClientRect() as DOMRect;
  }, selector);
};

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
  [richTextIndex, quillIndex]: [number, number],
  coordOffSet: { x: number; y: number } = { x: 0, y: 0 }
) {
  const coord = await page.evaluate(
    ({ richTextIndex, quillIndex, coordOffSet }) => {
      const richText = document.querySelectorAll('rich-text')[richTextIndex];
      const quillBound = richText.quill.getBounds(quillIndex);
      const richTextBound = richText.getBoundingClientRect();
      return {
        x: richTextBound.left + quillBound.left + coordOffSet.x,
        y:
          richTextBound.top +
          quillBound.top +
          quillBound.height / 2 +
          coordOffSet.y,
      };
    },
    {
      richTextIndex,
      quillIndex,
      coordOffSet,
    }
  );
  return coord;
}

export async function pageType(page: Page, text: string): Promise<void> {
  await page.keyboard.type(text, { delay: 50 });
}

export async function pagePress(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key, { delay: 50 });
}

export async function getDeltaFromFirstEditor(
  page: Page
): Promise<DeltaInsert> {
  await page.waitForTimeout(50);
  return await page.evaluate(() => {
    const richTextA = document
      .querySelector('test-page')
      ?.shadowRoot?.querySelector('rich-text');

    if (!richTextA) {
      throw new Error('Cannot find editor');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editor = (richTextA as any).vEditor as VEditor;
    return editor.yText.toDelta();
  });
}

export async function setFirstEditorRange(
  page: Page,
  vRange: VRange
): Promise<void> {
  await page.evaluate(vRange => {
    const richTextA = document
      .querySelector('test-page')
      ?.shadowRoot?.querySelector('rich-text');

    if (!richTextA) {
      throw new Error('Cannot find editor');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editor = (richTextA as any).vEditor as VEditor;
    editor.setVRange(vRange);
  }, vRange);
}
