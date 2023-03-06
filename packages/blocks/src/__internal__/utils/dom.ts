import {
  BLOCK_CHILDREN_CONTAINER_PADDING_LEFT,
  BLOCK_ID_ATTR,
  DRAG_HANDLE_OFFSET_LEFT,
} from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';

import type { Loader } from '../../components/loader.js';
import type { ContainerBlock } from './query.js';
import type { Point, Rect } from './rect.js';

// --affine-paragraph-space + 24px = 8px + 24px
const STEPS = 32 / 2 / 2 + 2;

const DRAG_HANDLE_OFFSET_X =
  DRAG_HANDLE_OFFSET_LEFT + BLOCK_CHILDREN_CONTAINER_PADDING_LEFT;

/**
 * Returns `16` if node is contained in the parent.
 * Otherwise return `0`.
 */
export function contains(parent: Element, node: Element) {
  return (
    parent.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY
  );
}

export function isBlockElement(element: Element) {
  return (
    element.tagName !== 'AFFINE-DEFAULT-PAGE' &&
    element.tagName !== 'AFFINE-FRAME'
  );
}

export function getClosestBlockElementByPoint(
  point: Point,
  rect: Rect
): Element | null {
  const y = point.y;
  let elem = null;
  let n = 1;

  point.x = Math.floor(
    Math.min(Math.max(point.x, rect.left) + DRAG_HANDLE_OFFSET_X, rect.right)
  );

  do {
    elem = document.elementFromPoint(point.x, point.y);
    if (elem) {
      if (!elem.getAttribute(BLOCK_ID_ATTR)) {
        elem = elem.closest(`[${BLOCK_ID_ATTR}]`);
      }
      if (elem) {
        if (isBlockElement(elem)) {
          return elem;
        }
        elem = null;
      }
    }

    point.y = y - n * 2;

    if (n < 0) {
      n--;
    }
    n *= -1;
  } while (n <= STEPS && point.y >= rect.top && point.y <= rect.bottom);

  return elem;
}

export function getModelByBlockElement(element: Element) {
  const containerBlock = element as ContainerBlock;
  // In extreme cases, the block may be loading, and the model is not yet available.
  // For example
  // // `<loader-element data-block-id="586080495:15" data-service-loading="true"></loader-element>`
  if ('hostModel' in containerBlock) {
    const loader = containerBlock as Loader;
    assertExists(loader.hostModel);
    return loader.hostModel;
  }
  assertExists(containerBlock.model);
  return containerBlock.model;
}
