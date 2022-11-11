import '../declare-test-window';
import type { Page } from '@playwright/test';
import { pressEnter } from './keyboard';

const NEXT_FRAME_TIMEOUT = 50;
const DEFAULT_PLAYGROUND = 'http://localhost:5173/';
const RICH_TEXT_SELECTOR = '.ql-editor';

function generateRandomRoomId() {
  return `virgo-${Math.random().toFixed(8).substring(2)}`;
}

export async function enterPlaygroundRoom(page: Page, room?: string) {
  if (!room) {
    room = generateRandomRoomId();
  }
  await page.goto(`${DEFAULT_PLAYGROUND}?room=${room}&isTest=true`);

  // See https://github.com/microsoft/playwright/issues/5546
  // See https://github.com/microsoft/playwright/discussions/17813
  page.on('console', message => {
    if (message.type() === 'warning') {
      console.warn(message.text());
    }
    if (message.type() === 'error') {
      throw new Error('Unexpected console error: ' + message.text());
    }
  });
  return room;
}

export async function waitDefaultPageLoaded(page: Page) {
  await page.waitForSelector('default-page-block[data-block-id="0"]');
}

export async function waitNextFrame(page: Page) {
  await page.waitForTimeout(NEXT_FRAME_TIMEOUT);
}

export async function clearLog(page: Page) {
  await page.evaluate(() => console.clear());
}

export async function resetHistory(page: Page) {
  await page.evaluate(() => {
    const space = window.space;
    space.resetHistory();
  });
}

export async function enterPlaygroundWithList(page: Page) {
  const room = generateRandomRoomId();
  await page.goto(`${DEFAULT_PLAYGROUND}?init=list&room=${room}&isTest=true`);
  await page.evaluate(() => {
    const space = window.store
      .createSpace('page-test')
      .register(window.blockSchema);
    window.space = space;
    const editor = document.createElement('editor-container');
    editor.space = space;
    document.body.appendChild(editor);

    const pageId = space.addBlock({ flavour: 'affine:page' });
    const groupId = space.addBlock({ flavour: 'affine:group' }, pageId);
    for (let i = 0; i < 3; i++) {
      space.addBlock({ flavour: 'affine:list' }, groupId);
    }
  });
  await waitNextFrame(page);
}

export async function initEmptyState(page: Page) {
  const id = await page.evaluate(() => {
    const space = window.store
      .createSpace('page-test')
      .register(window.blockSchema);
    window.space = space;
    const editor = document.createElement('editor-container');

    editor.space = space;
    document.body.appendChild(editor);

    const pageId = space.addBlock({ flavour: 'affine:page' });
    const groupId = space.addBlock({ flavour: 'affine:group' }, pageId);
    const paragraphId = space.addBlock(
      { flavour: 'affine:paragraph' },
      groupId
    );
    return { pageId, groupId, paragraphId };
  });
  return id;
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

export async function initThreeList(page: Page) {
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

export async function getQuillSelectionIndex(page: Page) {
  return await page.evaluate(() => {
    const selection = window.getSelection() as Selection;

    const range = selection.getRangeAt(0);
    const component = range.startContainer.parentElement?.closest('rich-text');
    // @ts-ignore
    const index = component.quill?.getSelection()?.index;
    return index !== undefined ? index : -1;
  });
}

export async function getQuillSelectionText(page: Page) {
  return await page.evaluate(() => {
    const selection = window.getSelection() as Selection;
    const range = selection.getRangeAt(0);
    const component = range.startContainer.parentElement?.closest('rich-text');
    // @ts-ignore
    return component.quill?.getText() || '';
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
      // @ts-ignore
      component.quill?.setSelection(index, length);
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
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        preventDefault: () => {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        stopPropagation: () => {},
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
