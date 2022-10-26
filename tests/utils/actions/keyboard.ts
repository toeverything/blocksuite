import { Page } from '@playwright/test';

const IS_MAC = process.platform === 'darwin';
// const IS_WINDOWS = process.platform === 'win32';
// const IS_LINUX = !IS_MAC && !IS_WINDOWS;

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
async function keyDownOptionMeta(page: Page) {
  if (IS_MAC) {
    await page.keyboard.down('Alt');
  } else {
    await page.keyboard.down('shift');
  }
}

async function keyUpOptionMeta(page: Page) {
  if (IS_MAC) {
    await page.keyboard.up('Alt');
  } else {
    await page.keyboard.up('shift');
  }
}

// It's not good enough, but better than calling keyDownCtrlOrMeta and keyUpCtrlOrMeta separately
export const withCtrlOrMeta = async (page: Page, fn: () => Promise<void>) => {
  await keyDownCtrlOrMeta(page);
  await fn();
  await keyUpCtrlOrMeta(page);
};

export async function pressEnter(page: Page) {
  // avoid flaky test by simulate real user input
  await page.keyboard.press('Enter', { delay: 50 });
}

export async function undoByKeyboard(page: Page) {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press('z');
  await keyUpCtrlOrMeta(page);
}

export async function formatType(page: Page) {
  await keyDownCtrlOrMeta(page);
  await keyDownOptionMeta(page);
  await page.keyboard.press('1');
  await keyUpOptionMeta(page);
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

export async function copyByKeyboard(page: Page) {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press('c', { delay: 50 });
  await keyUpCtrlOrMeta(page);
}

export async function cutByKeyboard(page: Page) {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press('x', { delay: 50 });
  await keyUpCtrlOrMeta(page);
}

export async function pasteByKeyboard(page: Page) {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press('v', { delay: 50 });
  await keyUpCtrlOrMeta(page);
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
