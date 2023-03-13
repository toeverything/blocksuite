/* eslint-disable @typescript-eslint/no-restricted-imports */
import '../declare-test-window.js';

import { getDefaultPlaygroundURL } from '@blocksuite/global/utils';
import type { ConsoleMessage, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import type { RichText } from '../../../packages/playground/examples/virgo/test-page.js';
import type {
  BaseBlockModel,
  Page as StorePage,
} from '../../../packages/store/src/index.js';
import { pressEnter, pressTab, SHORT_KEY, type } from './keyboard.js';

const NEXT_FRAME_TIMEOUT = 100;
const DEFAULT_PLAYGROUND = getDefaultPlaygroundURL(!!process.env.CI).toString();
const RICH_TEXT_SELECTOR = '.virgo-editor';

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

    workspace.slots.pageAdded.once(async pageId => {
      const page = workspace.getPage(pageId) as StorePage;
      for (const [key, value] of Object.entries(flags)) {
        page.awarenessStore.setFlag(key as keyof typeof flags, value);
      }

      const editor = document.createElement('editor-container');
      editor.page = page;

      const debugMenu = document.createElement('debug-menu');
      debugMenu.workspace = workspace;
      debugMenu.editor = editor;

      // add app root from https://github.com/toeverything/blocksuite/commit/947201981daa64c5ceeca5fd549460c34e2dabfa
      const appRoot = document.querySelector('#app');
      if (!appRoot) {
        throw new Error('Cannot find app root element(#app).');
      }
      appRoot.appendChild(editor);
      document.body.appendChild(debugMenu);
      editor.createBlockHub().then(blockHub => {
        document.body.appendChild(blockHub);
      });
      window.debugMenu = debugMenu;
      window.editor = editor;
      window.page = page;
    });

    workspace.createPage('page0');
  }, flags);
  await waitNextFrame(page);
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

  // Log all uncaught errors
  page.on('pageerror', exception => {
    throw new Error(`Uncaught exception: "${exception}"`);
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

export async function waitForRemoteUpdateSlot(page: Page) {
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
      const disposable = debugProvider.remoteUpdateSlot.on(callback);
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
  await initEmptyEditor(page);

  await page.evaluate(
    ({ contents, type }: { contents: string[]; type: ListType }) => {
      const { page } = window;
      const pageId = page.addBlockByFlavour('affine:page', {
        title: new page.Text(),
      });
      const frameId = page.addBlockByFlavour('affine:frame', {}, pageId);
      for (let i = 0; i < contents.length; i++) {
        page.addBlockByFlavour(
          'affine:list',
          contents.length > 0
            ? { text: new page.Text(contents[i]), type }
            : { type },
          frameId
        );
      }
    },
    { contents, type }
  );
  await waitNextFrame(page);
}

// XXX: This doesn't add surface yet, the page state should not be switched to edgeless.
export async function initEmptyParagraphState(page: Page, pageId?: string) {
  const ids = await page.evaluate(pageId => {
    const { page } = window;
    page.captureSync();

    if (!pageId) {
      pageId = page.addBlockByFlavour('affine:page', {
        title: new page.Text(),
      });
    }

    const frameId = page.addBlockByFlavour('affine:frame', {}, pageId);
    const paragraphId = page.addBlockByFlavour('affine:paragraph', {}, frameId);
    page.captureSync();
    return { pageId, frameId, paragraphId };
  }, pageId);
  return ids;
}

export async function initEmptyEdgelessState(page: Page) {
  const ids = await page.evaluate(() => {
    const { page } = window;

    const pageId = page.addBlockByFlavour('affine:page', {
      title: new page.Text(),
    });
    page.addBlockByFlavour('affine:surface', {}, null);
    const frameId = page.addBlockByFlavour('affine:frame', {}, pageId);
    const paragraphId = page.addBlockByFlavour('affine:paragraph', {}, frameId);
    page.resetHistory();

    return { pageId, frameId, paragraphId };
  });
  return ids;
}

export async function initEmptyDatabaseState(page: Page, pageId?: string) {
  const ids = await page.evaluate(pageId => {
    const { page } = window;
    page.captureSync();
    if (!pageId) {
      pageId = page.addBlockByFlavour('affine:page', {
        title: new page.Text(),
      });
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
    const pageId = page.addBlockByFlavour('affine:page');
    const frameId = page.addBlockByFlavour('affine:frame', {}, pageId);
    const codeBlockId = page.addBlockByFlavour('affine:code', {}, frameId);
    page.captureSync();
    return { pageId, frameId, codeBlockId };
  });
  await page.waitForSelector(`[data-block-id="${ids.codeBlockId}"] rich-text`);
  return ids;
}

export async function focusRichText(page: Page, i = 0) {
  await page.mouse.move(0, 0);
  const locator = page.locator(RICH_TEXT_SELECTOR).nth(i);
  await locator.click();
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

export async function initThreeLists(page: Page) {
  await focusRichText(page);
  await type(page, '-');
  await page.keyboard.press('Space', { delay: 50 });
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
  await page.keyboard.press('Space', { delay: 50 });
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
  await page.keyboard.press('Space', { delay: 50 });
  await type(page, '---');
  await page.keyboard.press('Space', { delay: 50 });
  await type(page, '---');
  await page.keyboard.press('Space', { delay: 50 });
  await type(page, '123');
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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { index, length } = component!.vEditor!.getVRange()!;
    return component?.vEditor?.yText.toString().slice(index, length) || '';
  });
}

export async function setVirgoSelection(
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
      component?.vEditor?.setVRange({
        index,
        length,
      });
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
      const e = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer(),
      });
      Object.defineProperty(e, 'target', {
        writable: false,
        value: document.body,
      });
      Object.keys(clipData).forEach(key => {
        e.clipboardData?.setData(key, clipData[key] as string);
      });
      document.body.dispatchEvent(e);
    },
    { clipData }
  );
}

export async function importMarkdown(
  page: Page,
  focusedBlockId: string,
  data: string
) {
  await page.evaluate(
    ({ data, focusedBlockId }) => {
      document
        .getElementsByTagName('editor-container')[0]
        .contentParser.importMarkdown(data, focusedBlockId);
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
      const anchorRichTextRange = anchorRichText.vEditor.toDomRange(
        {
          index: anchorOffset,
          length: 0,
        },
        false
      )!;
      const focusRichText = document.querySelector<RichText>(
        `[data-block-id="${focusBlockId}"] rich-text`
      )!;
      const focusRichTextRange = focusRichText.vEditor.toDomRange(
        {
          index: focusOffset,
          length: 0,
        },
        false
      )!;

      /* eslint-enable @typescript-eslint/no-non-null-assertion */
      getSelection()?.setBaseAndExtent(
        anchorRichTextRange.startContainer,
        anchorOffset,
        focusRichTextRange.startContainer,
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
  [richTextIndex, vIndex]: [number, number],
  coordOffSet: { x: number; y: number } = { x: 0, y: 0 }
) {
  const coord = await page.evaluate(
    ({ richTextIndex, vIndex, coordOffSet }) => {
      const richText = document.querySelectorAll('rich-text')[
        richTextIndex
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any;
      const domRange = richText.vEditor.toDomRange(
        {
          index: vIndex,
          length: 0,
        },
        false
      );
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
  return innerText.replace('\u200B', '');
}

export async function focusTitle(page: Page) {
  await page.evaluate(() => {
    const defaultPageComponent = document.querySelector('affine-default-page');
    if (!defaultPageComponent) {
      throw new Error('default page component not found');
    }

    defaultPageComponent.titleVEditor.focusEnd();
  });
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
  await page.waitForTimeout(50);
}
