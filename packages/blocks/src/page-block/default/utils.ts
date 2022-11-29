import type { BaseBlockModel } from '@blocksuite/store';
import { assertExists, getBlockById } from '../../__internal__/utils';

export const pick = (blocks: BaseBlockModel[], x: number, y: number) => {
  let result = null;
  for (let index = 0; index <= blocks.length - 1; index++) {
    if (blocks[index].flavour === 'affine:embed') {
      const hoverDom = getBlockById(blocks[index].id);
      const hoverImage = hoverDom?.querySelector('img');
      const imageRect = hoverImage?.getBoundingClientRect();
      assertExists(imageRect);
      if (isPointIn(imageRect, x, y)) {
        result = {
          position: {
            x: imageRect.right + 10,
            y: imageRect.top,
          },
          model: blocks[index],
        };
      }
    }
  }
  return result;
};

function isPointIn(block: DOMRect, x: number, y: number): boolean {
  if (
    x < block.left ||
    x > block.left + block.width + 50 ||
    y < block.top ||
    y > block.top + block.height
  ) {
    return false;
  }
  return true;
}

export function downloadImage(url: string | undefined) {
  assertExists(url);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('target', '_blank');
  document.body.appendChild(link);
  link.download = 'test';
  link.click();
  document.body.removeChild(link);
  link.remove();
}

export async function writeClipImg(imgURL: string | undefined) {
  assertExists(imgURL);
  try {
    const data = await fetch(imgURL);
    const blob = await data.blob();

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.name, err.message);
    }
  }
}

export function deleteBlock(model: BaseBlockModel) {
  model.space.deleteBlock(model);
}
