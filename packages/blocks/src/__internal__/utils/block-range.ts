import type { BaseBlockModel, Page } from '@blocksuite/store';

import {
  BlockComponentElement,
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

export function getCurrentBlockRange(page: Page): BlockRange | null {
  // check exist block selection
  if (page.root) {
    const pageBlock = getDefaultPageBlock(page.root);
    if (pageBlock.selection) {
      const selectedBlocks = pageBlock.selection.state.selectedBlocks;
      const selectedEmbeds = pageBlock.selection.state.selectedEmbeds;
      // Fix order may be wrong
      const models = [...selectedBlocks, ...selectedEmbeds]
        .map(element => getModelByElement(element))
        .filter(Boolean);
      if (models.length) {
        return {
          type: 'Block',
          startOffset: 0,
          endOffset: models[models.length - 1].text?.length ?? 0,
          models,
        };
      }
    }
  }
  // check exist native selection
  if (hasNativeSelection()) {
    const range = getCurrentNativeRange();
    return nativeRangeToBlockRange(range);
  }
  return null;
}

export function blockRangeToNativeRange(blockRange: BlockRange) {
  const [startNode, startOffset] = getTextNodeBySelectedBlock(
    blockRange.models[0],
    blockRange.startOffset
  );
  if (!startNode) {
    throw new Error(
      'Failed to convert block range to native range. Start node is null.'
    );
  }
  const [endNode, endOffset] = getTextNodeBySelectedBlock(
    blockRange.models[blockRange.models.length - 1],
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

export function nativeRangeToBlockRange(range: Range): BlockRange | null {
  // TODO check range is in page
  const models = getModelsByRange(range);
  if (!models.length) {
    return null;
  }
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
    startOffset,
    endOffset,
    models,
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
  blockRange.models = blockRange.models.map(model =>
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
    const defaultPageBlock = getDefaultPageBlock(blockRange.models[0]);
    if (!defaultPageBlock.selection) {
      // In the edgeless mode
      return;
    }
    defaultPageBlock.selection.state.clearBlock();
    defaultPageBlock.selection.state.type = 'native';
    return;
  }
  const defaultPageBlock = getDefaultPageBlock(blockRange.models[0]);
  if (!defaultPageBlock.selection) {
    // In the edgeless mode
    return;
  }
  defaultPageBlock.selection.clear();
  // get fresh elements
  defaultPageBlock.selection.state.type = 'block';
  defaultPageBlock.selection.state.selectedBlocks = blockRange.models
    .map(model => getBlockElementByModel(model))
    .filter(Boolean) as BlockComponentElement[];
  defaultPageBlock.selection.refreshSelectedBlocksRects();
  // Try clean native selection
  resetNativeSelection(null);
  (document.activeElement as HTMLTextAreaElement).blur();
}

// The following section is experimental code.
// I believe that `BlockRange` is sufficient for our current needs,
// so we do not plan to enable the following section at this time.
//
// However, it can help us understand the design and development direction of `BlockRange`.
// If it is needed in the future, we may enable it.

type ExperimentBlockRange = {
  type: 'Native' | 'Block';
  range: Range;
  models: BaseBlockModel[];
  startModel: BaseBlockModel;
  endModel: BaseBlockModel;
  betweenModels: BaseBlockModel[];
  startOffset: number;
  endOffset: number;
  collapsed: boolean;
  apply: () => void;
};

export const experimentCreateBlockRange = (
  rangeOrBlockRange: Range | BlockRange
): ExperimentBlockRange | null => {
  let cacheRange: Range | null =
    rangeOrBlockRange instanceof Range ? rangeOrBlockRange : null;
  const blockRange =
    rangeOrBlockRange instanceof Range
      ? nativeRangeToBlockRange(rangeOrBlockRange)
      : rangeOrBlockRange;

  if (!blockRange) {
    return null;
  }
  if (!blockRange.models.length) {
    throw new Error('Block range must have at least one model.');
  }

  const getRange = () => {
    // cache range may be expired
    if (cacheRange) {
      return cacheRange;
    }
    cacheRange = blockRangeToNativeRange(blockRange);
    return cacheRange;
  };

  return {
    ...blockRange,
    startModel: blockRange.models[0],
    endModel: blockRange.models[blockRange.models.length - 1],
    betweenModels: blockRange.models.slice(1, blockRange.models.length - 1),
    get range() {
      return getRange();
    },
    collapsed:
      blockRange.models.length === 1 &&
      blockRange.startOffset === blockRange.endOffset,
    apply() {
      restoreSelection(blockRange);
    },
  };
};
