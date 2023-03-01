import {
  assertExists,
  assertFlavours,
  matchFlavours,
} from '@blocksuite/global/utils';
import { BaseBlockModel, Page, Text } from '@blocksuite/store';
import type { TextAttributes } from '@blocksuite/virgo';

import {
  almostEqual,
  ExtendedModel,
  getDefaultPageBlock,
  TopLevelBlockModel,
} from '../../__internal__/index.js';
import {
  BlockRange,
  getCurrentBlockRange,
  restoreSelection,
  updateBlockRange,
} from '../../__internal__/utils/block-range.js';
import { asyncFocusRichText } from '../../__internal__/utils/common-operations.js';
import {
  getBlockElementByModel,
  getRichTextByModel,
} from '../../__internal__/utils/query.js';
import {
  getCurrentNativeRange,
  hasNativeSelection,
  isCollapsedNativeSelection,
  isMultiBlockRange,
  resetNativeSelection,
} from '../../__internal__/utils/selection.js';
import type { BlockSchema } from '../../models.js';
import type { DefaultSelectionManager } from '../default/selection-manager.js';
import { DEFAULT_SPACING } from '../edgeless/utils.js';

export function handleBlockSelectionBatchDelete(
  page: Page,
  models: ExtendedModel[]
) {
  const parentModel = page.getParent(models[0]);
  assertExists(parentModel);
  const index = parentModel.children.indexOf(models[0]);
  page.captureSync();
  models.forEach(model => page.deleteBlock(model));
  const id = page.addBlockByFlavour(
    'affine:paragraph',
    { type: 'text' },
    parentModel,
    index
  );

  // Try clean block selection
  const defaultPageBlock = getDefaultPageBlock(models[0]);
  if (!defaultPageBlock.selection) {
    // In the edgeless mode
    return;
  }
  defaultPageBlock.selection.clear();
  id && asyncFocusRichText(page, id);
  return;
}

export function deleteModelsByRange(
  page: Page,
  blockRange = getCurrentBlockRange(page)
) {
  if (!blockRange) {
    return;
  }
  if (blockRange.type === 'Block') {
    handleBlockSelectionBatchDelete(page, blockRange.models);
    return;
  }
  const startModel = blockRange.models[0];
  const endModel = blockRange.models[blockRange.models.length - 1];
  if (!startModel.text || !endModel.text) {
    throw new Error('startModel or endModel does not have text');
  }
  // Only select one block
  if (startModel === endModel) {
    page.captureSync();
    startModel.text.delete(
      blockRange.startOffset,
      blockRange.endOffset - blockRange.startOffset
    );
    return;
  }
  page.captureSync();
  startModel.text.delete(
    blockRange.startOffset,
    startModel.text.length - blockRange.startOffset
  );
  endModel.text.delete(0, blockRange.endOffset);
  startModel.text.join(endModel.text);
  blockRange.models.slice(1).forEach(model => {
    page.deleteBlock(model);
  });

  const firstRichText = getRichTextByModel(startModel);
  // TODO update focus API
  firstRichText && firstRichText.quill.setSelection(blockRange.startOffset, 0);
}

/**
 * Do nothing when selection is collapsed or not multi block selected
 */
export function handleMultiBlockBackspace(page: Page, e: KeyboardEvent) {
  if (!hasNativeSelection()) return;
  if (isCollapsedNativeSelection()) return;
  if (!isMultiBlockRange()) return;
  e.preventDefault();
  deleteModelsByRange(page);
}

function mergeToCodeBlocks(page: Page, models: BaseBlockModel[]) {
  const parent = page.getParent(models[0]);
  assertExists(parent);
  const index = parent.children.indexOf(models[0]);
  const text = models
    .map(model => {
      if (model.text instanceof Text) {
        return model.text.toString();
      }
      return null;
    })
    .filter(Boolean)
    .join('\n');
  models.map(model => page.deleteBlock(model));

  const id = page.addBlockByFlavour(
    'affine:code',
    { text: new Text(text) },
    parent,
    index
  );
  return id;
}

export function updateBlockType(
  models: BaseBlockModel[],
  flavour: keyof BlockSchema,
  type?: string
) {
  if (!models.length) {
    return [];
  }
  const page = models[0].page;
  const hasSamePage = models.every(model => model.page === page);
  if (!hasSamePage) {
    // page check
    console.error(
      'Not all models have the same page instanceof, the result for update text type may not be correct',
      models
    );
  }
  page.captureSync();
  const savedBlockRange = getCurrentBlockRange(page);
  if (flavour === 'affine:code') {
    const id = mergeToCodeBlocks(page, models);
    const model = page.getBlockById(id);
    if (!model) {
      throw new Error('Failed to get model after merge code block!');
    }
    requestAnimationFrame(() =>
      restoreSelection({
        type: 'Block',
        startOffset: 0,
        endOffset: model.text?.length ?? 0,
        models: [model],
      })
    );
    return [model];
  }
  // The lastNewId will not be null since we have checked models.length > 0
  const newModels: BaseBlockModel[] = [];
  models.forEach(model => {
    assertFlavours(model, ['affine:paragraph', 'affine:list', 'affine:code']);
    if (model.flavour === flavour) {
      page.updateBlock(model, { type });
      newModels.push(model);
      return;
    }
    const newId = transformBlock(model, flavour, type);
    const newModel = page.getBlockById(newId);
    if (!newModel) {
      throw new Error('Failed to get new model after transform block!');
    }
    savedBlockRange && updateBlockRange(savedBlockRange, model, newModel);
    newModels.push(newModel);
  });

  // Focus last new block
  const lastModel = newModels.at(-1);
  if (lastModel) asyncFocusRichText(page, lastModel.id);
  if (savedBlockRange) {
    requestAnimationFrame(() => restoreSelection(savedBlockRange));
  }
  return newModels;
}

function transformBlock(model: BaseBlockModel, flavour: string, type?: string) {
  const page = model.page;
  const parent = page.getParent(model);
  assertExists(parent);
  const blockProps = {
    flavour,
    type,
    text: model?.text?.clone(), // should clone before `deleteBlock`
    children: model.children,
  };
  const index = parent.children.indexOf(model);
  page.deleteBlock(model);
  const id = page.addBlock(blockProps, parent, index);
  return id;
}

/**
 * Merge format of multiple blocks. Format will be active only when all blocks have the same format.
 *
 * Used for format quick bar.
 */
function mergeFormat(formatArr: TextAttributes[]): TextAttributes {
  if (!formatArr.length) {
    return {};
  }
  return formatArr.reduce((acc, cur) => {
    const newFormat: TextAttributes = {};
    for (const key in acc) {
      const typedKey = key as keyof TextAttributes;
      if (acc[typedKey] === cur[typedKey]) {
        // This cast is secure because we have checked that the value of the key is the same.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newFormat[typedKey] = acc[typedKey] as any;
      }
    }
    return newFormat;
  });
}

export function getCombinedFormat(blockRange: BlockRange): TextAttributes {
  if (blockRange.models.length === 1) {
    const richText = getRichTextByModel(blockRange.models[0]);
    assertExists(richText);
    const { quill } = richText;
    const format = quill.getFormat(
      blockRange.startOffset,
      blockRange.endOffset - blockRange.startOffset
    );
    return format;
  }
  const formatArr = [];
  // Start block
  // Skip code block or empty block
  const startModel = blockRange.models[0];
  if (
    !matchFlavours(startModel, ['affine:code']) &&
    startModel.text &&
    startModel.text.length
  ) {
    const startRichText = getRichTextByModel(startModel);
    assertExists(startRichText);
    const startFormat = startRichText.quill.getFormat(
      blockRange.startOffset,
      startRichText.quill.getLength() - blockRange.startOffset
    );
    formatArr.push(startFormat);
  }
  // End block
  const endModel = blockRange.models[blockRange.models.length - 1];
  if (
    !matchFlavours(endModel, ['affine:code']) &&
    endModel.text &&
    endModel.text.length
  ) {
    const endRichText = getRichTextByModel(endModel);
    assertExists(endRichText);
    const endFormat = endRichText.quill.getFormat(0, blockRange.endOffset);
    formatArr.push(endFormat);
  }
  // Between blocks
  blockRange.models
    .slice(1, -1)
    .filter(model => !matchFlavours(model, ['affine:code']))
    .filter(model => model.text && model.text.length)
    .forEach(model => {
      const richText = getRichTextByModel(model);
      assertExists(richText);
      const format = richText.quill.getFormat(
        0,
        richText.quill.getLength() - 1
      );
      formatArr.push(format);
    });

  return mergeFormat(formatArr);
}

export function getCurrentCombinedFormat(page: Page): TextAttributes {
  const blockRange = getCurrentBlockRange(page);
  if (!blockRange) {
    return {};
  }
  return getCombinedFormat(blockRange);
}

function formatBlockRange(blockRange: BlockRange, key: keyof TextAttributes) {
  const { startOffset, endOffset } = blockRange;
  const startModel = blockRange.models[0];
  const endModel = blockRange.models[blockRange.models.length - 1];
  // edge case 1: collapsed range
  if (blockRange.models.length === 1 && startOffset === endOffset) {
    // Collapsed range
    return;
  }
  const format = getCombinedFormat(blockRange);

  // edge case 2: same model
  if (blockRange.models.length === 1) {
    if (matchFlavours(startModel, ['affine:code'])) return;
    startModel.text?.format(startOffset, endOffset - startOffset, {
      [key]: !format[key],
    });
    return;
  }
  // common case
  // format start model
  if (!matchFlavours(startModel, ['affine:code'])) {
    startModel.text?.format(startOffset, startModel.text.length - startOffset, {
      [key]: !format[key],
    });
  }
  // format end model
  if (!matchFlavours(endModel, ['affine:code'])) {
    endModel.text?.format(0, endOffset, { [key]: !format[key] });
  }
  // format between models
  blockRange.models
    .slice(1, -1)
    .filter(model => !matchFlavours(model, ['affine:code']))
    .forEach(model => {
      model.text?.format(0, model.text.length, { [key]: !format[key] });
    });

  // Native selection maybe shifted after format
  // We need to restore it manually
  if (blockRange.type === 'Native') {
    restoreSelection(blockRange);
  }
}

export function handleFormat(page: Page, key: keyof TextAttributes) {
  const blockRange = getCurrentBlockRange(page);
  if (!blockRange) return;
  page.captureSync();
  formatBlockRange(blockRange, key);
}

export function handleSelectAll(selection: DefaultSelectionManager) {
  const currentSelection = window.getSelection();
  if (
    selection.state.selectedBlocks.length === 0 &&
    currentSelection?.focusNode?.nodeName === '#text'
  ) {
    const currentRange = getCurrentNativeRange();
    const rangeRect = currentRange.getBoundingClientRect();
    selection.selectBlocksByRect(rangeRect);
  } else {
    const LARGE_BOUND = 999999;
    const rect = new DOMRect(0, 0, LARGE_BOUND, LARGE_BOUND);
    selection.state.focusedBlockIndex = -1; // SELECT_ALL
    selection.selectBlocksByRect(rect);
  }

  resetNativeSelection(null);
}

export function tryUpdateFrameSize(page: Page, zoom: number) {
  requestAnimationFrame(() => {
    if (!page.root) return;
    const frames = page.root.children as TopLevelBlockModel[];
    let offset = 0;
    frames.forEach(model => {
      // DO NOT resize shape block
      // FIXME: we don't have shape block for now.
      // if (matchFlavours(model, ['affine:shape'])) return;
      const blockElement = getBlockElementByModel(model);
      if (!blockElement) return;
      const bound = blockElement.getBoundingClientRect();
      if (!bound) return;

      const [x, y, w, h] = JSON.parse(model.xywh) as [
        number,
        number,
        number,
        number
      ];
      const newModelHeight = bound.height / zoom;
      if (!almostEqual(newModelHeight, h)) {
        const newX = x + (offset === 0 ? 0 : offset + DEFAULT_SPACING);
        page.updateBlock(model, {
          xywh: JSON.stringify([newX, y, w, Math.round(newModelHeight)]),
        });
        offset = newX + w;
      }
    });
  });
}
