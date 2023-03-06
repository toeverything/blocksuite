import { BLOCK_ID_ATTR } from '@blocksuite/global/config';

import { Point, Rect } from './rect.js';

const STEPS = 32 / 2; // --affine-paragraph-space + 24px

/**
 * Returns `16` if node is contained in the parent.
 * Otherwise return `0`.
 */
export function contains(parent: Element, node: Element) {
  return (
    parent.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY
  );
}

export function isBlock(block: Element) {
  return (
    block.tagName !== 'AFFINE-DEFAULT-PAGE' && block.tagName !== 'AFFINE-FRAME'
  );
}

export function getBlockByPoint2(point: Point, rect: Rect) {
  const prev = point.clone();

  let n = 1;
  do {
    let elem = document.elementFromPoint(Math.max(point.x, rect.left), point.y);
    if (elem) {
      if (!elem.getAttribute(BLOCK_ID_ATTR)) {
        elem = elem.closest(`[${BLOCK_ID_ATTR}]`);
      }
      if (elem && isBlock(elem)) {
        return elem;
      }
    }

    point.y = prev.y - n * 2;
    if (n < 0) {
      n--;
    }
    n *= -1;
  } while (n <= STEPS && point.y >= rect.top && point.y <= rect.bottom);
}
