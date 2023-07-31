import { matchFlavours } from '@blocksuite/store';

import type {
  BlockComponentElement,
  IPoint,
} from '../../../__internal__/index.js';
import { contains } from '../../../__internal__/index.js';

function intersects(a: DOMRect, b: DOMRect, offset: IPoint) {
  return (
    a.left + offset.x < b.right &&
    a.right + offset.x > b.left &&
    a.top + offset.y < b.bottom &&
    a.bottom + offset.y > b.top
  );
}

function insides(a: DOMRect, b: DOMRect, offset: IPoint) {
  return (
    a.left + offset.x > b.left &&
    a.right + offset.x < b.right &&
    a.top + offset.y > b.top &&
    a.bottom + offset.y < b.bottom
  );
}

// See https://github.com/toeverything/blocksuite/pull/904 and
// https://github.com/toeverything/blocksuite/issues/839#issuecomment-1411742112
// for more context.
//
// The `bound` is a rect of drag-and-drop selection.
export function filterBlocksExcludeSubtrees(
  blockCache: Map<BlockComponentElement, DOMRect>,
  bound: DOMRect,
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
    if (intersects(rect, bound, offset)) {
      if (prevIndex === -1) {
        prevIndex = i;
        if (insides(bound, rect, offset)) {
          const prevBlock = entries[prevIndex][0];
          // inside database block
          if (matchFlavours(prevBlock.model, ['affine:database'])) {
            continue;
          }
        }
      } else {
        let prevBlock = entries[prevIndex][0];
        // prev block before and contains block
        if (contains(prevBlock, block)) {
          if (matchFlavours(prevBlock.model, ['affine:database'])) {
            continue;
          } else {
            // not continuous block
            if (results.length > 1) {
              continue;
            }
            prevIndex = i;
            results.shift();
          }
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
