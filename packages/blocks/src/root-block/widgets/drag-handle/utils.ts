import type { BlockElement, EditorHost } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import {
  type BaseSelection,
  PathFinder,
  type PointerEventState,
} from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import type { ParagraphBlockModel } from '../../../paragraph-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '../../../_common/consts.js';
import { getBlockProps } from '../../../_common/utils/block-props.js';
import {
  type BlockComponent,
  type EmbedCardStyle,
  Point,
  Rect,
  findClosestBlockElement,
  getClosestBlockElementByElement,
  getClosestBlockElementByPoint,
  getDropRectByPoint,
  getHoveringNote,
  getRectByBlockElement,
  isInsidePageEditor,
  matchFlavours,
} from '../../../_common/utils/index.js';
import { Bound } from '../../../surface-block/index.js';
import { isEmbedSyncedDocBlock } from '../../edgeless/utils/query.js';
import {
  DRAG_HANDLE_CONTAINER_HEIGHT,
  DRAG_HANDLE_CONTAINER_OFFSET_LEFT,
  DRAG_HANDLE_CONTAINER_OFFSET_LEFT_LIST,
  type DropResult,
  type DropType,
  EDGELESS_NOTE_EXTRA_PADDING,
  NOTE_CONTAINER_PADDING,
  type OnDragEndProps,
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
  path1: string | null | undefined,
  path2: string | null | undefined
) => {
  if (!path1 || !path2) {
    return false;
  }
  return path1 === path2;
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
  const insidePageEditor = isInsidePageEditor(editorHost);
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
  rootElement: BlockComponent,
  point: Point
) => {
  return isInsidePageEditor(editorHost)
    ? findClosestBlockElement(rootElement, point, 'affine-note')
    : getHoveringNote(point)?.closest('affine-edgeless-note');
};

export const getClosestBlockByPoint = (
  editorHost: EditorHost,
  rootElement: BlockComponent,
  point: Point
) => {
  const closestNoteBlock = getClosestNoteBlock(editorHost, rootElement, point);
  if (!closestNoteBlock || closestNoteBlock.closest('.affine-surface-ref')) {
    return null;
  }

  const noteRect = Rect.fromDOM(closestNoteBlock);

  const blockElement = getClosestBlockElementByPoint(point, {
    container: closestNoteBlock,
    rect: noteRect,
  }) as BlockElement | null;

  const blockSelector =
    '.affine-note-block-container > .affine-block-children-container > [data-block-id]';

  const closestBlockElement = (
    blockElement &&
    PathFinder.includes(
      blockElement.path,
      (closestNoteBlock as BlockElement).path
    )
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
  ) {
    return null;
  }

  return closestBlockElement;
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
      next = getClosestBlockElementByElement(
        element.parentElement
      )?.nextElementSibling;
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
  const point = new Point(event.x, event.y);
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

export function getDuplicateBlocks(blocks: BlockModel[]) {
  const duplicateBlocks = blocks.map(block => ({
    flavour: block.flavour,
    blockProps: getBlockProps(block),
  }));
  return duplicateBlocks;
}

export function convertDragPreviewDocToEdgeless({
  blockComponent,
  dragPreview,
  cssSelector,
  width,
  height,
  noteScale,
  state,
}: OnDragEndProps & {
  blockComponent: BlockElement;
  cssSelector: string;
  width?: number;
  height?: number;
  style?: EmbedCardStyle;
}): boolean {
  const edgelessRoot = blockComponent.closest(
    'affine-edgeless-root'
  ) as EdgelessRootBlockComponent;
  if (!edgelessRoot) {
    return false;
  }

  const previewEl = dragPreview.querySelector(cssSelector);
  if (!previewEl) {
    return false;
  }
  const rect = previewEl.getBoundingClientRect();
  const border = 2;
  const { left: viewportLeft, top: viewportTop } = edgelessRoot.viewport;
  const currentViewBound = new Bound(
    rect.x - viewportLeft,
    rect.y - viewportTop,
    rect.width + border / noteScale,
    rect.height + border / noteScale
  );
  const currentModelBound =
    edgelessRoot.service.viewport.toModelBound(currentViewBound);

  // Except for embed synced doc block
  // The width and height of other card style should be fixed
  const newBound = isEmbedSyncedDocBlock(blockComponent.model)
    ? new Bound(
        currentModelBound.x,
        currentModelBound.y,
        (currentModelBound.w ?? width) * noteScale,
        (currentModelBound.h ?? height) * noteScale
      )
    : new Bound(
        currentModelBound.x,
        currentModelBound.y,
        (width ?? currentModelBound.w) * noteScale,
        (height ?? currentModelBound.h) * noteScale
      );

  const blockModel = blockComponent.model;
  const blockProps = getBlockProps(blockModel);

  const blockId = edgelessRoot.service.addBlock(
    blockComponent.flavour,
    {
      ...blockProps,
      xywh: newBound.serialize(),
    },
    edgelessRoot.surfaceBlockModel
  );

  // Embed synced doc block should extend the note scale
  const newBlock = edgelessRoot.service.getElementById(blockId);
  if (isEmbedSyncedDocBlock(newBlock)) {
    edgelessRoot.service.updateElement(newBlock.id, {
      scale: noteScale,
    });
  }

  const doc = blockComponent.doc;
  const host = blockComponent.host;
  const altKey = state.raw.altKey;
  if (!altKey) {
    doc.deleteBlock(blockModel);
    host.selection.setGroup('note', []);
  }

  edgelessRoot.service.selection.set({
    elements: [blockId],
    editing: false,
  });

  return true;
}

export function convertDragPreviewEdgelessToDoc({
  blockComponent,
  dropBlockId,
  dropType,
  state,
  style,
}: OnDragEndProps & {
  blockComponent: BlockElement;
  style?: EmbedCardStyle;
}): boolean {
  const doc = blockComponent.doc;
  const host = blockComponent.host;
  const targetBlock = doc.getBlockById(dropBlockId);
  if (!targetBlock) return false;

  const shouldInsertIn = dropType === 'in';
  const parentBlock = shouldInsertIn ? targetBlock : doc.getParent(targetBlock);
  assertExists(parentBlock);
  const parentIndex = shouldInsertIn
    ? 0
    : parentBlock.children.indexOf(targetBlock) +
      (dropType === 'after' ? 1 : 0);

  const blockModel = blockComponent.model;

  const { width, height, xywh, rotate, zIndex, ...blockProps } =
    getBlockProps(blockModel);
  if (style) {
    blockProps.style = style;
  }

  doc.addBlock(
    blockModel.flavour as never,
    blockProps,
    parentBlock,
    parentIndex
  );

  const altKey = state.raw.altKey;
  if (!altKey) {
    doc.deleteBlock(blockModel);
    host.selection.setGroup('edgeless', []);
  }

  return true;
}
