import {
  BLOCK_CHILDREN_CONTAINER_PADDING_LEFT,
  BLOCK_ID_ATTR,
  DRAG_HANDLE_OFFSET_LEFT,
} from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';

import type { Loader } from '../../components/loader.js';
import type { ContainerBlock } from './query.js';
import type { Point, Rect } from './rect.js';

const AFFINE_DEFAULT_PAGE = 'AFFINE-DEFAULT-PAGE';
const AFFINE_FRAME = 'AFFINE-FRAME';
const BLOCK_ID_ATTR_SELECTOR = `[${BLOCK_ID_ATTR}]`;

const DRAG_HANDLE_OFFSET_X =
  24 + DRAG_HANDLE_OFFSET_LEFT + BLOCK_CHILDREN_CONTAINER_PADDING_LEFT;

const STEPS = 32 / 2 / 2 + 2; // --affine-paragraph-space + 24px = 8px + 24px

/**
 * Returns `16` if node is contained in the parent.
 * Otherwise return `0`.
 */
export function contains(parent: Element, node: Element) {
  return (
    parent.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY
  );
}

/**
 * Returns `true` if element is page or frame.
 */
export function isPageOrFrame({ tagName }: Element) {
  return tagName === AFFINE_DEFAULT_PAGE || tagName === AFFINE_FRAME;
}

/**
 * Returns the closest block element by a point in the rect.
 */
export function getClosestBlockElementByPoint(
  point: Point,
  { left, top, right, bottom }: Rect
): Element | null {
  const { y } = point;

  if (y < top || y > bottom) return null;

  let elem = null;
  let n = 1;

  point.x = Math.floor(
    Math.min(Math.max(point.x, left) + DRAG_HANDLE_OFFSET_X, right)
  );

  do {
    elem = document.elementFromPoint(point.x, point.y);
    if (elem) {
      if (!elem.hasAttribute(BLOCK_ID_ATTR)) {
        elem = elem.closest(BLOCK_ID_ATTR_SELECTOR);
      }
      if (elem) {
        if (isPageOrFrame(elem)) elem = null;
        else return elem;
      }
    }

    point.y = y - n * 2;

    if (n < 0) n--;
    n *= -1;
  } while (n <= STEPS && point.y >= top && point.y <= bottom);

  return elem;
}

/**
 * Returns the model of the block element.
 */
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
