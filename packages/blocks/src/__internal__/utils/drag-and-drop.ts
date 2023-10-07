import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';

import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '../consts.js';
import { matchFlavours } from './model.js';
import {
  type BlockComponentElement,
  DropFlags,
  getClosestBlockElementByElement,
  getDropRectByPoint,
  getModelByBlockElement,
  getRectByBlockElement,
} from './query.js';
import { type Point, Rect } from './rect.js';
import { type EditingState } from './types.js';

/**
 * A dropping type.
 */
/**
 * Question: Shall we add some comments here to describe each dropping type's meaning.
 * I'd like to add a new type for drop a block into another.
 */
export type DroppingType = 'none' | 'before' | 'after' | 'database' | 'in';

export type DropResult = {
  type: DroppingType;
  rect: Rect;
  modelState: EditingState;
};

/**
 * Calculates the drop target.
 */
export function calcDropTarget(
  point: Point,
  model: BaseBlockModel,
  element: Element,
  draggingElements: BlockComponentElement[],
  scale: number,
  flavour: string | null = null // for block-hub
): DropResult | null {
  const schema = model.page.getSchemaByFlavour('affine:database');
  assertExists(schema);
  const children = schema.model.children ?? [];

  let shouldAppendToDatabase = true;

  if (children.length) {
    if (draggingElements.length) {
      shouldAppendToDatabase = draggingElements
        .map(getModelByBlockElement)
        .every(m => children.includes(m.flavour));
    } else if (flavour) {
      shouldAppendToDatabase = children.includes(flavour);
    }
  }

  if (!shouldAppendToDatabase && !matchFlavours(model, ['affine:database'])) {
    const databaseBlockElement = element.closest('affine-database');
    if (databaseBlockElement) {
      element = databaseBlockElement;
      model = getModelByBlockElement(element);
    }
  }

  let type: DroppingType = 'none';
  const height = 3 * scale;
  const { rect: domRect, flag } = getDropRectByPoint(point, model, element);

  if (flag === DropFlags.EmptyDatabase) {
    // empty database
    const rect = Rect.fromDOMRect(domRect);
    rect.top -= height / 2;
    rect.height = height;
    type = 'database';

    return {
      type,
      rect,
      modelState: {
        model,
        rect: domRect,
        element: element as BlockComponentElement,
      },
    };
  } else if (flag === DropFlags.Database) {
    // not empty database
    const distanceToTop = Math.abs(domRect.top - point.y);
    const distanceToBottom = Math.abs(domRect.bottom - point.y);
    const before = distanceToTop < distanceToBottom;
    type = before ? 'before' : 'after';

    // Question: I still don't know what is database type for?
    const hasChild = (element as BlockComponentElement).childBlockElements
      .length;
    if (
      !hasChild &&
      point.x > domRect.x + BLOCK_CHILDREN_CONTAINER_PADDING_LEFT
    ) {
      type = 'in';
    }

    return {
      type,
      rect: Rect.fromLWTH(
        domRect.left,
        domRect.width,
        (before ? domRect.top - 1 : domRect.bottom) - height / 2,
        height
      ),
      modelState: {
        model,
        rect: domRect,
        element: element as BlockComponentElement,
      },
    };
  }

  const distanceToTop = Math.abs(domRect.top - point.y);
  const distanceToBottom = Math.abs(domRect.bottom - point.y);
  const before = distanceToTop < distanceToBottom;

  type = before ? 'before' : 'after';
  // If drop in target has children, we can use insert before or after children
  // to achieve the same effect.
  const hasChild = (element as BlockComponentElement).childBlockElements.length;
  if (
    !hasChild &&
    point.x > domRect.x + BLOCK_CHILDREN_CONTAINER_PADDING_LEFT
  ) {
    type = 'in';
  }
  let offsetY = 4;

  if (type === 'before') {
    // before
    let prev;
    let prevRect;

    prev = element.previousElementSibling;
    if (prev) {
      if (
        draggingElements.length &&
        prev === draggingElements[draggingElements.length - 1]
      ) {
        type = 'none';
      } else {
        prevRect = getRectByBlockElement(prev);
      }
    } else {
      prev = element.parentElement?.previousElementSibling;
      if (prev) {
        prevRect = prev.getBoundingClientRect();
      }
    }

    if (prevRect) {
      offsetY = (domRect.top - prevRect.bottom) / 2;
    }
  } else {
    // after
    let next;
    let nextRect;

    next = element.nextElementSibling;
    if (next) {
      if (draggingElements.length && next === draggingElements[0]) {
        type = 'none';
        next = null;
      }
    } else {
      next = getClosestBlockElementByElement(element.parentElement)
        ?.nextElementSibling;
    }

    if (next) {
      nextRect = getRectByBlockElement(next);
      offsetY = (nextRect.top - domRect.bottom) / 2;
    }
  }

  if (type === 'none') return null;

  let top = domRect.top;
  if (type === 'before') {
    top -= offsetY;
  } else {
    top += domRect.height + offsetY;
  }

  if (type === 'in') {
    domRect.x += BLOCK_CHILDREN_CONTAINER_PADDING_LEFT;
    domRect.width -= BLOCK_CHILDREN_CONTAINER_PADDING_LEFT;
  }

  return {
    type,
    rect: Rect.fromLWTH(domRect.left, domRect.width, top - height / 2, height),
    modelState: {
      model,
      rect: domRect,
      element: element as BlockComponentElement,
    },
  };
}
