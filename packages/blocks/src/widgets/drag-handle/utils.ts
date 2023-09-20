import {
  type BaseSelection,
  PathFinder,
  type PointerEventState,
} from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import type { BaseBlockModel, Page } from '@blocksuite/store';

import {
  calcDropTarget,
  findClosestBlockElement,
  getClosestBlockElementByPoint,
  getHoveringNote,
  isPageMode,
  matchFlavours,
  Point,
  Rect,
} from '../../__internal__/index.js';
import type { BlockComponentElement } from '../../index.js';
import type { ParagraphBlockModel } from '../../paragraph-block/index.js';
import {
  DEFAULT_DRAG_HANDLE_CONTAINER_HEIGHT,
  DRAG_HANDLE_OFFSET_LEFT,
  type DropResult,
  LIST_DRAG_HANDLE_OFFSET_LEFT,
} from './config.js';

const heightMap: { [key: string]: number } = {
  text: 23,
  h1: 40,
  h2: 36,
  h3: 32,
  h4: 32,
  h5: 28,
  h6: 26,
  quote: 46,
  list: 32,
  database: 28,
  image: 28,
  divider: 36,
};

export const getDragHandleContainerHeight = (model: BaseBlockModel) => {
  const flavour = model.flavour;
  const index = flavour.indexOf(':');
  let key = flavour.slice(index + 1);
  if (key === 'paragraph' && (model as ParagraphBlockModel).type) {
    key = (model as ParagraphBlockModel).type;
  }

  const height = heightMap[key] ?? DEFAULT_DRAG_HANDLE_CONTAINER_HEIGHT;

  return height;
};

// To check if the block is a child block of the selected blocks
export const containChildBlock = (
  selections: BaseSelection[],
  childPath: string[]
) => {
  return selections.some(selection => {
    const { path } = selection;
    return PathFinder.includes(childPath, path);
  });
};

export const containBlock = (blockIDs: string[], targetID: string) => {
  return blockIDs.some(blockID => blockID === targetID);
};

// TODO: this is a hack, need to find a better way
export const insideDatabaseTable = (element: Element) => {
  return !!element.closest('.affine-database-block-table');
};

export const captureEventTarget = (target: EventTarget | null) => {
  const isElementOrNode = target instanceof Element || target instanceof Node;
  return isElementOrNode
    ? target instanceof Element
      ? target
      : target.parentElement
    : null;
};

export const getNoteId = (blockElement: BlockElement) => {
  let element = blockElement;
  while (element && element.flavour !== 'affine:note') {
    element = element.parentBlockElement;
  }

  return element.model.id;
};

export const includeTextSelection = (selections: BaseSelection[]) => {
  return selections.some(selection => selection.type === 'text');
};

/**
 * Check if the path of two blocks are equal
 */
export const isBlockPathEqual = (
  path1: string[] | null | undefined,
  path2: string[] | null | undefined
) => {
  if (!path1 || !path2) {
    return false;
  }
  return PathFinder.equals(path1, path2);
};

export const getContainerOffsetPoint = (state: PointerEventState) => {
  const x = state.point.x + state.containerOffset.x;
  const y = state.point.y + state.containerOffset.y;
  return new Point(x, y);
};

export const getClosestNoteBlock = (
  page: Page,
  pageBlock: BlockComponentElement,
  point: Point
) => {
  return isPageMode(page)
    ? findClosestBlockElement(pageBlock, point, 'affine-note')
    : getHoveringNote(point)?.querySelector('affine-note');
};

export const getClosestBlockByPoint = (
  page: Page,
  pageBlock: BlockComponentElement,
  point: Point
) => {
  const closestNoteBlock = getClosestNoteBlock(page, pageBlock, point);
  if (!closestNoteBlock) return null;
  const noteRect = Rect.fromDOM(closestNoteBlock);
  const blockElement = getClosestBlockElementByPoint(point, {
    container: closestNoteBlock,
    rect: noteRect,
  });
  const blockSelector =
    '.affine-note-block-container > .affine-block-children-container > [data-block-id]';
  const closestBlockElement = (
    blockElement
      ? blockElement
      : findClosestBlockElement(
          closestNoteBlock as BlockElement,
          point.clone(),
          blockSelector
        )
  ) as BlockElement;
  return closestBlockElement;
};

export const getDropResult = (
  event: MouseEvent,
  scale: number = 1
): DropResult | null => {
  let dropIndicator = null;
  let dropBlockId = '';
  let dropBefore = false;

  const target = captureEventTarget(event.target);
  const rootElement = target?.closest('block-suite-root');
  const offset = {
    x: rootElement?.getBoundingClientRect().left ?? 0,
    y: rootElement?.getBoundingClientRect().top ?? 0,
  };

  const point = new Point(event.x + offset.x, event.y + offset.y);
  const closestBlockElement = getClosestBlockElementByPoint(
    point
  ) as BlockElement;
  if (!closestBlockElement) {
    return dropIndicator;
  }

  const blockId = closestBlockElement.model.id;
  assertExists(blockId);

  dropBlockId = blockId;

  let rect = null;
  let targetElement = null;
  const model = closestBlockElement.model;

  const isDatabase = matchFlavours(model, ['affine:database'] as const);
  if (isDatabase) {
    return dropIndicator;
  }

  const result = calcDropTarget(point, model, closestBlockElement, [], scale);

  if (result) {
    rect = result.rect;
    targetElement = result.modelState.element;
    dropBefore = result.type === 'before' ? true : false;
  }

  if (targetElement) {
    const targetBlockId = targetElement.getAttribute('data-block-id');
    if (targetBlockId) dropBlockId = targetBlockId;
  }

  dropIndicator = {
    rect,
    dropBlockId,
    dropBefore,
  };

  return dropIndicator;
};

export function getDragHandleLeftPadding(blockElements: BlockElement[]) {
  const hasToggleList = blockElements.some(
    blockElement =>
      matchFlavours(blockElement.model, ['affine:list']) &&
      blockElement.model.children.length > 0
  );
  const offsetLeft = hasToggleList
    ? LIST_DRAG_HANDLE_OFFSET_LEFT
    : DRAG_HANDLE_OFFSET_LEFT;
  return offsetLeft;
}

let previousEle: BlockElement[] = [];
export function updateDragHandleClassName(blockElements: BlockElement[] = []) {
  const className = 'with-drag-handle';
  previousEle.forEach(blockElement => blockElement.classList.remove(className));
  previousEle = blockElements;
  blockElements.forEach(blockElement => blockElement.classList.add(className));
}
