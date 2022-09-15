import { Page } from '@playwright/test';

export const IS_MAC = process.platform === 'darwin';
export const IS_WINDOWS = process.platform === 'win32';
export const IS_LINUX = !IS_MAC && !IS_WINDOWS;

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

export async function keyboardUndo(page: Page) {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press('z');
  await keyUpCtrlOrMeta(page);
}

export async function keyboardRedo(page: Page) {
  if (IS_MAC) {
    await page.keyboard.down('Meta');
    await page.keyboard.down('Shift');
    await page.keyboard.press('z');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Meta');
  } else {
    await page.keyboard.down('Control');
    await page.keyboard.press('y');
    await page.keyboard.up('Control');
  }
}
