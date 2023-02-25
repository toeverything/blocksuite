import type { BaseBlockModel, Page } from '@blocksuite/store';

import {
  getBlockElementByModel,
  getDefaultPageBlock,
  getModelByElement,
  getModelsByRange,
  getQuillIndexByNativeSelection,
  getTextNodeBySelectedBlock,
} from './query.js';
import {
  getCurrentNativeRange,
  hasNativeSelection,
  resetNativeSelection,
} from './selection.js';

/**
 * Use {@link getCurrentBlockRange} to get current block range.
 *
 * You can use {@link nativeRangeToBlockRange} and {@link blockRangeToNativeRange} convert between native range and block range.
 */
export type BlockRange = {
  /**
   * @deprecated Use models instead
   */
  startModel: BaseBlockModel;
  /**
   * @deprecated Use models instead
   */
  endModel: BaseBlockModel;
  /**
   * Models between startModel and endModel, not including startModel and endModel
   * @deprecated Use models instead
   */
  betweenModels: BaseBlockModel[];

  /**
   * 'Native' for native selection, 'Block' for block selection
   */
  type: 'Native' | 'Block';
  /**
   * Promise the length of models is greater than 0
   */
  // models: BaseBlockModel[];
  startOffset: number;
  endOffset: number;
  // collapsed is true when models.length === 1 && startOffset === endOffset
  // collapsed: true;
};

export function getCurrentBlockRange(page: Page): BlockRange | null {
  // check exist block selection
  if (page.root) {
    const pageBlock = getDefaultPageBlock(page.root);
    if (pageBlock.selection) {
      const selectedBlocks = pageBlock.selection.state.selectedBlocks;
      const selectedEmbeds = pageBlock.selection.state.selectedEmbeds;
      const models = [...selectedBlocks, ...selectedEmbeds]
        .map(element => getModelByElement(element))
        .filter(Boolean);
      if (models.length) {
        return {
          type: 'Block',
          startModel: models[0],
          startOffset: 0,
          endModel: models[models.length - 1],
          endOffset: models[models.length - 1].text?.length ?? 0,
          betweenModels: models.slice(1, models.length - 1),
        };
      }
    }
  }
  // check exist native selection
  if (hasNativeSelection()) {
    const range = getCurrentNativeRange();
    // TODO check range is in page
    return nativeRangeToBlockRange(range);
  }
  return null;
}

export function blockRangeToNativeRange(blockRange: BlockRange) {
  const [startNode, startOffset] = getTextNodeBySelectedBlock(
    blockRange.startModel,
    blockRange.startOffset
  );
  if (!startNode) {
    throw new Error(
      'Failed to convert block range to native range. Start node is null.'
    );
  }
  const [endNode, endOffset] = getTextNodeBySelectedBlock(
    blockRange.endModel,
    blockRange.endOffset
  );
  if (!startNode) {
    throw new Error(
      'Failed to convert block range to native range. End node is null.'
    );
  }
  const range = new Range();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  return range;
}

export function nativeRangeToBlockRange(range: Range): BlockRange {
  const models = getModelsByRange(range);
  const startOffset = getQuillIndexByNativeSelection(
    range.startContainer,
    range.startOffset
  );
  const endOffset = getQuillIndexByNativeSelection(
    range.endContainer,
    range.endOffset
  );
  return {
    type: 'Native',
    startModel: models[0],
    startOffset,
    endModel: models[models.length - 1],
    endOffset,
    betweenModels: models.slice(1, -1),
  };
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
  if (blockRange.startModel === oldModel) {
    blockRange.startModel = newModel;
  }
  if (blockRange.endModel === oldModel) {
    blockRange.endModel = newModel;
  }
  blockRange.betweenModels = blockRange.betweenModels.map(model =>
    model === oldModel ? newModel : model
  );
  return blockRange;
}

/**
 * Restore the block selection.
 * See also {@link resetNativeSelection}
 */
export function restoreSelection(blockRange: BlockRange) {
  if (blockRange.type === 'Native') {
    const range = blockRangeToNativeRange(blockRange);
    resetNativeSelection(range);

    // Try clean block selection
    const defaultPageBlock = getDefaultPageBlock(blockRange.startModel);
    if (!defaultPageBlock.selection) {
      // In the edgeless mode
      return;
    }
    defaultPageBlock.selection.state.clearBlock();
    defaultPageBlock.selection.state.type = 'native';
    return;
  }
  const defaultPageBlock = getDefaultPageBlock(blockRange.startModel);
  if (!defaultPageBlock.selection) {
    // In the edgeless mode
    return;
  }
  const models =
    blockRange.startModel === blockRange.endModel
      ? [blockRange.startModel]
      : [
          blockRange.startModel,
          ...blockRange.betweenModels,
          blockRange.endModel,
        ];
  defaultPageBlock.selection.clear();
  // get fresh elements
  defaultPageBlock.selection.state.type = 'block';
  defaultPageBlock.selection.state.selectedBlocks = models
    .map(model => getBlockElementByModel(model))
    .filter(Boolean) as Element[];
  defaultPageBlock.selection.refreshSelectedBlocksRects();
  // Try clean native selection
  resetNativeSelection(null);
  (document.activeElement as HTMLTextAreaElement).blur();
}
