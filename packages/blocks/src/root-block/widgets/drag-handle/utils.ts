import type { ParagraphBlockModel } from '@blocksuite/affine-model';
import type {
  BaseSelection,
  BlockComponent,
  EditorHost,
} from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '@blocksuite/affine-shared/consts';
import {
  DocModeProvider,
  type DropType,
} from '@blocksuite/affine-shared/services';
import {
  findClosestBlockComponent,
  getBlockProps,
  getClosestBlockComponentByElement,
  getClosestBlockComponentByPoint,
  getRectByBlockComponent,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';
import { Point, Rect } from '@blocksuite/global/utils';

import {
  getDropRectByPoint,
  getHoveringNote,
} from '../../../_common/utils/index.js';
import {
  DRAG_HANDLE_CONTAINER_HEIGHT,
  DRAG_HANDLE_CONTAINER_OFFSET_LEFT,
  DRAG_HANDLE_CONTAINER_OFFSET_LEFT_LIST,
  type DropResult,
  EDGELESS_NOTE_EXTRA_PADDING,
  NOTE_CONTAINER_PADDING,
} from './config.js';

const heightMap: Record<string, number> = {
  text: 23,
  h1: 40,
  h2: 36,
  h3: 32,
  h4: 32,
  h5: 28,
  h6: 26,
  quote: 46,
  list: 24,
  database: 28,
  image: 28,
  divider: 36,
};

export const getDragHandleContainerHeight = (model: BlockModel) => {
  const flavour = model.flavour;
  const index = flavour.indexOf(':');
  let key = flavour.slice(index + 1);
  if (key === 'paragraph' && (model as ParagraphBlockModel).type) {
    key = (model as ParagraphBlockModel).type;
  }

  const height = heightMap[key] ?? DRAG_HANDLE_CONTAINER_HEIGHT;

  return height;
};

// To check if the block is a child block of the selected blocks
export const containChildBlock = (
  blocks: BlockComponent[],
  childModel: BlockModel
) => {
  return blocks.some(block => {
    let currentBlock: BlockModel | null = childModel;
    while (currentBlock) {
      if (currentBlock.id === block.model.id) {
        return true;
      }
      currentBlock = block.doc.getParent(currentBlock.id);
    }
    return false;
  });
};

export const containBlock = (blockIDs: string[], targetID: string) => {
  return blockIDs.some(blockID => blockID === targetID);
};

// TODO: this is a hack, need to find a better way
export const insideDatabaseTable = (element: Element) => {
  return !!element.closest('.affine-database-block-table');
};

export const includeTextSelection = (selections: BaseSelection[]) => {
  return selections.some(selection => selection.type === 'text');
};

/**
 * Check if the path of two blocks are equal
 */
export const isBlockIdEqual = (
  id1: string | null | undefined,
  id2: string | null | undefined
) => {
  if (!id1 || !id2) {
    return false;
  }
  return id1 === id2;
};

export const isOutOfNoteBlock = (
  editorHost: EditorHost,
  noteBlock: Element,
  point: Point,
  scale: number
) => {
  // TODO: need to find a better way to check if the point is out of note block
  const rect = noteBlock.getBoundingClientRect();
  const insidePageEditor =
    editorHost.std.get(DocModeProvider).getEditorMode() === 'page';
  const padding =
    (NOTE_CONTAINER_PADDING +
      (insidePageEditor ? 0 : EDGELESS_NOTE_EXTRA_PADDING)) *
    scale;
  return rect
    ? insidePageEditor
      ? point.y < rect.top ||
        point.y > rect.bottom ||
        point.x > rect.right + padding
      : point.y < rect.top ||
        point.y > rect.bottom ||
        point.x < rect.left - padding ||
        point.x > rect.right + padding
    : true;
};

export const getClosestNoteBlock = (
  editorHost: EditorHost,
  rootComponent: BlockComponent,
  point: Point
) => {
  const isInsidePageEditor =
    editorHost.std.get(DocModeProvider).getEditorMode() === 'page';
  return isInsidePageEditor
    ? findClosestBlockComponent(rootComponent, point, 'affine-note')
    : getHoveringNote(point)?.closest('affine-edgeless-note');
};

export const getClosestBlockByPoint = (
  editorHost: EditorHost,
  rootComponent: BlockComponent,
  point: Point
) => {
  const closestNoteBlock = getClosestNoteBlock(
    editorHost,
    rootComponent,
    point
  );
  if (!closestNoteBlock || closestNoteBlock.closest('.affine-surface-ref')) {
    return null;
  }

  const noteRect = Rect.fromDOM(closestNoteBlock);

  const block = getClosestBlockComponentByPoint(point, {
    container: closestNoteBlock,
    rect: noteRect,
  }) as BlockComponent | null;

  const blockSelector =
    '.affine-note-block-container > .affine-block-children-container > [data-block-id]';

  const closestBlock = (
    block && containChildBlock([closestNoteBlock], block.model)
      ? block
      : findClosestBlockComponent(
          closestNoteBlock as BlockComponent,
          point.clone(),
          blockSelector
        )
  ) as BlockComponent;

  if (!closestBlock || !!closestBlock.closest('.surface-ref-note-portal')) {
    return null;
  }

  return closestBlock;
};

export function calcDropTarget(
  point: Point,
  model: BlockModel,
  element: Element,
  draggingElements: BlockComponent[],
  scale: number,
  /**
   * Allow the dragging block to be dropped as sublist
   */
  allowSublist: boolean = true
): DropResult | null {
  let type: DropType | 'none' = 'none';
  const height = 3 * scale;
  const { rect: domRect } = getDropRectByPoint(point, model, element);

  const distanceToTop = Math.abs(domRect.top - point.y);
  const distanceToBottom = Math.abs(domRect.bottom - point.y);
  const before = distanceToTop < distanceToBottom;

  type = before ? 'before' : 'after';
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
        prevRect = getRectByBlockComponent(prev);
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
    // Only consider drop as children when target block is list block.
    // To drop in, the position must after the target first
    // If drop in target has children, we can use insert before or after of that children
    // to achieve the same effect.
    const hasChild = (element as BlockComponent).childBlocks.length;
    if (
      allowSublist &&
      matchFlavours(model, ['affine:list']) &&
      !hasChild &&
      point.x > domRect.x + BLOCK_CHILDREN_CONTAINER_PADDING_LEFT
    ) {
      type = 'in';
    }
    // after
    let next;
    let nextRect;

    next = element.nextElementSibling;
    if (next) {
      if (
        type === 'after' &&
        draggingElements.length &&
        next === draggingElements[0]
      ) {
        type = 'none';
        next = null;
      }
    } else {
      next = getClosestBlockComponentByElement(
        element.parentElement
      )?.nextElementSibling;
    }

    if (next) {
      nextRect = getRectByBlockComponent(next);
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
    rect: Rect.fromLWTH(domRect.left, domRect.width, top - height / 2, height),
    dropBlockId: model.id,
    dropType: type,
  };
}

export const getDropResult = (
  event: MouseEvent,
  scale: number = 1
): DropResult | null => {
  let dropIndicator = null;
  const point = new Point(event.x, event.y);
  const closestBlock = getClosestBlockComponentByPoint(point) as BlockComponent;
  if (!closestBlock) {
    return dropIndicator;
  }

  const model = closestBlock.model;

  const isDatabase = matchFlavours(model, ['affine:database']);
  if (isDatabase) {
    return dropIndicator;
  }

  const result = calcDropTarget(point, model, closestBlock, [], scale);
  if (result) {
    dropIndicator = result;
  }

  return dropIndicator;
};

export function getDragHandleLeftPadding(blocks: BlockComponent[]) {
  const hasToggleList = blocks.some(
    block =>
      matchFlavours(block.model, ['affine:list']) &&
      block.model.children.length > 0
  );
  const offsetLeft = hasToggleList
    ? DRAG_HANDLE_CONTAINER_OFFSET_LEFT_LIST
    : DRAG_HANDLE_CONTAINER_OFFSET_LEFT;
  return offsetLeft;
}

let previousEle: BlockComponent[] = [];
export function updateDragHandleClassName(blocks: BlockComponent[] = []) {
  const className = 'with-drag-handle';
  previousEle.forEach(block => block.classList.remove(className));
  previousEle = blocks;
  blocks.forEach(block => block.classList.add(className));
}

export function getDuplicateBlocks(blocks: BlockModel[]) {
  const duplicateBlocks = blocks.map(block => ({
    flavour: block.flavour,
    blockProps: getBlockProps(block),
  }));
  return duplicateBlocks;
}
