import { Page } from '@playwright/test';

export async function dragBetweenCoords(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps = 1
) {
  const { x: x1, y: y1 } = from;
  const { x: x2, y: y2 } = to;
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  await page.mouse.move(x2, y2, { steps });
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

export async function dragOverTitle(page: Page) {
  const { from, to } = await page.evaluate(() => {
    const titleInput = document.querySelector(
      'input.affine-default-page-block-title'
    ) as HTMLInputElement;
    const titleBound = titleInput.getBoundingClientRect();
    const y = titleBound.top + titleBound.height / 2;

    return {
      from: { x: titleBound.left, y },
      to: { x: titleBound.right, y },
    };
  });
  await dragBetweenCoords(page, from, to, 5);
}
