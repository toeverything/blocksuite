/* eslint-disable @typescript-eslint/no-restricted-imports */
import '../declare-test-window.js';
import type { Page as StorePage } from '../../../packages/store/src/index.js';
import type { Page } from '@playwright/test';
import { pressEnter } from './keyboard.js';

const NEXT_FRAME_TIMEOUT = 50;
const DEFAULT_PLAYGROUND = 'http://localhost:5173/';
const RICH_TEXT_SELECTOR = '.ql-editor';

function generateRandomRoomId() {
  return `playwright-${Math.random().toFixed(8).substring(2)}`;
}

async function initEmptyEditor(page: Page) {
  await page.evaluate(() => {
    const { workspace } = window;

    workspace.signals.pageAdded.once(pageId => {
      const page = workspace.getPage(pageId) as StorePage;
      const editor = document.createElement('editor-container');
      editor.page = page;

      const debugMenu = document.createElement('debug-menu');
      debugMenu.workspace = workspace;
      debugMenu.editor = editor;

      document.body.appendChild(editor);
      document.body.appendChild(debugMenu);

      window.editor = editor;
      window.page = page;
    });

    workspace.createPage('page0');
  });
  await waitNextFrame(page);
}

export async function enterPlaygroundRoom(page: Page, room?: string) {
  const url = new URL(DEFAULT_PLAYGROUND);
  if (!room) {
    room = generateRandomRoomId();
  }
  url.searchParams.set('room', room);
  await page.goto(url.toString());

  // See https://github.com/microsoft/playwright/issues/5546
  // See https://github.com/microsoft/playwright/discussions/17813
  page.on('console', message => {
    if (message.type() === 'warning') {
      console.warn(message.text());
    }
    if (message.type() === 'error') {
      console.error('Unexpected console error: ' + message.text());
    }
  });

  await initEmptyEditor(page);
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

export async function clearLog(page: Page) {
  await page.evaluate(() => console.clear());
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
    const groupId = page.addBlock({ flavour: 'affine:group' }, pageId);
    for (let i = 0; i < 3; i++) {
      page.addBlock({ flavour: 'affine:list' }, groupId);
    }
  });
  await waitNextFrame(page);
}

export async function initEmptyParagraphState(page: Page) {
  const ids = await page.evaluate(() => {
    const { page } = window;
    page.captureSync();
    const pageId = page.addBlock({ flavour: 'affine:page' });
    const groupId = page.addBlock({ flavour: 'affine:group' }, pageId);
    const paragraphId = page.addBlock({ flavour: 'affine:paragraph' }, groupId);
    page.captureSync();
    return { pageId, groupId, paragraphId };
  });
  return ids;
}

export async function focusRichText(page: Page, i = 0) {
  await page.mouse.move(0, 0);
  const locator = page.locator(RICH_TEXT_SELECTOR).nth(i);
  await locator.click();
}

export async function initThreeParagraphs(page: Page) {
  await focusRichText(page);
  await page.keyboard.type('123');
  await pressEnter(page);
  await page.keyboard.type('456');
  await pressEnter(page);
  await page.keyboard.type('789');
}

export async function initThreeLists(page: Page) {
  await focusRichText(page);
  await page.keyboard.type('-');
  await page.keyboard.press('Space', { delay: 50 });
  await page.keyboard.type('123');
  await pressEnter(page);
  await page.keyboard.type('456');
  await pressEnter(page);
  await page.keyboard.press('Tab', { delay: 50 });
  await page.keyboard.type('789');
}

export async function initThreeDividers(page: Page) {
  await focusRichText(page);
  await page.keyboard.type('123');
  await pressEnter(page);
  await page.keyboard.type('---');
  await page.keyboard.press('Space', { delay: 50 });
  await page.keyboard.type('---');
  await page.keyboard.press('Space', { delay: 50 });
  await page.keyboard.type('---');
  await page.keyboard.press('Space', { delay: 50 });
  await page.keyboard.type('123');
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
        .clipboard['_clipboardEventDispatcher']['_pasteHandler'](
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
