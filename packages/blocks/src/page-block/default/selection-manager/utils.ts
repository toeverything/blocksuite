import { getCurrentBlockRange } from '@blocksuite/blocks';
import type { Page, UserRange } from '@blocksuite/store';

import { getModelByElement } from '../../../__internal__/index.js';
import type { BlockComponentElement, IPoint } from '../../../std.js';
import type { PageSelectionType } from './index.js';

function intersects(a: DOMRect, b: DOMRect, offset: IPoint) {
  return (
    a.left + offset.x <= b.right &&
    a.right + offset.x >= b.left &&
    a.top + offset.y <= b.bottom &&
    a.bottom + offset.y >= b.top
  );
}

/*
function contains(bound: DOMRect, a: DOMRect, offset: IPoint) {
  return (
    a.left >= bound.left + offset.x &&
    a.right <= bound.right + offset.x &&
    a.top >= bound.top + offset.y &&
    a.bottom <= bound.bottom + offset.y
  );
}
*/
function contains(parent: Element, node: Element) {
  return (
    parent.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY
  );
}

// See https://github.com/toeverything/blocksuite/pull/904 and
// https://github.com/toeverything/blocksuite/issues/839#issuecomment-1411742112
// for more context.
//
// The `selectionRect` is a rect of drag-and-drop selection.
export function filterSelectedBlockWithoutSubtree(
  blockCache: Map<BlockComponentElement, DOMRect>,
  selectionRect: DOMRect,
  offset: IPoint
) {
  const entries = Array.from(blockCache.entries());
  const len = entries.length;
  const results: { block: BlockComponentElement; index: number }[] = [];

  // empty
  if (len === 0) return results;

  let prevIndex = -1;

  for (let i = 0; i < len; i++) {
    const [block, rect] = entries[i];
    if (intersects(rect, selectionRect, offset)) {
      if (prevIndex === -1) {
        prevIndex = i;
      } else {
        let prevBlock = entries[prevIndex][0];
        // prev block before and contains block
        if (contains(prevBlock, block)) {
          // not continuous block
          if (results.length > 1) {
            continue;
          }
          prevIndex = i;
          results.shift();
        } else {
          // backward search parent block and remove its subtree
          // only keep blocks of same level
          const { previousElementSibling } = block;
          // previousElementSibling is not prev block and previousElementSibling contains prev block
          if (
            previousElementSibling &&
            previousElementSibling !== prevBlock &&
            contains(previousElementSibling, prevBlock)
          ) {
            let n = i;
            let m = results.length;
            while (n--) {
              prevBlock = entries[n][0];
              if (prevBlock === previousElementSibling) {
                results.push({ block: prevBlock, index: n });
                break;
              } else if (m > 0) {
                results.pop();
                m--;
              }
            }
          }
          prevIndex = i;
        }
      }

      results.push({ block, index: i });
    }
  }

  return results;
}

// Find the current focused block and its substree.
// The `selectionRect` is a rect of block element.
export function filterSelectedBlockByIndexAndBound(
  blockCache: Map<BlockComponentElement, DOMRect>,
  focusedBlockIndex: number,
  selectionRect: DOMRect,
  offset: IPoint = {
    x: 0,
    y: 0,
  }
): BlockComponentElement[] {
  // SELECT_ALL
  if (focusedBlockIndex === -1) {
    return Array.from(blockCache.keys());
  }

  const entries = Array.from(blockCache.entries());
  const len = entries.length;
  const results = [];
  let prevBlock: Element | null = null;

  for (let i = focusedBlockIndex; i < len; i++) {
    const [block, rect] = entries[i];
    if (prevBlock) {
      // prev block contains block
      if (contains(prevBlock, block)) {
        results.push(block);
      } else {
        break;
      }
    } else {
      const richText = block.querySelector('rich-text');
      const nextRect = richText?.getBoundingClientRect() || rect;

      if (nextRect && intersects(rect, selectionRect, offset)) {
        prevBlock = block;
        results.push(block);
      }
    }
  }

  return results;
}

// Find the current focused block and its substree.
export function filterSelectedBlockByIndex(
  blockCache: Map<BlockComponentElement, DOMRect>,
  index: number
): BlockComponentElement[] {
  const blocks = Array.from(blockCache.keys());
  // SELECT_ALL
  if (index === -1) {
    return blocks;
  }

  const len = blocks.length;
  const results: BlockComponentElement[] = [];

  if (index > len - 1) {
    return results;
  }

  const prevBlock = blocks[index];

  results.push(prevBlock);

  for (let i = index + 1; i < len; i++) {
    // prev block contains block
    if (contains(prevBlock, blocks[i])) {
      results.push(blocks[i]);
    } else {
      break;
    }
  }

  return results;
}

// clear subtree in block for drawing rect
export function clearSubtree(
  selectedBlocks: BlockComponentElement[],
  prevBlock: BlockComponentElement
) {
  return selectedBlocks.filter((block, index) => {
    if (index === 0) return true;
    // prev block contains block
    if (contains(prevBlock, block)) {
      return false;
    } else {
      prevBlock = block;
      return true;
    }
  });
}

// find blocks and its subtree
export function findBlocksWithSubtree(
  blockCache: Map<BlockComponentElement, DOMRect>,
  selectedBlocksWithoutSubtree: {
    block: BlockComponentElement;
    index: number;
  }[] = []
) {
  const results = [];
  const len = selectedBlocksWithoutSubtree.length;

  for (let i = 0; i < len; i++) {
    const { index } = selectedBlocksWithoutSubtree[i];
    // find block's subtree
    results.push(...filterSelectedBlockByIndex(blockCache, index));
  }

  return results;
}

// TODO
// function filterSelectedEmbed(
//   embedCache: Map<EmbedBlockComponent, DOMRect>,
//   selectionRect: DOMRect
// ): EmbedBlockComponent[] {
//   const embeds = Array.from(embedCache.keys());
//   return embeds.filter(embed => {
//     const rect = embed.getBoundingClientRect();
//     return intersects(rect, selectionRect);
//   });
// }

export function createSelectionRect(
  current: { x: number; y: number },
  start: { x: number; y: number }
) {
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);
  const left = Math.min(current.x, start.x);
  const top = Math.min(current.y, start.y);
  return new DOMRect(left, top, width, height);
}

export function computeSelectionType(
  selectedBlocks: Element[],
  selectionType?: PageSelectionType
) {
  let newSelectionType: PageSelectionType = selectionType ?? 'native';
  const isOnlyBlock = selectedBlocks.length === 1;
  for (const block of selectedBlocks) {
    if (selectionType) continue;
    if (!('model' in block)) continue;

    // Calculate selection type
    const model = getModelByElement(block);
    newSelectionType = 'block';

    // Other selection types are possible if only one block is selected
    if (!isOnlyBlock) continue;

    const flavour = model.flavour;
    switch (flavour) {
      case 'affine:embed': {
        newSelectionType = 'embed';
        break;
      }
      case 'affine:database': {
        newSelectionType = 'database';
        break;
      }
    }
  }
  return newSelectionType;
}

export function updateLocalSelectionRange(page: Page) {
  const blockRange = getCurrentBlockRange(page);
  if (blockRange && blockRange.type === 'Native') {
    const userRange: UserRange = {
      startOffset: blockRange.startOffset,
      endOffset: blockRange.endOffset,
      blockIds: blockRange.models.map(m => m.id),
    };
    page.awarenessStore.setLocalRange(page, userRange);
  }
}
