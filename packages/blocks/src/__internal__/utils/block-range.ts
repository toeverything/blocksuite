import {
  assertExists,
  type BaseBlockModel,
  type Page,
} from '@blocksuite/store';
import type { VRange } from '@blocksuite/virgo';

import type { RichText } from '../rich-text/rich-text.js';
import {
  getDefaultPage,
  getModelByElement,
  getModelsByRange,
  getVirgoByModel,
  isInsidePageTitle,
} from './query.js';
import {
  focusTitle,
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

type ExtendBlockRange = {
  type: 'Title';
  startOffset: number;
  endOffset: number;
  /**
   * Only one model, the page model
   */
  models: [BaseBlockModel];
};

export function getCurrentBlockRange(page: Page): BlockRange | null {
  // check exist block selection
  const pageBlock = getDefaultPage(page);
  if (pageBlock) {
    const selectedBlocks = pageBlock.selection.state.selectedBlocks;
    // Add embeds block to fix click image and delete case
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
  // check exist native selection
  if (hasNativeSelection()) {
    const range = getCurrentNativeRange();
    return nativeRangeToBlockRange(range);
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

export function nativeRangeToBlockRange(range: Range): BlockRange | null {
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
export function restoreSelection(blockRange: BlockRange | ExtendBlockRange) {
  if (!blockRange.models.length) {
    throw new Error("Can't restore selection, blockRange.models is empty");
  }

  const page = blockRange.models[0].page;
  const defaultPageBlock = getDefaultPage(page);

  if (blockRange.type === 'Native') {
    const range = blockRangeToNativeRange(blockRange);
    resetNativeSelection(range);

    // In the default mode
    if (defaultPageBlock) {
      defaultPageBlock.selection.state.clearBlockSelection();
      defaultPageBlock.selection.state.type = 'native';
    }
    return;
  }

  if (blockRange.type === 'Block') {
    // In the default mode
    if (defaultPageBlock) {
      defaultPageBlock.selection.state.type = 'block';
      defaultPageBlock.selection.refreshSelectedBlocksRectsByModels(
        blockRange.models
      );
    }
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

/**
 * Get the block range that includes the title range.
 *
 * In most cases, we should use {@link getCurrentBlockRange} to get current block range.
 *
 */
export function getExtendBlockRange(
  page: Page
): BlockRange | ExtendBlockRange | null {
  const basicBlockRange = getCurrentBlockRange(page);
  if (basicBlockRange) return basicBlockRange;
  // Check title
  if (!hasNativeSelection()) {
    return null;
  }
  const range = getCurrentNativeRange();
  const isTitleRange =
    isInsidePageTitle(range.startContainer) &&
    isInsidePageTitle(range.endContainer);
  if (isTitleRange) {
    const pageModel = page.root;
    assertExists(pageModel);
    return {
      type: 'Title' as const,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      models: [pageModel],
    };
  }

  return null;
}

export function getVRangeByNode(node: Node): VRange | null {
  if (!node.parentElement) return null;

  const richText = node.parentElement.closest('rich-text') as RichText;
  const vEditor = richText?.vEditor;
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
  assertExists(vEditor);
  const [leaf, leafOffset] = vEditor.getTextPoint(offset);
  return [leaf, leafOffset] as const;
}

// The following section is experimental code.
// I believe that `BlockRange` is sufficient for our current needs,
// so we do not plan to enable the following section at this time.
//
// However, it can help us understand the design and development direction of `BlockRange`.
// If it is needed in the future, we may enable it.

type ExperimentBlockRange = {
  type: 'Native' | 'Block';
  range: Range | null;
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
