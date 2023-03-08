// import type { ImageBlockComponent } from '@blocksuite/blocks/index.js';
import {
  BLOCK_CHILDREN_CONTAINER_PADDING_LEFT,
  BLOCK_ID_ATTR,
  DRAG_HANDLE_OFFSET_LEFT,
} from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';

import type { Loader } from '../../components/loader.js';
import type { BlockComponentElement, ContainerBlock } from './query.js';
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
 * Returns `true` if element is not page or frame.
 */
export function isBlock(element: Element) {
  return !isPageOrFrame(element);
}

/**
 * Returns `true` if element has `data-block-id` attribute.
 */
export function hasBlockId(element: Element) {
  return element.hasAttribute(BLOCK_ID_ATTR);
}

/**
 * Returns the closest block element by a point in the rect.
 *
 * ```
 * ########### block
 *     ...
 *   y - 2 * n
 *     ...
 * ----------- cursor
 *     ...
 *   y + 2 * n
 *     ...
 * ########### block
 * ```
 */
export function getClosestBlockElementByPoint(
  point: Point,
  { left, top, right, bottom }: Rect
): Element | null {
  const { y } = point;

  if (y < top || y > bottom) return null;

  let element = null;
  let n = 1;

  point.x = Math.floor(
    Math.min(
      Math.ceil(Math.max(point.x, left) + DRAG_HANDLE_OFFSET_X),
      right - 1
    )
  );

  do {
    // In some scenarios, e.g. `format-quick-bar` will be at the top.
    // Tip. Put `format-quick-bar` into `editor-container`.
    element =
      document.elementsFromPoint(point.x, point.y).find(hasBlockId) || null;

    if (element) {
      if (isPageOrFrame(element)) element = null;
      else return element;
    }

    point.y = y - n * 2;

    if (n < 0) n--;
    n *= -1;
  } while (n <= STEPS && point.y >= top && point.y <= bottom);

  return element;
}

/**
 * Returns the closest block element by a point in the rect in strict mode.
 */
export function getClosestBlockElementByPointInStrictMode(
  point: Point,
  rect: Rect,
  clamp = false
): Element | null {
  if (clamp) {
    // make sure `x` in [rect.left, rect.right] range.
    point.x = Math.floor(
      Math.min(Math.ceil(Math.max(point.x, rect.left)), rect.right - 1)
    );
  } else if (!rect.isPointIn(point)) return null;
  return getClosestBlockElementByElement(
    document.elementFromPoint(point.x, point.y)
  );
}

/**
 * Returns the closest block element by element.
 */
export function getClosestBlockElementByElement(element: Element | null) {
  if (!element) return null;
  if (hasBlockId(element) && isBlock(element)) {
    return element;
  }
  element = element.closest(BLOCK_ID_ATTR_SELECTOR);
  if (!element) return null;
  if (hasBlockId(element) && isBlock(element)) {
    return element;
  }
  return null;
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

/**
 * Returns all block elements in an element.
 */
export function getBlockElementsByElement(
  element: BlockComponentElement | Document | Element = document
) {
  return Array.from(element.querySelectorAll(BLOCK_ID_ATTR_SELECTOR)).filter(
    isBlock
  );
}

/**
 * Returns rect of the block element.
 */
export function getRectByBlockElement(
  element: Element | BlockComponentElement
) {
  return element.getBoundingClientRect();
}

/**
 * Returns block elements excluding their subtrees.
 * Only keep block elements of same level.
 */
export function getBlockElementsExcludeSubtrees(elements: Element[]) {
  if (!elements.length) return [];
  if (elements.length === 1) return elements;

  let parent = elements[0];

  return elements.filter((node, index) => {
    if (index === 0) return true;
    // prev block contains block
    if (contains(parent, node)) {
      return false;
    } else {
      parent = node;
      return true;
    }
  });
}

/**
 * Returns block elements including their subtrees.
 */
export function getBlockElementsIncludeSubtrees(elements: Element[]) {
  return elements.reduce<Element[]>((elements, element) => {
    elements.push(element, ...getBlockElementsByElement(element));
    return elements;
  }, []);
}
