import type { BaseBlockModel } from '@blocksuite/store';
import { assertExists, getBlockById } from '../../__internal__/utils';

export const pick = (blocks: BaseBlockModel[], x: number, y: number) => {
  for (let index = 0; index <= blocks.length - 1; index++) {
    if (blocks[index].flavour === 'affine:embed') {
      const hoverDom = getBlockById(blocks[index].id);
      const hoverImage = hoverDom?.querySelector('img');
      const imageRect = hoverImage?.getBoundingClientRect();
      assertExists(imageRect);
      if (isPointIn(imageRect, x, y)) {
        return {
          position: {
            x: imageRect.right,
            y: imageRect.top,
          },
          model: blocks[index],
        };
      } else {
        return null;
      }
    }
  }
  return null;
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
