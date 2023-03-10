// import type { ImageBlockComponent } from '@blocksuite/blocks/index.js';
import {
  BLOCK_CHILDREN_CONTAINER_PADDING_LEFT,
  BLOCK_ID_ATTR,
} from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';

import type { Loader } from '../../components/loader.js';
import type { BlockComponentElement, ContainerBlock } from './query.js';
import type { Point, Rect } from './rect.js';

const AFFINE_CODE = 'AFFINE-CODE';
const AFFINE_DATABASE = 'AFFINE-DATABASE';
const AFFINE_DEFAULT_PAGE = 'AFFINE-DEFAULT-PAGE';
const AFFINE_DIVIDER = 'AFFINE-DIVIDER';
const AFFINE_FRAME = 'AFFINE-FRAME';
const AFFINE_IMAGE = 'AFFINE-IMAGE';
const AFFINE_LIST = 'AFFINE-LIST';
const BLOCK_ID_ATTR_SELECTOR = `[${BLOCK_ID_ATTR}]`;

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
 * Returns `true` if element has `data-block-id` attribute.
 */
export function hasBlockId(element: Element) {
  return element.hasAttribute(BLOCK_ID_ATTR);
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
 * Returns `true` if element is codeblock.
 */
export function isDivider({ tagName }: Element) {
  return tagName === AFFINE_DIVIDER;
}

/**
 * Returns `true` if element is list.
 */
export function isList({ tagName }: Element) {
  return tagName === AFFINE_LIST;
}

/**
 * Returns the closest block element by a point in the rect.
 *
 * ```
 * ############### block
 * ||############# block
 * ||||########### block
 * ||||    ...
 * ||||  y - 2 * n
 * ||||    ...
 * ||||----------- cursor
 * ||||    ...
 * ||||  y + 2 * n
 * ||||    ...
 * ||||########### block
 * ||############# block
 * ############### block
 * ```
 */
export function getClosestBlockElementByPoint(
  point: Point,
  rect?: Rect
): Element | null {
  const { y } = point;

  let element = null;
  let bounds = null;
  let n = 1;

  if (rect) {
    point.x = Math.min(
      Math.max(point.x, rect.left) + BLOCK_CHILDREN_CONTAINER_PADDING_LEFT - 1,
      rect.right - 1
    );
  }

  element =
    document.elementsFromPoint(point.x, point.y).find(hasBlockId) || null;

  // Horizontal direction: for nested structures
  if (element) {
    if (isBlock(element)) {
      bounds = getRectByBlockElement(element);
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

  // Vertical direction
  do {
    point.y = y - n * 2;

    if (n < 0) n--;
    n *= -1;

    element =
      document.elementsFromPoint(point.x, point.y).find(hasBlockId) || null;

    if (element) {
      if (isBlock(element)) {
        bounds = getRectByBlockElement(element);
        if (
          bounds.bottom - point.y <= STEPS * 2 ||
          point.y - bounds.top <= STEPS * 2
        ) {
          return element;
        }
      }
      element = null;
    }
  } while (n <= STEPS);

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
 *
 * Compatible with Safari!
 * https://github.com/toeverything/blocksuite/issues/902
 * https://github.com/toeverything/blocksuite/pull/1121
 */
export function getRectByBlockElement(
  element: Element | BlockComponentElement
) {
  return (element.firstElementChild ?? element).getBoundingClientRect();
}

/**
 * Returns block elements excluding their subtrees.
 * Only keep block elements of same level.
 */
export function getBlockElementsExcludeSubtrees(
  elements: Element[] | BlockComponentElement[]
) {
  if (elements.length <= 1) return elements;

  let parent = elements[0];

  return elements.filter((node, index) => {
    if (index === 0) return true;
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
