import { Page } from '@playwright/test';

export const IS_MAC = process.platform === 'darwin';
export const IS_WINDOWS = process.platform === 'win32';
export const IS_LINUX = !IS_MAC && !IS_WINDOWS;

const NEXT_FRAME_TIMEOUT = 50;
const DEFAULT_PLAYGROUNT = 'http://localhost:5173/';
const RICH_TEXT_SELECTOR = '.ql-editor';

function generateRandomRoomId() {
  return `virgo-${Math.random().toFixed(8).substring(2)}`;
}

export async function enterPlaygroundRoom(page: Page, room?: string) {
  if (!room) {
    room = generateRandomRoomId();
  }
  await page.goto(`${DEFAULT_PLAYGROUNT}?room=${room}`);
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
  await page.goto(`${DEFAULT_PLAYGROUNT}?init=list&room=${room}`);
  await waitNextFrame(page);
}

export async function focusRichText(page: Page, i = 0) {
  await page.mouse.move(0, 0);
  const locator = page.locator(RICH_TEXT_SELECTOR).nth(i);
  await locator.click();
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

export async function blurRichText(page: Page) {
  await page.mouse.move(0, 0);
  const locator = page.locator('.affine-editor-container');
  await locator.click();
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
  await keyDownCtrlOrMeta(page);
}

export async function selectAllByKeyboard(page: Page) {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press('a');
  await page.keyboard.up('a');
  await keyDownCtrlOrMeta(page);
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

export async function mouseDragFromTo(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
  const { x: x1, y: y1 } = from;
  const { x: x2, y: y2 } = to;
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  await page.mouse.move(x2, y2);
}

export async function shiftTab(page: Page) {
  await page.keyboard.down('Shift');
  await page.keyboard.press('Tab');
  await page.keyboard.up('Shift');
}

export async function shiftEnter(page: Page) {
  await page.keyboard.down('Shift');
  await page.keyboard.press('Enter');
  await page.keyboard.up('Shift');
}

export async function inlineCode(page: Page) {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press('e', { delay: 50 });
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
    const selection = document.getSelection();
    if (selection) {
      const range = selection.getRangeAt(0);
      const component =
        range.startContainer.parentElement?.closest('rich-text');
      // @ts-ignore
      const index = component._quill?.getSelection()?.index;
      return index !== undefined ? index : -1;
    }
    return -1;
  });
}

export async function getQuillSelectionText(page: Page) {
  return await page.evaluate(() => {
    const selection = document.getSelection();
    if (selection) {
      const range = selection.getRangeAt(0);
      const component =
        range.startContainer.parentElement?.closest('rich-text');
      // @ts-ignore
      return component._quill?.getText() || '';
    }
    return '';
  });
}

export async function getCursorBlockIdAndHeight(page: Page) {
  return await page.evaluate(() => {
    const selection = document.getSelection();
    if (selection) {
      const block =
        selection.anchorNode?.parentElement?.closest(`[data-block-id]`);
      if (block) {
        const id = block?.getAttribute('data-block-id');
        const height = block.getBoundingClientRect().height;
        if (id) {
          return [id, height];
        }
      }
    }
    return [null, null];
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
