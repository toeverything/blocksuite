import {
  BLOCK_CHILDREN_CONTAINER_PADDING_LEFT,
  BLOCK_ID_ATTR,
  BLOCK_SERVICE_LOADING_ATTR,
} from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';

import { getService } from '../../__internal__/service.js';
import {
  doesInSamePath,
  getBlockById,
  getBlockElementByModel,
  getRichTextByModel,
  OpenBlockInfo,
  resetNativeSelection,
} from '../../__internal__/utils/index.js';
import { DragHandle } from '../../components/index.js';
import { toast } from '../../components/toast.js';
import type { EmbedBlockModel } from '../../embed-block/embed-model.js';
import type {
  CodeBlockOption,
  DefaultPageBlockComponent,
} from './default-page-block.js';

export interface EditingState {
  model: BaseBlockModel;
  position: DOMRect;
  index: number;
}

function hasOptionBar(block: BaseBlockModel) {
  if (block.flavour === 'affine:code') return true;
  if (block.flavour === 'affine:embed' && block.type === 'image') return true;
  return false;
}

function getBlockWithOptionBarRect(
  hoverDom: HTMLElement,
  block: BaseBlockModel
): HTMLElement {
  if (hoverDom.hasAttribute(BLOCK_SERVICE_LOADING_ATTR)) {
    return hoverDom;
  }
  if (block.flavour === 'affine:code') {
    const codeBlockDom = hoverDom.querySelector(
      '.affine-code-block-container'
    ) as HTMLElement;
    assertExists(codeBlockDom);
    return codeBlockDom;
  } else if (block.flavour === 'affine:embed' && block.type === 'image') {
    const imgElement = hoverDom.querySelector(
      '.resizable-img'
    ) as HTMLDivElement;
    assertExists(imgElement);
    return imgElement;
  }
  throw new Error('unreachable');
}

function getDetectRect(block: BaseBlockModel, blockRect: DOMRect): DOMRect {
  const detectRect = copyRect(blockRect);
  // there is a optionBar on the right side
  if (block.flavour === 'affine:code') {
    detectRect.width += 52;
  } else if (block.flavour === 'affine:embed' && block.type === 'image') {
    detectRect.width += 50;
  }
  return detectRect;
}

// Workaround native DOMRect clone issue in #632
// See https://stackoverflow.com/questions/42713229/getboundingclientrect-object-properties-cannot-be-copied
function copyRect(rect: DOMRect): DOMRect {
  const { top, right, bottom, left, width, height, x, y } = rect;
  return { top, right, bottom, left, width, height, x, y } as DOMRect;
}

export function getBlockEditingStateByPosition(
  blocks: BaseBlockModel[],
  x: number,
  y: number,
  options?: {
    skipX?: boolean;
  }
) {
  const start = 0;
  const end = blocks.length - 1;
  return binarySearchBlockEditingState(blocks, x, y, start, end, options);
}

export function getBlockEditingStateByCursor(
  blocks: BaseBlockModel[],
  x: number,
  y: number,
  cursor: number,
  options?: {
    size?: number;
    skipX?: boolean;
    dragging?: boolean;
  }
): EditingState | null {
  const size = options?.size || 5;
  const start = Math.max(cursor - size, 0);
  const end = Math.min(cursor + size, blocks.length - 1);
  return binarySearchBlockEditingState(blocks, x, y, start, end, options);
}

// seek range: [start, end]
function binarySearchBlockEditingState(
  blocks: BaseBlockModel[],
  x: number,
  y: number,
  start: number,
  end: number,
  options?: {
    skipX?: boolean;
    dragging?: boolean;
  }
): EditingState | null {
  const dragging = Boolean(options?.dragging);
  while (start <= end) {
    const mid = start + Math.floor((end - start) / 2);
    const { block, blockRect, detectRect, hoverDom } = getBlockAndRect(
      blocks,
      mid
    );

    // code block use async loading
    if (block.flavour === 'affine:code' && !hoverDom) {
      // @TODO: need more tests
      if (mid === start || mid === end) {
        return null;
      }
      // may have consecutive code blocks
      let result = binarySearchBlockEditingState(
        blocks,
        x,
        y,
        mid + 1,
        end,
        options
      );
      if (result) {
        return result;
      }
      result = binarySearchBlockEditingState(
        blocks,
        x,
        y,
        start,
        mid - 1,
        options
      );
      return result;
    } else if (matchFlavours(block, ['affine:database'])) {
      // double check when current block is database block
      const result = binarySearchBlockEditingState(
        blocks,
        x,
        y,
        mid + 1,
        end,
        options
      );
      if (result) {
        return result;
      }
    }

    const in_block = y >= detectRect.top && y <= detectRect.bottom;

    if (in_block) {
      assertExists(blockRect);

      if (!options?.skipX) {
        if (dragging) {
          if (block.depth && block.parentIndex !== undefined) {
            let depth = Math.floor(
              (blockRect.left - x) / BLOCK_CHILDREN_CONTAINER_PADDING_LEFT
            );
            if (depth > 0) {
              let result = getBlockAndRect(blocks, block.parentIndex);

              while (
                depth > 1 &&
                result.block.depth &&
                result.block.parentIndex !== undefined
              ) {
                result = getBlockAndRect(blocks, result.block.parentIndex);
                depth -= 1;
              }

              return {
                index: mid,
                position: result.blockRect,
                model: result.block,
              };
            }
          }
        } else {
          // y-coord is checked before
          if (!isPointIn(x, detectRect)) {
            return null;
          }
        }
      }

      return {
        index: mid,
        position: blockRect,
        model: block,
      };
    }

    if (detectRect.top > y) {
      end = mid - 1;
    } else if (detectRect.bottom < y) {
      start = mid + 1;
    }
  }

  return null;
}

function isPointIn(x: number, detectRect: DOMRect) {
  return x >= detectRect.left && x <= detectRect.left + detectRect.width;
}

function getBlockAndRect(blocks: BaseBlockModel[], mid: number) {
  const block = blocks[mid];
  const hoverDom = getBlockById(block.id);
  assertExists(hoverDom);
  let blockRect: DOMRect | null = null;
  let detectRect: DOMRect | null = null;
  if (hasOptionBar(block)) {
    blockRect = getBlockWithOptionBarRect(
      hoverDom,
      block
    ).getBoundingClientRect();
    detectRect = getDetectRect(block, blockRect);
  } else {
    blockRect = hoverDom.getBoundingClientRect() as DOMRect;
    if (block.flavour === 'affine:database') {
      // in a database block, `.affine-database-block-title` which is its own editing area
      detectRect = hoverDom
        ?.querySelector('.affine-database-block-title')
        ?.getBoundingClientRect() as DOMRect;
    } else if (block.children.length) {
      // in a nested block, `rich-text` which is its own editing area
      detectRect = hoverDom
        ?.querySelector('rich-text')
        ?.getBoundingClientRect() as DOMRect;
    } else {
      detectRect = blockRect;
    }
  }

  return {
    block,
    hoverDom,
    blockRect,
    detectRect,
  };
}

export async function downloadImage(model: BaseBlockModel) {
  const imgSrc = await getUrlByModel(model);
  const image = new Image();
  imgSrc && (image.src = imgSrc);
  image.setAttribute('crossOrigin', 'anonymous');
  image.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context && context.drawImage(image, 0, 0, image.width, image.height);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    const event = new MouseEvent('click');
    a.download = 'image';
    a.href = url;
    a.dispatchEvent(event);
  };
}

export async function copyImage(model: EmbedBlockModel) {
  const copyType = 'blocksuite/x-c+w';
  const service = getService(model.flavour);
  const text = service.block2Text(model, '', 0, 0);
  const delta = [
    {
      insert: text,
    },
  ];
  const copyData = JSON.stringify({
    data: [
      {
        type: model.type,
        sourceId: model.sourceId,
        width: model.width,
        height: model.height,
        caption: model.caption,
        flavour: model.flavour,
        text: delta,
        children: model.children,
      },
    ],
  });
  const copySuccess = performNativeCopy([
    { mimeType: copyType, data: copyData },
  ]);
  copySuccess && toast('Copied image to clipboard');
}

function getTextDelta(model: BaseBlockModel) {
  if (!model.text) {
    return [];
  }
  return model.text.toDelta();
}

export async function copyBlock(model: BaseBlockModel) {
  const copyType = 'blocksuite/x-c+w';
  const delta = getTextDelta(model);
  const copyData: { data: OpenBlockInfo[] } = {
    data: [
      {
        type: model.type,
        flavour: model.flavour,
        sourceId: model.sourceId,
        text: delta,
        children: [],
      },
    ],
  };
  const copySuccess = performNativeCopy([
    { mimeType: copyType, data: JSON.stringify(copyData) },
  ]);
  return copySuccess;
}

interface ClipboardItem {
  mimeType: string;
  data: string;
}

function performNativeCopy(items: ClipboardItem[]): boolean {
  let success = false;
  const tempElem = document.createElement('textarea');
  tempElem.value = 'temp';
  document.body.appendChild(tempElem);
  tempElem.select();
  tempElem.setSelectionRange(0, tempElem.value.length);

  const listener = (e: ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (clipboardData) {
      items.forEach(item => clipboardData.setData(item.mimeType, item.data));
    }

    e.preventDefault();
    e.stopPropagation();
    tempElem.removeEventListener('copy', listener);
  };

  tempElem.addEventListener('copy', listener);
  try {
    success = document.execCommand('copy');
  } finally {
    tempElem.removeEventListener('copy', listener);
    document.body.removeChild(tempElem);
  }
  return success;
}

export function focusCaption(model: BaseBlockModel) {
  const blockEle = getBlockElementByModel(model);
  assertExists(blockEle);
  const dom = blockEle.querySelector(
    '.affine-embed-wrapper-caption'
  ) as HTMLInputElement;
  dom.classList.add('caption-show');
  dom.focus();
}

async function getUrlByModel(model: BaseBlockModel) {
  assertExists(model.sourceId);
  const store = await model.page.blobs;
  const url = store?.get(model.sourceId);
  return url;
}

export function isControlledKeyboardEvent(e: KeyboardEvent) {
  return e.ctrlKey || e.metaKey || e.shiftKey;
}

export function copyCode(codeBlockOption: CodeBlockOption) {
  const richText = getRichTextByModel(codeBlockOption.model);
  assertExists(richText);
  const quill = richText.quill;
  quill.setSelection(0, quill.getLength());
  document.dispatchEvent(new ClipboardEvent('copy'));
  resetNativeSelection(null);
  toast('Copied to clipboard');
}

export function deleteCodeBlock(codeBlockOption: CodeBlockOption) {
  const model = codeBlockOption.model;
  model.page.deleteBlock(model);
}

export function toggleWrap(codeBlockOption: CodeBlockOption) {
  const syntaxElem = document.querySelector(
    `[${BLOCK_ID_ATTR}="${codeBlockOption.model.id}"] .ql-syntax`
  );
  assertExists(syntaxElem);
  syntaxElem.classList.toggle('wrap');
}

export function getAllowSelectedBlocks(
  model: BaseBlockModel
): BaseBlockModel[] {
  const result: BaseBlockModel[] = [];
  const blocks = model.children.slice();
  if (!blocks) {
    return [];
  }

  const dfs = (
    blocks: BaseBlockModel[],
    depth: number,
    parentIndex: number
  ) => {
    for (const block of blocks) {
      if (block.flavour !== 'affine:frame') {
        result.push(block);
      }
      block.depth = depth;
      if (parentIndex !== -1) {
        block.parentIndex = parentIndex;
      }
      block.children.length &&
        dfs(block.children, depth + 1, result.length - 1);
    }
  };

  dfs(blocks, 0, -1);
  return result;
}

export function createDragHandle(defaultPageBlock: DefaultPageBlockComponent) {
  return new DragHandle({
    getBlockEditingStateByCursor(
      blocks,
      pageX,
      pageY,
      cursor,
      size,
      skipX,
      dragging
    ) {
      return getBlockEditingStateByCursor(blocks, pageX, pageY, cursor, {
        size,
        skipX,
        dragging,
      });
    },
    getBlockEditingStateByPosition(blocks, pageX, pageY, skipX) {
      return getBlockEditingStateByPosition(blocks, pageX, pageY, {
        skipX,
      });
    },
    onDropCallback(e, start, end): void {
      const page = defaultPageBlock.page;
      const startModel = start.model;
      const rect = end.position;
      const nextModel = end.model;
      if (doesInSamePath(page, nextModel, startModel)) {
        return;
      }
      page.captureSync();
      const distanceToTop = Math.abs(rect.top - e.y);
      const distanceToBottom = Math.abs(rect.bottom - e.y);
      page.moveBlock(startModel, nextModel, distanceToTop < distanceToBottom);
      defaultPageBlock.signals.updateSelectedRects.emit([]);
      defaultPageBlock.signals.updateFrameSelectionRect.emit(null);
      defaultPageBlock.signals.updateEmbedEditingState.emit(null);
      defaultPageBlock.signals.updateEmbedRects.emit([]);
    },
    setSelectedBlocks(selectedBlocks: EditingState | null): void {
      if (selectedBlocks) {
        const { position, index } = selectedBlocks;
        defaultPageBlock.selection.selectBlocksByIndexAndBounding(
          index,
          position
        );
      }
    },
  });
}
