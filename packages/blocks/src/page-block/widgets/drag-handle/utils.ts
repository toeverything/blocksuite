import {
  type BaseSelection,
  PathFinder,
  type PointerEventState,
} from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement, EditorHost } from '@blocksuite/lit';
import type { BlockModel } from '@blocksuite/store';

import {
  type BlockComponent,
  findClosestBlockElement,
  getClosestBlockElementByElement,
  getClosestBlockElementByPoint,
  getDropRectByPoint,
  getHoveringNote,
  getRectByBlockElement,
  isInsideDocEditor,
  matchFlavours,
  Point,
  Rect,
} from '../../../_common/utils/index.js';
import type { ParagraphBlockModel } from '../../../paragraph-block/index.js';
import type { EdgelessBlockType } from '../../../surface-block/index.js';
import { Bound } from '../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless/edgeless-page-block.js';
import {
  BLOCK_CHILDREN_CONTAINER_PADDING_LEFT,
  DRAG_HANDLE_CONTAINER_HEIGHT,
  DRAG_HANDLE_CONTAINER_OFFSET_LEFT,
  DRAG_HANDLE_CONTAINER_OFFSET_LEFT_LIST,
  type DropResult,
  type DropType,
  NOTE_CONTAINER_PADDING,
  type OnDragEndProps,
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
  blockElements: BlockElement[],
  childPath: string[]
) => {
  return blockElements.some(blockElement => {
    const path = blockElement.path;
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

export const isOutOfNoteBlock = (
  editorHost: EditorHost,
  noteBlock: Element,
  point: Point,
  scale: number
) => {
  // TODO: need to find a better way to check if the point is out of note block
  const rect = noteBlock.getBoundingClientRect();
  const padding = NOTE_CONTAINER_PADDING * scale;
  return rect
    ? isInsideDocEditor(editorHost)
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
  pageBlock: BlockComponent,
  point: Point
) => {
  return isInsideDocEditor(editorHost)
    ? findClosestBlockElement(pageBlock, point, 'affine-note')
    : getHoveringNote(point)?.querySelector('affine-note');
};

export const getClosestBlockByPoint = (
  editorHost: EditorHost,
  pageBlock: BlockComponent,
  point: Point
) => {
  const closestNoteBlock = getClosestNoteBlock(editorHost, pageBlock, point);
  if (!closestNoteBlock || closestNoteBlock.closest('.affine-surface-ref'))
    return null;
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
  if (
    !closestBlockElement ||
    !!closestBlockElement.closest('.surface-ref-note-portal')
  )
    return null;
  return closestBlockElement;
};

export function calcDropTarget(
  point: Point,
  model: BlockModel,
  element: Element,
  draggingElements: BlockComponent[],
  scale: number
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
    // Only consider drop as children when target block is list block.
    // To drop in, the position must after the target first
    // If drop in target has children, we can use insert before or after of that children
    // to achieve the same effect.
    const hasChild = (element as BlockComponent).childBlockElements.length;
    if (
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

  const target = captureEventTarget(event.target);
  const rootElement = target?.closest('editor-host');
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

  const model = closestBlockElement.model;

  const isDatabase = matchFlavours(model, ['affine:database']);
  if (isDatabase) {
    return dropIndicator;
  }

  const result = calcDropTarget(point, model, closestBlockElement, [], scale);
  if (result) {
    dropIndicator = result;
  }

  return dropIndicator;
};

export function getDragHandleLeftPadding(blockElements: BlockElement[]) {
  const hasToggleList = blockElements.some(
    blockElement =>
      matchFlavours(blockElement.model, ['affine:list']) &&
      blockElement.model.children.length > 0
  );
  const offsetLeft = hasToggleList
    ? DRAG_HANDLE_CONTAINER_OFFSET_LEFT_LIST
    : DRAG_HANDLE_CONTAINER_OFFSET_LEFT;
  return offsetLeft;
}

let previousEle: BlockElement[] = [];
export function updateDragHandleClassName(blockElements: BlockElement[] = []) {
  const className = 'with-drag-handle';
  previousEle.forEach(blockElement => blockElement.classList.remove(className));
  previousEle = blockElements;
  blockElements.forEach(blockElement => blockElement.classList.add(className));
}

function getBlockProps(model: BlockModel) {
  const keys = model.keys as (keyof typeof model)[];
  const values = keys.map(key => model[key]);
  const blockProps = Object.fromEntries(keys.map((key, i) => [key, values[i]]));
  return blockProps;
}

export function convertDragPreviewDocToEdgeless({
  blockComponent,
  dragPreview,
  cssSelector,
  width,
  height,
}: OnDragEndProps & {
  blockComponent: BlockElement;
  cssSelector: string;
  width?: number;
  height?: number;
}): boolean {
  const edgelessPage = blockComponent.closest(
    'affine-edgeless-page'
  ) as EdgelessPageBlockComponent;
  if (!edgelessPage) return false;

  const previewEl = dragPreview.querySelector(cssSelector);
  assertExists(previewEl);
  const rect = previewEl.getBoundingClientRect();
  const point = edgelessPage.service.toModelCoord(rect.x, rect.y);
  const bound = new Bound(
    point[0],
    point[1],
    width ?? previewEl.clientWidth,
    height ?? previewEl.clientHeight
  );

  const blockModel = blockComponent.model;
  const blockProps = getBlockProps(blockModel);

  edgelessPage.service.addBlock(
    blockComponent.flavour as EdgelessBlockType,
    {
      ...blockProps,
      xywh: bound.serialize(),
    },
    edgelessPage.surfaceBlockModel
  );
  blockComponent.page.deleteBlock(blockModel);
  return true;
}

export function convertDragPreviewEdgelessToDoc({
  blockComponent,
  dropBlockId,
  dropType,
}: OnDragEndProps & {
  blockComponent: BlockElement;
}): boolean {
  const page = blockComponent.page;
  const targetBlock = page.getBlockById(dropBlockId);
  if (!targetBlock) return false;

  const shouldInsertIn = dropType === 'in';
  const parentBlock = shouldInsertIn
    ? targetBlock
    : page.getParent(targetBlock);
  assertExists(parentBlock);
  const parentIndex = shouldInsertIn
    ? 0
    : parentBlock.children.indexOf(targetBlock);

  const blockModel = blockComponent.model;
  const { width, height, xywh, rotate, zIndex, ...blockProps } =
    getBlockProps(blockModel);
  page.addBlock(blockModel.flavour, blockProps, parentBlock, parentIndex);
  page.deleteBlock(blockModel);
  return true;
}
