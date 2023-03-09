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

const AFFINE_CODE = 'AFFINE-CODE';
const AFFINE_DATABASE = 'AFFINE-DATABASE';
const AFFINE_DEFAULT_PAGE = 'AFFINE-DEFAULT-PAGE';
const AFFINE_FRAME = 'AFFINE-FRAME';
const AFFINE_IMAGE = 'AFFINE-IMAGE';
const BLOCK_ID_ATTR_SELECTOR = `[${BLOCK_ID_ATTR}]`;

const DRAG_HANDLE_OFFSET_X = 24 + DRAG_HANDLE_OFFSET_LEFT;

// margin-top: calc(var(--affine-paragraph-space) + 24px);
// h1.margin-top = 8px + 24px = 32px;
const MAX_SPACE = 32;
const STEPS = MAX_SPACE / 2 / 2;

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
 * Returns `true` if element is image.
 */
export function isImage({ tagName }: Element) {
  return tagName === AFFINE_IMAGE;
}

/**
 * Returns `true` if element is codeblock.
 */
export function isCodeblock({ tagName }: Element) {
  return tagName === AFFINE_CODE;
}

/**
 * Returns `true` if element is codeblock.
 */
function isDatabase({ tagName }: Element) {
  return tagName === AFFINE_DATABASE;
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
  let bounds = null;
  let n = 1;

  point.x = Math.min(
    Math.max(point.x, left) + BLOCK_CHILDREN_CONTAINER_PADDING_LEFT - 1,
    right - 1
  );

  element =
    document.elementsFromPoint(point.x, point.y).find(hasBlockId) || null;

  if (element) {
    if (isBlock(element)) {
      bounds = element.getBoundingClientRect();
      if (point.x - bounds.x <= BLOCK_CHILDREN_CONTAINER_PADDING_LEFT) {
        if (isDatabase(element)) {
          bounds = element
            .querySelector('.affine-database-block-title')
            ?.getBoundingClientRect();
          if (bounds && point.y >= bounds.top && point.y <= bounds.bottom) {
            return element;
          }
          return null;
        } else {
          return element;
        }
      }
    }
    element = null;
  }

  do {
    point.y = y - n * 2;

    if (n < 0) n--;
    n *= -1;

    element =
      document.elementsFromPoint(point.x, point.y).find(hasBlockId) || null;

    if (element) {
      if (isBlock(element)) {
        if (isImage(element) || isCodeblock(element)) return element;
        bounds = element.getBoundingClientRect();
        if (
          point.y - bounds.top <= Math.abs(n) * 2 ||
          bounds.bottom - point.y <= Math.abs(n) * 2
        ) {
          return element;
        }
      }
      element = null;
    }
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
    point.x = Math.min(
      Math.max(point.x, rect.left) + BLOCK_CHILDREN_CONTAINER_PADDING_LEFT - 1,
      rect.right - 1
    );
  } else if (!rect.isPointIn(point)) return null;

  const { y } = point;
  const { top, bottom } = rect;
  let element = null;
  let n = 1;

  do {
    element = document.elementFromPoint(point.x, point.y);

    if (element) {
      element = getClosestBlockElementByElement(element);
      if (element) {
        const bounds = element.getBoundingClientRect();
        if (n < 0) {
          if (bounds.top - point.y >= n * 2) return element;
        } else {
          if (bounds.bottom - point.y <= n * 2) return element;
        }
        // if (point.x - bounds.left >= 0 && point.x - bounds.left <= DRAG_HANDLE_OFFSET_LEFT / 2) return element;
      }
      element = null;
    }

    point.y = y - n * 2;

    if (n < 0) n--;
    n *= -1;
  } while (n <= STEPS && point.y >= top && point.y <= bottom);

  return element;
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
  if (element && hasBlockId(element) && isBlock(element)) {
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
