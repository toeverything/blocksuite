import { Page } from '@playwright/test';

export const IS_MAC = process.platform === 'darwin';
export const IS_WINDOWS = process.platform === 'win32';
export const IS_LINUX = !IS_MAC && !IS_WINDOWS;

export const defaultPlayground = 'http://localhost:5173/';
export const emptyInput = 'input';
export const richTextBox = '.ql-editor';

export async function enterPlaygroundRoom(page: Page, room?: string) {
  if (!room) {
    room = `virgo-${Math.random().toFixed(8).substring(2)}`;
  }
  await page.goto(`${defaultPlayground}?room=${room}`);
  return room;
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

export async function undoByClick(page: Page) {
  await page.click('text=Undo');
}

export async function redoByClick(page: Page) {
  await page.click('text=Redo');
}

export async function disconnectByClick(page: Page) {
  await page.click('text=Disconnect');
}

export async function connectByClick(page: Page) {
  await page.click('text=Connect');
}
