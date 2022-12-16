import type { Page } from '@playwright/test';

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

export async function clickMenuButton(page: Page, title: string) {
  await page.click(`button[aria-label="${title}"]`);
}

export async function switchMode(page: Page) {
  await page.click('button[aria-label="switch mode"]');
}

export async function switchMouseMode(page: Page) {
  await page.click('button[aria-label="switch mouse mode"]');
}

export async function switchShapeColor(page: Page, color: string) {
  await page.selectOption('select[aria-label="switch shape color"]', color);
}

export async function switchShapeType(page: Page, shapeType: string) {
  await page.selectOption('select[aria-label="switch shape type"]', shapeType);
}

export async function activeEmbed(page: Page) {
  await page.click('.resizable-img');
}
