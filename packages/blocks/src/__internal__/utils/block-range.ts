import {
  assertExists,
  type BaseBlockModel,
  type Page,
} from '@blocksuite/store';
import type { VEditor, VRange } from '@blocksuite/virgo';

import { getDefaultPage, getModelsByRange, getVirgoByModel } from './query.js';
import {
  focusTitle,
  getCurrentNativeRange,
  hasNativeSelection,
  resetNativeSelection,
} from './selection.js';

/**
 * The {@link BlockRange} is designed to make consistency between the browser-native range and the block range.
 *
 * It's different from {@link VRange} since the user can select multiple blocks at a time, and {@link VRange} can't handle range cross blocks.
 */

/**
 * Use {@link getCurrentBlockRange} to get current block range.
 *
 * You can use {@link nativeRangeToBlockRange} and {@link blockRangeToNativeRange} convert between native range and block range.
 */
export type BlockRange = {
  /**
   * 'Native' for native selection, 'Block' for block selection
   */
  type: 'Native' | 'Block';
  /**
   * Promise the length of models is greater than 0
   */
  models: BaseBlockModel[];
  startOffset: number;
  endOffset: number;
  // collapsed is true when models.length === 1 && startOffset === endOffset
  // collapsed: true;
};

type ExtendBlockRange = {
  type: 'Title';
  startOffset: number;
  endOffset: number;
  /**
   * Only one model, the page model
   */
  models: [BaseBlockModel];
};

export function getCurrentBlockRange(page: Page) {
  // check exist native selection
  if (hasNativeSelection()) {
    const range = getCurrentNativeRange();
    const blockRange = nativeRangeToBlockRange(range);
    if (!blockRange) {
      return null;
    }
    return { ...blockRange, nativeRange: range };
  }
  return null;
}

export function blockRangeToNativeRange(
  blockRange: BlockRange | ExtendBlockRange
) {
  // special case for title
  if (blockRange.type === 'Title') {
    const page = blockRange.models[0].page;
    const pageElement = getDefaultPage(page);
    if (!pageElement) {
      // Maybe in edgeless mode
      return null;
    }
    const titleVEditor = pageElement.titleVEditor;
    const [startNode, startOffset] = titleVEditor.getTextPoint(
      blockRange.startOffset
    );
    const [endNode, endOffset] = titleVEditor.getTextPoint(
      blockRange.endOffset
    );
    const range = new Range();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  }

  const models = blockRange.models.filter(model => model.text);
  if (!models.length) {
    // BlockRange may be selected embeds, and it don't have text
    // so we can't convert it to native range
    return null;
  }
  const [startNode, startOffset] = getTextNodeByModel(
    models[0],
    blockRange.startOffset
  );
  const [endNode, endOffset] = getTextNodeByModel(
    models[models.length - 1],
    blockRange.endOffset
  );
  const range = new Range();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  return range;
}

export function nativeRangeToBlockRange(range: Range) {
  // TODO check range is in page
  const models = getModelsByRange(range);
  if (!models.length) {
    // NativeRange may be outside of the editor
    // so we can't convert it to block range
    return null;
  }

  const startVRange = getVRangeByNode(range.startContainer);
  const endVRange = getVRangeByNode(range.endContainer);
  if (!startVRange || !endVRange) {
    return null;
  }

  const startOffset = startVRange.index;
  const endOffset = endVRange.index + endVRange.length;
  return {
    type: 'Native',
    startOffset,
    endOffset,
    models,
  } satisfies BlockRange;
}

/**
 * Sometimes, the block in the block range is updated, we need to update the block range manually.
 *
 * Note: it will mutate the `blockRange` object.
 */
export function updateBlockRange(
  blockRange: BlockRange,
  oldModel: BaseBlockModel,
  newModel: BaseBlockModel
) {
  blockRange.models = blockRange.models.map(model =>
    model === oldModel ? newModel : model
  );
  return blockRange;
}

/**
 * Restore the block selection.
 * See also {@link resetNativeSelection}
 */
export function restoreSelection(blockRange: BlockRange | ExtendBlockRange) {
  if (!blockRange.models.length) {
    throw new Error("Can't restore selection, blockRange.models is empty");
  }

  const page = blockRange.models[0].page;
  const defaultPageBlock = getDefaultPage(page);

  if (blockRange.type === 'Native') {
    const range = blockRangeToNativeRange(blockRange);
    resetNativeSelection(range);

    return;
  }

  if (blockRange.type === 'Block') {
    // Try clean native selection
    resetNativeSelection(null);
    (document.activeElement as HTMLElement).blur();
    return;
  }

  // In the default mode
  if (defaultPageBlock && blockRange.type === 'Title') {
    focusTitle(
      page,
      blockRange.startOffset,
      blockRange.endOffset - blockRange.startOffset
    );
    return;
  }
  throw new Error('Invalid block range type: ' + blockRange.type);
}

export function getVRangeByNode(node: Node): VRange | null {
  if (!node.parentElement) return null;

  const virgoElement: VEditor['_rootElement'] =
    node.parentElement.closest('[data-virgo-root="true"]') ||
    (node instanceof HTMLElement
      ? node.querySelector('[data-virgo-root="true"]')
      : null);
  const vEditor = virgoElement?.virgoEditor;
  if (!vEditor) return null;

  return vEditor.getVRange();
}

/**
 * Get the specific text node and offset by the selected block.
 * The reverse implementation of {@link getVRangeByNode}
 * See also {@link getVRangeByNode}
 *
 * ```ts
 * const [startNode, startOffset] = getTextNodeBySelectedBlock(startModel, startOffset);
 * const [endNode, endOffset] = getTextNodeBySelectedBlock(endModel, endOffset);
 *
 * const range = new Range();
 * range.setStart(startNode, startOffset);
 * range.setEnd(endNode, endOffset);
 *
 * const selection = window.getSelection();
 * selection.removeAllRanges();
 * selection.addRange(range);
 * ```
 */
export function getTextNodeByModel(model: BaseBlockModel, offset = 0) {
  const text = model.text;
  if (!text) {
    throw new Error("Failed to get block's text!");
  }
  if (offset > text.length) {
    offset = text.length;
    // FIXME enable strict check
    // console.error(
    //   'Offset is out of range! model: ',
    //   model,
    //   'offset: ',
    //   offset,
    //   'text: ',
    //   text.toString(),
    //   'text.length: ',
    //   text.length
    // );
  }

  const vEditor = getVirgoByModel(model);
  // TODO this assert is unreliable
  assertExists(vEditor);
  const [leaf, leafOffset] = vEditor.getTextPoint(offset);
  return [leaf, leafOffset] as const;
}
