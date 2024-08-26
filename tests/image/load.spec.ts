import type { Page } from '@playwright/test';

import { expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import {
  enterPlaygroundRoom,
  expectConsoleMessage,
} from '../utils/actions/index.js';
import { test } from '../utils/playwright.js';

const mockImageId = '_e2e_test_image_id_';

async function initMockImage(page: Page) {
  await page.evaluate(() => {
    const { doc } = window;
    doc.captureSync();
    const rootId = doc.addBlock('affine:page');
    const noteId = doc.addBlock('affine:note', {}, rootId);
    doc.addBlock(
      'affine:image',
      {
        sourceId: '_e2e_test_image_id_',
        width: 200,
        height: 180,
      },
      noteId
    );
    doc.captureSync();
  });
}

test('image loading but failed', async ({ page }) => {
  expectConsoleMessage(
    page,
    'Error: Failed to fetch blob _e2e_test_image_id_',
    'warning'
  );
  expectConsoleMessage(
    page,
    'Failed to load resource: the server responded with a status of 404 (Not Found)'
  );
  expectConsoleMessage(
    page,
    'Error: Image blob is missing!, retrying',
    'warning'
  );

  const room = await enterPlaygroundRoom(page, { blobSource: ['mock'] });
  const timeout = 2000;

  // block image data request, force wait 100ms for loading test,
  // always return 404
  await page.route(
    `**/api/collection/${room}/blob/${mockImageId}`,
    async route => {
      await page.waitForTimeout(timeout);
      // broken image
      return route.fulfill({
        status: 404,
      });
    }
  );

  await initMockImage(page);

  const loadingContent = await page
    .locator(
      '.affine-image-fallback-card .affine-image-fallback-card-title-text'
    )
    .innerText();
  expect(loadingContent).toBe('Loading image...');

  await page.waitForTimeout(3 * timeout);

  await expect(
    page.locator(
      '.affine-image-fallback-card .affine-image-fallback-card-title-text'
    )
  ).toContainText('Image loading failed.');
});

test('image loading but success', async ({ page }) => {
  expectConsoleMessage(
    page,
    'Error: Failed to fetch blob _e2e_test_image_id_',
    'warning'
  );
  expectConsoleMessage(
    page,
    'Failed to load resource: the server responded with a status of 404 (Not Found)'
  );
  expectConsoleMessage(
    page,
    'Error: Image blob is missing!, retrying',
    'warning'
  );

  const room = await enterPlaygroundRoom(page, { blobSource: ['mock'] });
  const imageBuffer = await readFile(
    fileURLToPath(new URL('../fixtures/smile.png', import.meta.url))
  );

  const timeout = 2000;
  let count = 0;

  // block image data request, force wait 100ms for loading test,
  // always return 404
  await page.route(
    `**/api/collection/${room}/blob/${mockImageId}`,
    async route => {
      await page.waitForTimeout(timeout);
      count++;
      if (count === 3) {
        return route.fulfill({
          status: 200,
          body: imageBuffer,
        });
      }
      // broken image
      return route.fulfill({
        status: 404,
      });
    }
  );

  await initMockImage(page);

  const loadingContent = await page
    .locator(
      '.affine-image-fallback-card .affine-image-fallback-card-title-text'
    )
    .innerText();
  expect(loadingContent).toBe('Loading image...');

  await page.waitForTimeout(3 * timeout);

  const img = page.locator('.affine-image-container img');
  await expect(img).toBeVisible();
  const src = await img.getAttribute('src');
  expect(src).toBeDefined();
});

test('image loaded successfully', async ({ page }) => {
  const room = await enterPlaygroundRoom(page, { blobSource: ['mock'] });
  const imageBuffer = await readFile(
    fileURLToPath(new URL('../fixtures/smile.png', import.meta.url))
  );
  await page.route(
    `**/api/collection/${room}/blob/${mockImageId}`,
    async route => {
      return route.fulfill({
        status: 200,
        body: imageBuffer,
      });
    }
  );

  await initMockImage(page);

  await page.waitForTimeout(1000);

  const img = page.locator('.affine-image-container img');
  await expect(img).toBeVisible();
  const src = await img.getAttribute('src');
  expect(src).toBeDefined();
});
