import type { Page } from '@playwright/test';

export async function dragBetweenCoords(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  options?: {
    beforeMouseUp?: () => Promise<void>;
    steps?: number;
  }
) {
  const steps = options?.steps ?? 1;
  const { x: x1, y: y1 } = from;
  const { x: x2, y: y2 } = to;
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  await page.mouse.move(x2, y2, { steps });
  await options?.beforeMouseUp?.();
  await page.mouse.up();
}

export async function dragBetweenIndices(
  page: Page,
  [startRichTextIndex, startQuillIndex]: [number, number],
  [endRichTextIndex, endQuillIndex]: [number, number],
  startCoordOffSet: { x: number; y: number } = { x: 0, y: 0 },
  endCoordOffSet: { x: number; y: number } = { x: 0, y: 0 }
) {
  const startCoord = await page.evaluate(
    ({ startRichTextIndex, startQuillIndex, startCoordOffSet }) => {
      const richText =
        document.querySelectorAll('rich-text')[startRichTextIndex];
      const quillBound = richText.quill.getBounds(startQuillIndex);
      const richTextBound = richText.getBoundingClientRect();
      return {
        x: richTextBound.left + quillBound.left + startCoordOffSet.x,
        y:
          richTextBound.top +
          quillBound.top +
          quillBound.height / 2 +
          startCoordOffSet.y,
      };
    },
    { startRichTextIndex, startQuillIndex, startCoordOffSet }
  );

  const endCoord = await page.evaluate(
    ({ endRichTextIndex, endQuillIndex, endCoordOffSet }) => {
      const richText = document.querySelectorAll('rich-text')[endRichTextIndex];
      const quillBound = richText.quill.getBounds(endQuillIndex);
      const richTextBound = richText.getBoundingClientRect();
      return {
        x: richTextBound.left + quillBound.left + endCoordOffSet.x,
        y:
          richTextBound.top +
          quillBound.top +
          quillBound.height / 2 +
          endCoordOffSet.y,
      };
    },
    { endRichTextIndex, endQuillIndex, endCoordOffSet }
  );

  await dragBetweenCoords(page, startCoord, endCoord);
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

export async function dragEmbedResizeByBottomRight(page: Page) {
  const { from, to } = await page.evaluate(() => {
    const bottomRightButton = document.querySelector(
      '.bottom-right'
    ) as HTMLInputElement;
    const bottomRightButtonBound = bottomRightButton.getBoundingClientRect();
    const y = bottomRightButtonBound.top;
    return {
      from: { x: bottomRightButtonBound.left + 5, y: y + 5 },
      to: { x: bottomRightButtonBound.left + 110, y },
    };
  });
  await dragBetweenCoords(page, from, to, {
    steps: 5,
  });
}

export async function dragEmbedResizeByBottomLeft(page: Page) {
  const { from, to } = await page.evaluate(() => {
    const bottomRightButton = document.querySelector(
      '.bottom-left'
    ) as HTMLInputElement;
    const bottomRightButtonBound = bottomRightButton.getBoundingClientRect();
    const y = bottomRightButtonBound.top;
    return {
      from: { x: bottomRightButtonBound.left + 5, y: y + 5 },
      to: { x: bottomRightButtonBound.left - 110, y },
    };
  });
  await dragBetweenCoords(page, from, to, {
    steps: 5,
  });
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
