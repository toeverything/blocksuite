import {
  BLOCK_CHILDREN_CONTAINER_PADDING_LEFT,
  BLOCK_SERVICE_LOADING_ATTR,
  DRAG_HANDLE_OFFSET_LEFT,
} from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';

import { copyBlocks } from '../../__internal__/clipboard/index.js';
import {
  type BlockComponentElement,
  type EditingState,
  type Point,
  type SerializedBlock,
} from '../../__internal__/index.js';
import {
  getBlockElementById,
  getBlockElementByModel,
  getBlockElementsExcludeSubtrees,
  getClosestBlockElementByPoint,
  getModelByBlockElement,
  isInSamePath,
} from '../../__internal__/index.js';
import { getService } from '../../__internal__/service.js';
import type { CodeBlockModel } from '../../code-block/index.js';
import { DragHandle } from '../../components/index.js';
import { toast } from '../../components/toast.js';
import type { EmbedBlockModel } from '../../embed-block/embed-model.js';
import type { DefaultPageBlockComponent } from './default-page-block.js';
import {
  getClosestDatabaseId,
  getClosestRowId,
} from './selection-manager/database-selection-manager/utils.js';

function hasOptionBar(block: BaseBlockModel) {
  if (block.flavour === 'affine:code') return true;
  if (block.flavour === 'affine:embed' && block.type === 'image') return true;
  return false;
}

function getBlockWithOptionBarRect(
  hoverDom: Element,
  block: BaseBlockModel
): Element {
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
  const end = blocks.length - 1;
  if (end === -1) return null;

  const start = 0;
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
  let end = blocks.length - 1;
  if (end === -1) return null;

  const size = options?.size || 5;
  const start = Math.max(cursor - size, 0);
  end = Math.min(cursor + size, end);
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
  const noSkipX = !options?.skipX;
  const dragging = !!options?.dragging;
  let containerLeft = 0;

  if (noSkipX) {
    const firstBlock = getBlockAndRect(blocks, 0);
    containerLeft = firstBlock.blockRect.left;
  }

  let inside = false;
  while (start <= end) {
    const mid = start + Math.floor((end - start) / 2);
    const { block, blockRect, detectRect, hoverDom } = getBlockAndRect(
      blocks,
      mid
    );

    // if the detectRect is not in the view port, it's definitely not the block we want
    if (detectRect.top > window.innerHeight) {
      end = mid - 1;
      continue;
    } else if (detectRect.bottom < 0) {
      start = mid + 1;
      continue;
    }

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

    !inside && (inside = y >= detectRect.top && y <= detectRect.bottom);

    if (inside) {
      assertExists(blockRect);

      if (noSkipX) {
        if (dragging) {
          x = Math.max(x + DRAG_HANDLE_OFFSET_LEFT, containerLeft);
          let n = mid - 1;
          if (n > 0) {
            let depth = Math.floor(
              (blockRect.left - containerLeft) /
                BLOCK_CHILDREN_CONTAINER_PADDING_LEFT
            );
            while (n >= 0 && depth >= 0) {
              const result = getBlockAndRect(blocks, n);
              if (
                result.hoverDom.compareDocumentPosition(hoverDom) &
                Node.DOCUMENT_POSITION_CONTAINED_BY
              ) {
                if (x >= result.blockRect.left && x < blockRect.left) {
                  return {
                    rect: result.blockRect,
                    model: result.block,
                    element: result.hoverDom as BlockComponentElement,
                  };
                } else {
                  depth--;
                  n--;
                }
              } else {
                n--;
              }
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
        rect: blockRect,
        model: block,
        element: hoverDom as BlockComponentElement,
      };
    }

    if (detectRect.top > y) {
      end = mid - 1;
    } else if (detectRect.bottom < y) {
      start = mid + 1;
    }

    // if search failed, it may be caused by the mouse fall between two blocks
    if (start > end) {
      let targetIndex = -1;
      // now start = end + 1, eg: [0, 1, ..., end start ..., blocks.length - 1]
      if (start === blocks.length) {
        targetIndex = end;
      } else if (end === -1) {
        targetIndex = start;
      } else {
        const { detectRect: prevDetectRect } = getBlockAndRect(blocks, end);
        const { detectRect: nextDetectRect } = getBlockAndRect(blocks, start);
        if (
          y <
          prevDetectRect.bottom +
            (nextDetectRect.top - prevDetectRect.bottom) / 2
        ) {
          // nearer to prevDetectRect
          targetIndex = end;
        } else {
          // nearer to nextDetectRect
          targetIndex = start;
        }
      }
      inside = true;
      start = end = targetIndex;
    }
  }

  return null;
}

function isPointIn(x: number, detectRect: DOMRect) {
  return x >= detectRect.left && x <= detectRect.left + detectRect.width;
}

const offscreen = document.createElement(
  'div'
) as unknown as BlockComponentElement;

function getBlockAndRect(blocks: BaseBlockModel[], mid: number) {
  const block = blocks[mid];
  let hoverDom = getBlockElementById(block.id);

  // Give an empty position (xywh=0,0,0,0) for invisible blocks.
  // Block may be hidden, e.g., inside a toggle list, see https://github.com/toeverything/blocksuite/pull/1139)
  if (!hoverDom) {
    hoverDom = offscreen;
  }

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
  const img = await getUrlByModel(model);
  if (!img) {
    return;
  }
  const arrayBuffer = await img.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  let fileType: string;
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    fileType = 'image/gif';
  } else if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    fileType = 'image/png';
  } else if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff &&
    buffer[3] === 0xe0
  ) {
    fileType = 'image/jpeg';
  } else {
    // unknown, fallback to png
    console.error('unknown image type');
    fileType = 'image/png';
  }
  const downloadUrl = URL.createObjectURL(
    new Blob([arrayBuffer], { type: fileType })
  );
  const a = document.createElement('a');
  const event = new MouseEvent('click');
  a.download = 'image';
  a.href = downloadUrl;
  a.dispatchEvent(event);

  // cleanup
  a.remove();
  URL.revokeObjectURL(downloadUrl);
}

export async function copyImage(model: EmbedBlockModel) {
  copyBlocks({
    type: 'Block',
    models: [model],
    startOffset: 0,
    endOffset: 0,
  });

  toast('Copied image to clipboard');
}

function getTextDelta(model: BaseBlockModel) {
  if (!model.text) {
    return [];
  }
  return model.text.toDelta();
}

// TODO merge with copy-cut-manager
export async function copyBlock(model: BaseBlockModel) {
  const copyType = 'blocksuite/x-c+w';
  const delta = getTextDelta(model);
  const copyData: { data: SerializedBlock[] } = {
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
    { mimeType: 'text/plain', data: model.text?.toString() || '' },
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

export function copyCode(codeBlockModel: CodeBlockModel) {
  copyBlocks({
    type: 'Block',
    models: [codeBlockModel],
    startOffset: 0,
    endOffset: 0,
  });

  toast('Copied to clipboard');
}
export function getAllowSelectedBlocks(
  model: BaseBlockModel
): BaseBlockModel[] {
  const result: BaseBlockModel[] = [];
  const blocks = model.children.slice();

  const dfs = (blocks: BaseBlockModel[]) => {
    for (const block of blocks) {
      if (block.flavour !== 'affine:frame') {
        result.push(block);
      }
      block.children.length && dfs(block.children);
    }
  };

  dfs(blocks);
  return result;
}

export function createDragHandle(pageBlock: DefaultPageBlockComponent) {
  return new DragHandle({
    // drag handle should be the same level with editor-container
    container: pageBlock.mouseRoot as HTMLElement,
    onDropCallback(_point, blockElements, editingState, type): void {
      if (!editingState || type === 'none') return;
      const { model } = editingState;
      const page = pageBlock.page;
      const models = getBlockElementsExcludeSubtrees(blockElements).map(
        getModelByBlockElement
      );
      if (models.length === 1 && isInSamePath(page, model, models[0])) return;

      page.captureSync();

      const parent = page.getParent(model);
      if (type === 'database') {
        page.moveBlocks(models, model);
      } else {
        assertExists(parent);
        page.moveBlocks(models, parent, model, type === 'before');
      }

      // unneeded
      // pageBlock.selection.clear();
      // pageBlock.selection.state.type = 'block';

      pageBlock.updateComplete.then(() => {
        const service = getService('affine:database');
        service.refreshTableViewSelection();
        if (parent && matchFlavours(parent, ['affine:database'])) {
          pageBlock.selection.clear();
          return;
        }

        // update selection rects
        // block may change its flavour after moved.
        requestAnimationFrame(() => {
          pageBlock.selection.setSelectedBlocks(
            blockElements
              .map(b => getBlockElementById(b.model.id))
              .filter((b): b is BlockComponentElement => !!b)
          );
        });
      });
    },
    setDragType(dragging: boolean) {
      pageBlock.selection.state.type = dragging ? 'block:drag' : 'block';
    },
    setSelectedBlock(modelState: EditingState | null, element) {
      if (element) {
        const rowId = getClosestRowId(element);
        if (rowId !== '') {
          const databaseId = getClosestDatabaseId(element);

          const databaseService = getService('affine:database');
          databaseService.setTableViewSelection({
            type: 'click',
            databaseId,
            rowIds: [rowId],
          });

          pageBlock.selection.clear();
          return;
        }
      }

      const model = modelState?.model;
      if (model) {
        const page = model.page;
        const parent = page.getParent(model);
        if (parent && matchFlavours(parent, ['affine:database'])) {
          return;
        }
      }
      pageBlock.selection.selectOneBlock(modelState?.element, modelState?.rect);
    },
    getSelectedBlocks() {
      return pageBlock.selection.state.selectedBlocks;
    },
    getClosestBlockElement(point: Point) {
      return getClosestBlockElementByPoint(point, {
        rect: pageBlock.innerRect,
      });
    },
  });
}
