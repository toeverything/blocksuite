import type { Page } from '@playwright/test';

import { getIndexCoordinate } from './misc.js';

export async function dragBetweenCoords(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  options?: {
    beforeMouseUp?: () => Promise<void>;
    steps?: number;
    click?: boolean;
  }
) {
  const steps = options?.steps ?? 20;
  const { x: x1, y: y1 } = from;
  const { x: x2, y: y2 } = to;
  options?.click && (await page.mouse.click(x1, y1));
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  await page.mouse.move(x2, y2, { steps });
  await options?.beforeMouseUp?.();
  await page.mouse.up();
}

export async function dragBetweenIndices(
  page: Page,
  [startRichTextIndex, startVIndex]: [number, number],
  [endRichTextIndex, endVIndex]: [number, number],
  startCoordOffSet: { x: number; y: number } = { x: 0, y: 0 },
  endCoordOffSet: { x: number; y: number } = { x: 0, y: 0 },
  options?: {
    beforeMouseUp?: () => Promise<void>;
    steps?: number;
    click?: boolean;
  }
) {
  const finalOptions = {
    steps: 50,
    ...(options || {}),
  };
  const startCoord = await getIndexCoordinate(
    page,
    [startRichTextIndex, startVIndex],
    startCoordOffSet
  );
  const endCoord = await getIndexCoordinate(
    page,
    [endRichTextIndex, endVIndex],
    endCoordOffSet
  );

  await dragBetweenCoords(page, startCoord, endCoord, finalOptions);
}

export async function dragOverTitle(page: Page) {
  const { from, to } = await page.evaluate(() => {
    const titleInput = document.querySelector(
      '.affine-default-page-block-title'
    ) as HTMLTextAreaElement;
    const titleBound = titleInput.getBoundingClientRect();

    return {
      from: { x: titleBound.left + 1, y: titleBound.top + 1 },
      to: { x: titleBound.right - 1, y: titleBound.bottom - 1 },
    };
  });
  await dragBetweenCoords(page, from, to, {
    steps: 5,
  });
}

export async function dragEmbedResizeByTopRight(page: Page) {
  const { from, to } = await page.evaluate(() => {
    const bottomRightButton = document.querySelector(
      '.top-right'
    ) as HTMLInputElement;
    const bottomRightButtonBound = bottomRightButton.getBoundingClientRect();
    const y = bottomRightButtonBound.top;
    return {
      from: { x: bottomRightButtonBound.left + 5, y: y + 5 },
      to: { x: bottomRightButtonBound.left + 5 - 200, y },
    };
  });
  await dragBetweenCoords(page, from, to, {
    steps: 10,
  });
}

export async function dragEmbedResizeByTopLeft(page: Page) {
  const { from, to } = await page.evaluate(() => {
    const bottomRightButton = document.querySelector(
      '.top-left'
    ) as HTMLInputElement;
    const bottomRightButtonBound = bottomRightButton.getBoundingClientRect();
    const y = bottomRightButtonBound.top;
    return {
      from: { x: bottomRightButtonBound.left + 5, y: y + 5 },
      to: { x: bottomRightButtonBound.left + 5 + 200, y },
    };
  });
  await dragBetweenCoords(page, from, to, {
    steps: 10,
  });
}

export async function dragHandleFromBlockToBlockBottomById(
  page: Page,
  sourceId: string,
  targetId: string,
  bottom = true,
  offset?: number,
  beforeMouseUp?: () => Promise<void>
) {
  const sourceBlock = await page
    .locator(`[data-block-id="${sourceId}"]`)
    .boundingBox();
  const targetBlock = await page
    .locator(`[data-block-id="${targetId}"]`)
    .boundingBox();
  if (!sourceBlock || !targetBlock) {
    throw new Error();
  }
  await page.mouse.move(
    sourceBlock.x + sourceBlock.width / 2,
    sourceBlock.y + sourceBlock.height / 2
  );
  const handle = await page.locator('affine-drag-handle').boundingBox();
  if (!handle) {
    throw new Error();
  }
  await page.mouse.move(
    handle.x + handle.width / 2,
    handle.y + handle.height / 2,
    { steps: 10 }
  );
  await page.mouse.down();
  await page.mouse.move(
    targetBlock.x + targetBlock.width / 2,
    targetBlock.y + (bottom ? targetBlock.height - 1 : 1),
    {
      steps: 50,
    }
  );

  if (offset) {
    await page.mouse.move(
      targetBlock.x - offset,
      targetBlock.y + (bottom ? targetBlock.height - 1 : 1),
      {
        steps: 50,
      }
    );
  }

  if (beforeMouseUp) {
    await beforeMouseUp();
  }

  await page.mouse.up();
}

export async function dragBlockToPoint(
  page: Page,
  sourceId: string,
  point: { x: number; y: number }
) {
  const sourceBlock = await page
    .locator(`[data-block-id="${sourceId}"]`)
    .boundingBox();
  if (!sourceBlock) {
    throw new Error();
  }
  await page.mouse.move(
    sourceBlock.x + sourceBlock.width / 2,
    sourceBlock.y + sourceBlock.height / 2
  );
  const handle = await page.locator('affine-drag-handle').boundingBox();
  if (!handle) {
    throw new Error();
  }
  await page.mouse.move(
    handle.x + handle.width / 2,
    handle.y + handle.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(point.x, point.y, {
    steps: 50,
  });

  await page.mouse.up();
}

export async function moveToImage(page: Page) {
  const { x, y } = await page.evaluate(() => {
    const bottomRightButton = document.querySelector('img') as HTMLElement;
    const imageClient = bottomRightButton.getBoundingClientRect();
    const y = imageClient.top;
    return {
      x: imageClient.left + 30,
      y: y + 30,
    };
  });
  await page.mouse.move(x, y);
}
