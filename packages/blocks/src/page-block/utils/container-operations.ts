import {
  assertExists,
  assertFlavours,
  matchFlavours,
} from '@blocksuite/global/utils';
import { BaseBlockModel, Page, Text } from '@blocksuite/store';
import type { TextAttributes, VEditor, VRange } from '@blocksuite/virgo';

import {
  almostEqual,
  ExtendedModel,
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
  getModelByElement,
  getModelsByRange,
  getParentBlockById,
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

export function getVEditorFormat(
  vEditor: VEditor,
  vRange: VRange
): TextAttributes {
  const deltas = vEditor.getDeltasByVRange(vRange);

  const result: {
    [key: string]: unknown;
  } = {};
  for (const [delta] of deltas) {
    if (delta.attributes) {
      for (const [key, value] of Object.entries(delta.attributes)) {
        if (typeof result[key] === 'boolean') {
          result[key] = result[key] && value;
          continue;
        }
        result[key] = value;
      }
    }
  }

  return result as TextAttributes;
}

/**
 * TODO Use BlockRange
 */
export function deleteModelsByRange(
  page: Page,
  range = getCurrentNativeRange()
) {
  const models = getModelsByRange(range);

  const first = models[0];
  const firstRichText = getRichTextByModel(first);
  const last = models[models.length - 1];
  const lastRichText = getRichTextByModel(last);
  assertExists(firstRichText);
  assertExists(lastRichText);
  assertExists(firstRichText.vEditor);
  assertExists(lastRichText.vEditor);

  const firstVRange = firstRichText.vEditor.getVRange();
  const endVRange = lastRichText.vEditor.getVRange();

  assertExists(firstVRange);
  assertExists(endVRange);

  const firstTextIndex = firstVRange.index;
  const endTextIndex = endVRange.index;

  // Only select one block
  if (models.length === 1) {
    firstRichText.model.text?.delete(
      firstTextIndex,
      endTextIndex - firstTextIndex
    );
    return;
  }

  const isFirstRichTextNotEmpty =
    firstRichText.model.text &&
    firstRichText.model.text.length !== firstTextIndex;
  // See https://github.com/toeverything/blocksuite/issues/283
  if (isFirstRichTextNotEmpty) {
    firstRichText.model.text?.delete(
      firstTextIndex,
      firstRichText.model.text.length - firstTextIndex
    );
  }
  const isLastRichTextFullSelected: boolean =
    lastRichText.model.text?.length === endTextIndex;
  if (!isLastRichTextFullSelected) {
    lastRichText.model.text?.delete(0, endTextIndex);
    firstRichText.model.text?.join(lastRichText.model.text as Text);
  }

  // delete models in between
  for (let i = 1; i <= models.length - 1; i++) {
    page.deleteBlock(models[i]);
  }

  assertExists(firstRichText.vEditor);
  firstRichText.vEditor.setVRange({
    index: firstTextIndex,
    length: 0,
  });
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
 * Do nothing when selection is collapsed or not multi block selected
 */
export function handleMultiBlockBackspace(page: Page, e: KeyboardEvent) {
  if (!hasNativeSelection()) return;
  if (isCollapsedNativeSelection()) return;
  if (!isMultiBlockRange()) return;

  e.preventDefault();
  deleteModelsByRange(page);
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
    const { vEditor } = richText;
    assertExists(vEditor);
    const format = getVEditorFormat(vEditor, {
      index: blockRange.startOffset,
      length: blockRange.endOffset - blockRange.startOffset,
    });
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
    assertExists(startRichText.vEditor);
    const startFormat = getVEditorFormat(startRichText.vEditor, {
      index: blockRange.startOffset,
      length: startRichText.vEditor.yText.length - blockRange.startOffset,
    });
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
    assertExists(endRichText.vEditor);
    const endFormat = getVEditorFormat(endRichText.vEditor, {
      index: 0,
      length: blockRange.endOffset,
    });
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
      assertExists(richText.vEditor);
      const format = getVEditorFormat(richText.vEditor, {
        index: 0,
        length: richText.vEditor.yText.length - 1,
      });
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
    requestAnimationFrame(() => {
      restoreSelection(blockRange);
    });
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

export function handleBlockSelectionBatchDelete(
  page: Page,
  models: ExtendedModel[]
) {
  page.captureSync();
  const parent = getParentBlockById(models[0].id);

  assertExists(parent);
  const parentModel = getModelByElement(parent);
  const index = parentModel?.children.indexOf(models[0]);
  for (let i = 0; i < models.length; i++) {
    page.deleteBlock(models[i]);
  }
  const id = page.addBlock(
    { flavour: 'affine:paragraph', page, type: 'text' },
    parentModel,
    index
  );
  id && asyncFocusRichText(page, id);
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
