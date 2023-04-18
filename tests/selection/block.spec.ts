/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

import {
  activeEmbed,
  copyByKeyboard,
  dragBetweenCoords,
  dragBetweenIndices,
  enterPlaygroundRoom,
  focusRichText,
  getIndexCoordinate,
  getRichTextBoundingBox,
  initEmptyParagraphState,
  initImageState,
  initThreeLists,
  initThreeParagraphs,
  pasteByKeyboard,
  pressBackspace,
  pressEnter,
  pressTab,
  redoByKeyboard,
  resetHistory,
  shamefullyBlurActiveElement,
  SHORT_KEY,
  type,
  undoByKeyboard,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertAlmostEqual,
  assertBlockCount,
  assertRichTexts,
  assertStoreMatchJSX,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('block level range delete', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await resetHistory(page);

  const box123 = await getRichTextBoundingBox(page, '2');
  const above123 = { x: box123.left, y: box123.top - 10 };

  const box789 = await getRichTextBoundingBox(page, '4');
  const below789 = { x: box789.right - 10, y: box789.bottom + 10 };

  await dragBetweenCoords(page, below789, above123);
  await pressBackspace(page);
  await assertBlockCount(page, 'paragraph', 1);
  await assertRichTexts(page, ['']);

  await waitNextFrame(page);
  await undoByKeyboard(page);
  // FIXME
  // await assertRichTexts(page, ['123', '456', '789']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['']);
});

// XXX: Doesn't simulate full user operation due to backspace cursor issue in Playwright.
test('select all and delete', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await page.keyboard.press(`${SHORT_KEY}+a`);
  await page.keyboard.press(`${SHORT_KEY}+a`);
  await shamefullyBlurActiveElement(page);
  await page.keyboard.press('Backspace');
  await focusRichText(page, 0);
  await type(page, 'abc');
  await assertRichTexts(page, ['abc']);
});

async function clickListIcon(page: Page, i = 0) {
  const locator = page.locator('.affine-list-block__prefix').nth(i);
  await locator.click();
}

test('click the list icon can select and copy', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeLists(page);
  await assertRichTexts(page, ['123', '456', '789']);
  await clickListIcon(page, 0);
  // copy 123
  await copyByKeyboard(page);

  await focusRichText(page, 2);
  await pasteByKeyboard(page);
  await assertRichTexts(page, ['123', '456', '789123']);

  // copy 789123
  await clickListIcon(page, 2);
  await copyByKeyboard(page);

  await focusRichText(page, 0);
  await pasteByKeyboard(page);
  await assertRichTexts(page, ['123789123', '456', '789123']);
});

test('click the list icon can select and delete', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeLists(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await clickListIcon(page, 0);
  await pressBackspace(page);
  await shamefullyBlurActiveElement(page);
  await pressBackspace(page);
  await assertRichTexts(page, ['', '456', '789']);
  await clickListIcon(page, 0);
  await shamefullyBlurActiveElement(page);
  await pressBackspace(page);
  await assertRichTexts(page, ['', '']);
});

test('selection on heavy page', async ({ page }) => {
  await page
    .locator('body')
    .evaluate(element => (element.style.padding = '50px'));
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  for (let i = 0; i < 5; i++) {
    await type(page, `Line ${i + 1}`);
    await pressEnter(page);
  }
  const [first, last] = await page.evaluate(() => {
    const first = document.querySelector('[data-block-id="2"]');
    if (!first) {
      throw new Error();
    }

    const last = document.querySelector('[data-block-id="6"]');
    if (!last) {
      throw new Error();
    }
    return [first.getBoundingClientRect(), last.getBoundingClientRect()];
  });
  await dragBetweenCoords(
    page,
    {
      x: first.x - 1,
      y: first.y - 1,
    },
    {
      x: last.x + 1,
      y: last.y + 1,
    },
    {
      beforeMouseUp: async () => {
        const rect = await page
          .locator('.affine-page-dragging-area')
          .evaluate(element => element.getBoundingClientRect());
        assertAlmostEqual(rect.x, first.x - 1, 1);
        assertAlmostEqual(rect.y, first.y - 1, 1);
        assertAlmostEqual(rect.right, last.x + 1, 1);
        assertAlmostEqual(rect.bottom, last.y + 1, 1);
      },
    }
  );
  const rects = page.locator('affine-selected-blocks > *');
  await expect(rects).toHaveCount(5);
});

test('should indent multi-selection block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);
  const coord = await getIndexCoordinate(page, [1, 2]);

  // blur
  await page.mouse.click(0, 0);
  await page.mouse.move(coord.x - 26 - 24, coord.y - 10);
  await page.mouse.down();
  // ←
  await page.mouse.move(coord.x + 20, coord.y + 50);
  await page.mouse.up();

  await page.keyboard.press('Tab');

  await assertStoreMatchJSX(
    page,
    `<affine:page>
  <affine:frame
    prop:background="--affine-background-secondary-color"
  >
    <affine:paragraph
      prop:text="123"
      prop:type="text"
    >
      <affine:paragraph
        prop:text="456"
        prop:type="text"
      />
      <affine:paragraph
        prop:text="789"
        prop:type="text"
      />
    </affine:paragraph>
  </affine:frame>
</affine:page>`
  );
});

// ↑
test('should keep selection state when scrolling backward', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);

  await assertRichTexts(page, ['123', '456', '789']);

  for (let i = 0; i < 6; i++) {
    await pressEnter(page);
  }

  await type(page, '987');
  await pressEnter(page);
  await type(page, '654');
  await pressEnter(page);
  await type(page, '321');

  const data = new Array(5).fill('');
  data.unshift(...['123', '456', '789']);
  data.push(...['987', '654', '321']);
  await assertRichTexts(page, data);

  const [viewport, container, distance] = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTo(0, distance);

    const container = viewport.querySelector(
      '.affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    return [
      viewport.getBoundingClientRect(),
      container.getBoundingClientRect(),
      distance,
    ] as const;
  });

  await page.mouse.move(0, 0);

  await dragBetweenCoords(
    page,
    {
      x: container.right + 1,
      y: viewport.height - 1,
    },
    {
      x: container.right - 1,
      y: 1,
    },
    {
      // dont release mouse
      beforeMouseUp: async () => {
        const count = distance / (10 * 0.25);
        await page.waitForTimeout((1000 / 60) * count);
      },
    }
  );

  const scrollTop = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  const rects = page.locator('affine-selected-blocks > *');
  await expect(rects).toHaveCount(3 + 5 + 3);
  expect(scrollTop).toBe(0);
});

// ↓
test('should keep selection state when scrolling forward', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  for (let i = 0; i < 6; i++) {
    await pressEnter(page);
  }

  await type(page, '987');
  await pressEnter(page);
  await type(page, '654');
  await pressEnter(page);
  await type(page, '321');

  const data = new Array(5).fill('');
  data.unshift(...['123', '456', '789']);
  data.push(...['987', '654', '321']);
  await assertRichTexts(page, data);

  const [viewport, container, distance] = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    const container = viewport.querySelector(
      '.affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    return [
      viewport.getBoundingClientRect(),
      container.getBoundingClientRect(),
      distance,
    ] as const;
  });

  await page.mouse.move(0, 0);

  await dragBetweenCoords(
    page,
    {
      x: container.right + 1,
      y: 1,
    },
    {
      x: container.right - 1,
      y: viewport.height - 1,
    },
    {
      // dont release mouse
      beforeMouseUp: async () => {
        const count = distance / (10 * 0.25);
        await page.waitForTimeout((1000 / 60) * count);
      },
    }
  );

  const scrollTop = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });
  const rects = page.locator('affine-selected-blocks > *');
  await expect(rects).toHaveCount(3 + 5 + 3);
  // See https://jestjs.io/docs/expect#tobeclosetonumber-numdigits
  // Math.abs(scrollTop - distance) < Math.pow(10, -1 * -0.01)/2 = 0.511646496140377
  expect(scrollTop).toBeCloseTo(distance, -0.01);
});

// ↑
test('should keep selection state when scrolling backward with the scroll wheel', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  for (let i = 0; i < 6; i++) {
    await pressEnter(page);
  }

  await type(page, '987');
  await pressEnter(page);
  await type(page, '654');
  await pressEnter(page);
  await type(page, '321');

  const data = new Array(5).fill('');
  data.unshift(...['123', '456', '789']);
  data.push(...['987', '654', '321']);
  await assertRichTexts(page, data);

  const [last, distance] = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTo(0, distance);
    const container = viewport.querySelector(
      'affine-frame .affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    const last = container.lastElementChild;
    if (!last) {
      throw new Error();
    }
    return [last.getBoundingClientRect(), distance] as const;
  });
  await page.waitForTimeout(250);

  await page.mouse.move(0, 0);

  await dragBetweenCoords(
    page,
    {
      x: last.right + 1,
      y: last.top + 1,
    },
    {
      x: last.right - 1,
      y: last.top - 1,
    },
    {
      // dont release mouse
      beforeMouseUp: async () => {
        await page.mouse.wheel(0, -distance * 2);
        await page.waitForTimeout(250);
      },
    }
  );

  // get count with scroll wheel
  const rects = page.locator('affine-selected-blocks > *');
  const count0 = await rects.count();
  const scrollTop0 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  await page.mouse.move(0, 0);

  await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTo(0, distance);
  });
  await page.waitForTimeout(250);

  await dragBetweenCoords(
    page,
    {
      x: last.right + 1,
      y: last.top + 1,
    },
    {
      x: last.right - 1,
      y: last.top - 1 - distance,
    }
  );

  // get count with moving mouse
  const count1 = await rects.count();
  const scrollTop1 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  expect(count0).toBe(count1);
  expect(scrollTop0).toBe(0);
  expect(scrollTop1).toBeCloseTo(distance, -0.5);
});

// ↓
test('should keep selection state when scrolling forward with the scroll wheel', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  for (let i = 0; i < 6; i++) {
    await pressEnter(page);
  }

  await type(page, '987');
  await pressEnter(page);
  await type(page, '654');
  await pressEnter(page);
  await type(page, '321');

  const data = new Array(5).fill('');
  data.unshift(...['123', '456', '789']);
  data.push(...['987', '654', '321']);
  await assertRichTexts(page, data);

  const [first, distance] = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    const container = viewport.querySelector(
      'affine-frame .affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    const first = container.firstElementChild;
    if (!first) {
      throw new Error();
    }
    return [first.getBoundingClientRect(), distance] as const;
  });

  await page.mouse.move(0, 0);

  await dragBetweenCoords(
    page,
    {
      x: first.left - 1,
      y: first.top - 1,
    },
    {
      x: first.left + 1,
      y: first.top + 1,
    },
    {
      // dont release mouse
      beforeMouseUp: async () => {
        await page.mouse.wheel(0, distance * 2);
        await page.waitForTimeout(250);
      },
    }
  );

  // get count with scroll wheel
  const rects = page.locator('affine-selected-blocks > *');
  const count0 = await rects.count();
  const scrollTop0 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  await page.mouse.move(0, 0);

  await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    viewport.scrollTo(0, 0);
  });
  await page.waitForTimeout(250);

  await dragBetweenCoords(
    page,
    {
      x: first.left - 1,
      y: first.top - 1,
    },
    {
      x: first.left + 1,
      y: first.top + 1 + distance,
    }
  );

  // get count with moving mouse
  const count1 = await rects.count();
  const scrollTop1 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  expect(count0).toBe(count1);
  expect(scrollTop0).toBeCloseTo(distance, -0.8);
  expect(scrollTop1).toBe(0);
});

test('should not clear selected rects when clicking on scrollbar', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  for (let i = 0; i < 6; i++) {
    await pressEnter(page);
  }

  await type(page, '987');
  await pressEnter(page);
  await type(page, '654');
  await pressEnter(page);
  await type(page, '321');

  const [viewport, first, distance] = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTo(0, distance / 2);
    const container = viewport.querySelector(
      'affine-frame .affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    const first = container.firstElementChild;
    if (!first) {
      throw new Error();
    }
    return [
      viewport.getBoundingClientRect(),
      first.getBoundingClientRect(),
      distance,
    ] as const;
  });

  await page.mouse.move(0, 0);

  await dragBetweenCoords(
    page,
    {
      x: first.left - 1,
      y: first.top - 1,
    },
    {
      x: first.left + 1,
      y: first.top + distance / 2,
    }
  );

  const rects = page.locator('affine-selected-blocks > *');
  const count0 = await rects.count();
  const scrollTop0 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  await page.mouse.click(viewport.right, distance / 2);

  const count1 = await rects.count();
  const scrollTop1 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  expect(count0).toBeGreaterThan(0);
  expect(scrollTop0).toBeCloseTo(distance / 2, -0.01);
  expect(count0).toBe(count1);
  expect(scrollTop0).toBeCloseTo(scrollTop1, -0.01);
});

test('should not clear selected rects when scrolling the wheel', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  for (let i = 0; i < 6; i++) {
    await pressEnter(page);
  }

  await type(page, '987');
  await pressEnter(page);
  await type(page, '654');
  await pressEnter(page);
  await type(page, '321');

  const [viewport, first, distance] = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTo(0, distance / 2);
    const container = viewport.querySelector(
      'affine-frame .affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    const first = container.firstElementChild;
    if (!first) {
      throw new Error();
    }
    return [
      viewport.getBoundingClientRect(),
      first.getBoundingClientRect(),
      distance,
    ] as const;
  });

  await page.mouse.move(0, 0);

  await dragBetweenCoords(
    page,
    {
      x: first.left - 1,
      y: first.top - 1,
    },
    {
      x: first.left + 1,
      y: first.top + distance / 2,
    }
  );

  const rects = page.locator('affine-selected-blocks > *');
  const count0 = await rects.count();

  await page.mouse.wheel(viewport.right, -distance / 4);
  await waitNextFrame(page);

  const count1 = await rects.count();

  expect(count0).toBeGreaterThan(0);
  expect(count0).toBe(count1);

  await page.mouse.wheel(viewport.right, distance / 4);
  await waitNextFrame(page);

  const count2 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport
      .querySelector('affine-selected-blocks')
      ?.shadowRoot?.querySelectorAll('*').length;
  });

  expect(count0).toBe(count2);
});

test('should refresh selected rects when resizing the window/viewport', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  for (let i = 0; i < 6; i++) {
    await pressEnter(page);
  }

  await type(page, '987');
  await pressEnter(page);
  await type(page, '654');
  await pressEnter(page);
  await type(page, '321');

  const [viewport, first, distance] = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const distance = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTo(0, distance / 2);
    const container = viewport.querySelector(
      'affine-frame .affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    const first = container.firstElementChild;
    if (!first) {
      throw new Error();
    }
    return [
      viewport.getBoundingClientRect(),
      first.getBoundingClientRect(),
      distance,
    ] as const;
  });

  await page.mouse.move(0, 0);

  await dragBetweenCoords(
    page,
    {
      x: first.left - 1,
      y: first.top - 1,
    },
    {
      x: first.left + 1,
      y: first.top + distance / 2,
    }
  );

  const rects = page.locator('affine-selected-blocks > *');
  const count0 = await rects.count();
  const scrollTop0 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  await page.mouse.click(viewport.right, first.top + distance / 2);

  const size = page.viewportSize();

  if (!size) {
    throw new Error();
  }

  await page.setViewportSize({
    width: size.width - 100,
    height: size.height - 100,
  });
  await page.waitForTimeout(250);

  const count1 = await rects.count();
  const scrollTop1 = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    return viewport.scrollTop;
  });

  expect(count0).toBe(count1);
  expect(scrollTop0).toBeCloseTo(scrollTop1, -0.01);
});

test('should clear block selection before native selection', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  // `123`
  const first = await page.evaluate(() => {
    const first = document.querySelector('[data-block-id="2"]');
    if (!first) {
      throw new Error();
    }
    return first.getBoundingClientRect();
  });

  await dragBetweenCoords(
    page,
    {
      x: first.left - 1,
      y: first.top - 1,
    },
    {
      x: first.left + 1,
      y: first.top + 1,
    }
  );

  const rects = page.locator('affine-selected-blocks > *');
  const count0 = await rects.count();

  await dragBetweenIndices(
    page,
    [1, 3],
    [1, 0],
    { x: 0, y: 0 },
    { x: 0, y: 0 }
  );

  const count1 = await rects.count();
  const textCount = await page.evaluate(() => {
    return window.getSelection()?.rangeCount || 0;
  });

  expect(count0).toBe(1);
  expect(count1).toBe(0);
  expect(textCount).toBe(1);
});

test('should not be misaligned when the editor container has padding or margin', async ({
  page,
}) => {
  await page.locator('body').evaluate(element => {
    element.style.margin = '50px';
    element.style.padding = '50px';
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  // `123`, `789`
  const [first, last] = await page.evaluate(() => {
    const viewport = document.querySelector('.affine-default-viewport');
    if (!viewport) {
      throw new Error();
    }
    const container = viewport.querySelector(
      'affine-frame .affine-block-children-container'
    );
    if (!container) {
      throw new Error();
    }
    const first = container.firstElementChild;
    if (!first) {
      throw new Error();
    }
    const last = container.lastElementChild;
    if (!last) {
      throw new Error();
    }
    return [first.getBoundingClientRect(), last.getBoundingClientRect()];
  });

  await dragBetweenCoords(
    page,
    {
      x: first.left - 1,
      y: first.top - 1,
    },
    {
      x: last.left + 1,
      y: last.top + 1,
    }
  );

  const rects = page.locator('affine-selected-blocks > *');
  await expect(rects).toHaveCount(3);
});

test('undo should clear block selection', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, 'hello');
  await pressEnter(page);
  await type(page, 'world');
  await pressEnter(page);

  const rect = await getRichTextBoundingBox(page, '2');
  await dragBetweenCoords(
    page,
    { x: rect.x - 5, y: rect.y - 5 },
    { x: rect.x + 5, y: rect.y + rect.height }
  );

  await redoByKeyboard(page);
  const selectedBlocks = page.locator('affine-selected-blocks > *');
  await expect(selectedBlocks).toHaveCount(1);

  await undoByKeyboard(page);
  await expect(selectedBlocks).toHaveCount(0);
});

test('should not draw rect for sub selected blocks when entering tab key', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);
  const coord = await getIndexCoordinate(page, [1, 2]);

  // blur
  await page.mouse.click(0, 0);
  await dragBetweenCoords(
    page,
    { x: coord.x - 26 - 24, y: coord.y - 10 },
    { x: coord.x + 20, y: coord.y + 50 }
  );
  await pressTab(page);

  await assertStoreMatchJSX(
    page,
    `
<affine:page>
  <affine:frame
    prop:background="--affine-background-secondary-color"
  >
    <affine:paragraph
      prop:text="123"
      prop:type="text"
    >
      <affine:paragraph
        prop:text="456"
        prop:type="text"
      />
      <affine:paragraph
        prop:text="789"
        prop:type="text"
      />
    </affine:paragraph>
  </affine:frame>
</affine:page>`
  );

  await page.mouse.click(0, 0);
  await page.mouse.click(coord.x - 40, coord.y - 40);
  await pressTab(page);

  const rects = page.locator('affine-selected-blocks > *');
  await expect(rects).toHaveCount(1);
});

test('should blur rich-text first on starting block selection', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  await expect(page.locator('*:focus')).toHaveCount(1);

  const coord = await getIndexCoordinate(page, [1, 2]);
  await dragBetweenCoords(
    page,
    { x: coord.x - 30, y: coord.y - 10 },
    { x: coord.x + 20, y: coord.y + 50 }
  );

  await expect(page.locator('*:focus')).toHaveCount(0);
});

test('should not show option menu of image on block selection', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initImageState(page);
  await activeEmbed(page);

  await expect(
    page.locator('.affine-embed-editing-state-container')
  ).toHaveCount(1);

  await pressEnter(page);
  await type(page, '123');

  const imageRect = await page.locator('affine-image').boundingBox();
  const richTextRect = await page.locator('rich-text').boundingBox();
  if (!imageRect || !richTextRect) {
    throw new Error();
  }

  await page.mouse.click(0, 0);

  await dragBetweenCoords(
    page,
    {
      x: richTextRect.x + richTextRect.width + 1,
      y: richTextRect.y + richTextRect.height + 1,
    },
    {
      x: imageRect.x + imageRect.width - 1,
      y: imageRect.y + imageRect.height - 1,
    }
  );

  await page.waitForTimeout(50);

  await expect(
    page.locator('.affine-embed-editing-state-container')
  ).toHaveCount(0);
  await expect(page.locator('affine-selected-blocks > *')).toHaveCount(2);
});
