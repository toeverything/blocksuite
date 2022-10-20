import { Page } from '@playwright/test';
import type { Store } from '../../packages/store';

export const IS_MAC = process.platform === 'darwin';
export const IS_WINDOWS = process.platform === 'win32';
export const IS_LINUX = !IS_MAC && !IS_WINDOWS;

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
  await page.goto(`${DEFAULT_PLAYGROUND}?room=${room}`);
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

export async function enterPlaygroundWithList(page: Page) {
  const room = generateRandomRoomId();
  await page.goto(`${DEFAULT_PLAYGROUND}?init=list&room=${room}`);
  await page.evaluate(() => {
    // @ts-ignore
    const store = window['store'] as Store;
    const pageId = store.addBlock({ flavour: 'page' });
    const groupId = store.addBlock({ flavour: 'group' }, pageId);
    for (let i = 0; i < 3; i++) {
      store.addBlock({ flavour: 'list' }, groupId);
    }
  });
  await waitNextFrame(page);
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

/**
 * Focus on the specified line, the title is line 0 and so on.
 * If line is not specified, focus on the title
 *
 * The implementation is depends on the keyboard behavior.
 */
export async function focusLine(page: Page, line = 0, end = true) {
  // Focus on the title
  await page.click('input.affine-default-page-block-title');
  if (!line) {
    if (end) {
      await page.keyboard.press('End');
    }
    return;
  }
  // Workaround move cursor from title to text only can use Tab, remove it after fixed
  await page.keyboard.press('Tab');
  line--;
  // End of workaround
  while (line-- > 0) {
    await page.keyboard.press('ArrowDown');
  }
  if (end) {
    await page.keyboard.press('End');
  }
}

async function keyDownCtrlOrMeta(page: Page) {
  if (IS_MAC) {
    await page.keyboard.down('Meta');
  } else {
    await page.keyboard.down('Control');
  }
}

async function keyUpCtrlOrMeta(page: Page) {
  if (IS_MAC) {
    await page.keyboard.up('Meta');
  } else {
    await page.keyboard.up('Control');
  }
}

// It's not good enough, but better than calling keyDownCtrlOrMeta and keyUpCtrlOrMeta separately
export const withCtrlOrMeta = async (page: Page, fn: () => Promise<void>) => {
  await keyDownCtrlOrMeta(page);
  await fn();
  await keyUpCtrlOrMeta(page);
};

export async function undoByKeyboard(page: Page) {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press('z');
  await keyUpCtrlOrMeta(page);
}

export async function redoByKeyboard(page: Page) {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.down('Shift');
  await page.keyboard.press('z');
  await page.keyboard.up('Shift');
  await keyUpCtrlOrMeta(page);
}

export async function selectAllByKeyboard(page: Page) {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press('a');
  await page.keyboard.up('a');
  await keyUpCtrlOrMeta(page);
}
export async function pressEnter(page: Page) {
  // avoid flaky test by simulate real user input
  await page.keyboard.press('Enter', { delay: 50 });
}

export async function undoByClick(page: Page) {
  await page.click('button[aria-label="undo"]');
}

export async function redoByClick(page: Page) {
  await page.click('button[aria-label="redo"]');
}

export async function disconnectByClick(page: Page) {
  await page.click('button[aria-label="disconnect"]');
}

export async function connectByClick(page: Page) {
  await page.click('button[aria-label="connect"]');
}

export async function convertToBulletedListByClick(page: Page) {
  await page.click('button[aria-label="convert to bulleted list"]');
}

export async function convertToNumberedListByClick(page: Page) {
  await page.click('button[aria-label="convert to numbered list"]');
}

export async function addGroupByClick(page: Page) {
  await page.click('button[aria-label="add group"]');
}

export async function dragBetweenCoords(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
  const { x: x1, y: y1 } = from;
  const { x: x2, y: y2 } = to;
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  await page.mouse.move(x2, y2);
  await page.mouse.up();
}

export async function dragBetweenIndices(
  page: Page,
  [startRichTextIndex, startQuillIndex]: [number, number],
  [endRichTextIndex, endQuillIndex]: [number, number]
) {
  const startCoord = await page.evaluate(
    ({ startRichTextIndex, startQuillIndex }) => {
      const richText =
        document.querySelectorAll('rich-text')[startRichTextIndex];
      const quillBound = richText.quill.getBounds(startQuillIndex);
      const richTextBound = richText.getBoundingClientRect();
      return {
        x: richTextBound.left + quillBound.left,
        y: richTextBound.top + quillBound.top + quillBound.height / 2,
      };
    },
    { startRichTextIndex, startQuillIndex }
  );

  const endCoord = await page.evaluate(
    ({ endRichTextIndex, endQuillIndex }) => {
      const richText = document.querySelectorAll('rich-text')[endRichTextIndex];
      const quillBound = richText.quill.getBounds(endQuillIndex);
      const richTextBound = richText.getBoundingClientRect();
      return {
        x: richTextBound.left + quillBound.left,
        y: richTextBound.top + quillBound.top + quillBound.height / 2,
      };
    },
    { endRichTextIndex, endQuillIndex }
  );

  await dragBetweenCoords(page, startCoord, endCoord);
}

export async function pressTab(page: Page) {
  await page.keyboard.press('Tab', { delay: 50 });
}

export async function pressShiftTab(page: Page) {
  await page.keyboard.down('Shift');
  await page.keyboard.press('Tab', { delay: 50 });
  await page.keyboard.up('Shift');
}

export async function pressShiftEnter(page: Page) {
  await page.keyboard.down('Shift');
  await page.keyboard.press('Enter', { delay: 50 });
  await page.keyboard.up('Shift');
}

export async function inlineCode(page: Page) {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press('e', { delay: 50 });
  await keyUpCtrlOrMeta(page);
}

export async function strikethrough(page: Page) {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.down('Shift');
  await page.keyboard.press('s', { delay: 50 });
  await keyUpCtrlOrMeta(page);
}

export async function clickMenuButton(page: Page, title: string) {
  await page.click(`button[aria-label="${title}"]`);
}

export async function switchMode(page: Page) {
  await page.click('button[aria-label="switch mode"]');
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

export async function getCursorBlockIdAndHeight(
  page: Page
): Promise<[string | null, number | null]> {
  return await page.evaluate(() => {
    const selection = window.getSelection() as Selection;

    const range = selection.getRangeAt(0);
    const startContainer =
      range.startContainer instanceof Text
        ? (range.startContainer.parentElement as HTMLElement)
        : (range.startContainer as HTMLElement);

    const startComponent = startContainer.closest(`[data-block-id]`);
    const { height } = (startComponent as HTMLElement).getBoundingClientRect();
    const id = (startComponent as HTMLElement).getAttribute('data-block-id');
    return [id, height];
  });
}

/**
 * fill a line by keep triggering key input
 * @param page
 * @param toNext if true, fill until soft wrap
 */
export async function fillLine(page: Page, toNext = false) {
  const [id, height] = await getCursorBlockIdAndHeight(page);
  if (id && height) {
    let nextHeight;
    // type until current block height is changed, means has new line
    do {
      await page.keyboard.type('a');
      [, nextHeight] = await getCursorBlockIdAndHeight(page);
    } while (nextHeight === height);
    if (!toNext) {
      page.keyboard.press('Backspace');
    }
  }
}

export async function copyKeyboard(page: Page) {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press('c', { delay: 50 });
  await keyUpCtrlOrMeta(page);
}

export async function cutKeyboard(page: Page) {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press('x', { delay: 50 });
  await keyUpCtrlOrMeta(page);
}

export async function pasteKeyboard(page: Page) {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press('v', { delay: 50 });
  await keyUpCtrlOrMeta(page);
}
