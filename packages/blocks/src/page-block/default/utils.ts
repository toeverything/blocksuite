import type { BaseBlockModel } from '@blocksuite/store';
import { toast } from '../../components/toast';
import {
  assertExists,
  getBlockById,
  getBlockElementByModel,
} from '../../__internal__/utils';

export function getBlockOptionByPosition(
  blocks: BaseBlockModel[],
  x: number,
  y: number
) {
  for (let index = 0; index <= blocks.length - 1; index++) {
    // if (matchFlavours(blocks[index], ['affine:embed','affine'])) {
    const hoverDom = getBlockById(blocks[index].id);

    let blockRect;
    if (blocks[index].type === 'image') {
      const hoverImage = hoverDom?.querySelector('img');
      blockRect = hoverImage?.getBoundingClientRect();
    } else {
      blockRect = hoverDom?.getBoundingClientRect();
    }

    assertExists(blockRect);
    if (isPointIn(blockRect, x, y)) {
      return {
        position: blockRect,
        model: blocks[index],
      };
      // }
    }
  }
  return null;
}

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

export function downloadImage(url: string) {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('target', '_blank');
  document.body.appendChild(link);
  link.download = 'test';
  link.click();
  document.body.removeChild(link);
  link.remove();
}

export async function copyImgToClip(imgURL: string) {
  const data = await fetch(imgURL);
  const blob = await data.blob();
  await navigator.clipboard.write([
    new ClipboardItem({
      [blob.type]: blob,
    }),
  ]);
  toast('Copied image to clipboard');
}

export function focusCaption(model: BaseBlockModel) {
  const dom = getBlockElementByModel(model)?.querySelector(
    '.affine-embed-wrapper-caption'
  ) as HTMLInputElement;
  model.page.updateBlock(model, { showCaption: true });
  dom.focus();
}
