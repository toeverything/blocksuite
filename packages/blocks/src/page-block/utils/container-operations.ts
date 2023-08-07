import type { TextSelection } from '@blocksuite/block-std';
import { EDGELESS_BLOCK_CHILD_PADDING } from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import { deserializeXYWH } from '@blocksuite/phasor';
import type { BaseBlockModel, Page } from '@blocksuite/store';

import {
  almostEqual,
  asyncGetBlockElementByModel,
  asyncGetRichTextByModel,
  type BlockComponentElement,
  getBlockElementByModel,
  getVirgoByModel,
  hasNativeSelection,
  isCollapsedNativeSelection,
  isMultiBlockRange,
  type TopLevelBlockModel,
} from '../../__internal__/index.js';
import type { RichText } from '../../__internal__/rich-text/rich-text.js';
import type { AffineTextAttributes } from '../../__internal__/rich-text/virgo/types.js';
import { clearMarksOnDiscontinuousInput } from '../../__internal__/utils/virgo.js';
import type { PageBlockComponent } from '../types.js';
import { getSelectedContentModels, getTextSelection } from './selection.js';

export function deleteModelsByRange(
  pageElement: PageBlockComponent,
  textSelection?: TextSelection
) {
  if (!textSelection) {
    textSelection = getTextSelection(pageElement) ?? undefined;
  }
  assertExists(textSelection);

  const page = pageElement.page;
  const selectedModels = getSelectedContentModels(pageElement);

  if (selectedModels.length === 0) {
    return null;
  }

  const startModel = selectedModels[0];
  const endModel = selectedModels[selectedModels.length - 1];
  // TODO handle database
  if (!startModel.text || !endModel.text) {
    throw new Error('startModel or endModel does not have text');
  }

  const vEditor = getVirgoByModel(startModel);
  assertExists(vEditor);

  // Only select one block
  if (startModel === endModel) {
    page.captureSync();
    if (textSelection.from.index > 0 && textSelection.isCollapsed()) {
      // startModel.text.delete(blockRange.startOffset - 1, 1);
      // vEditor.setVRange({
      //   index: blockRange.startOffset - 1,
      //   length: 0,
      // });
      return startModel;
    }
    startModel.text.delete(textSelection.from.index, textSelection.from.length);
    vEditor.setVRange({
      index: textSelection.from.index,
      length: 0,
    });
    return startModel;
  }
  page.captureSync();
  startModel.text.delete(textSelection.from.index, textSelection.from.length);
  endModel.text.delete(
    textSelection.to?.index ?? 0,
    textSelection.to?.length ?? 0
  );
  startModel.text.join(endModel.text);
  selectedModels.slice(1).forEach(model => {
    page.deleteBlock(model);
  });

  vEditor.setVRange({
    index: textSelection.from.index,
    length: 0,
  });
  return startModel;
}

/**
 * Do nothing when selection is collapsed or not multi block selected
 */
export function handleMultiBlockBackspace(
  pageElement: PageBlockComponent,
  e: KeyboardEvent
) {
  if (!hasNativeSelection()) return;
  if (isCollapsedNativeSelection()) return;
  if (!isMultiBlockRange()) return;
  e.preventDefault();
  deleteModelsByRange(pageElement);
}

/**
 * Merge format of multiple blocks. Format will be active only when all blocks have the same format.
 *
 * Used for format quick bar.
 */
function mergeFormat(
  formatArr: AffineTextAttributes[],
  loose: boolean
): AffineTextAttributes {
  if (!formatArr.length) {
    return {};
  }
  if (loose) {
    return formatArr.reduce((acc, cur) => ({ ...acc, ...cur }));
  }
  return formatArr.reduce((acc, cur) => {
    const newFormat: AffineTextAttributes = {};
    for (const key in acc) {
      const typedKey = key as keyof AffineTextAttributes;
      if (acc[typedKey] === cur[typedKey]) {
        // This cast is secure because we have checked that the value of the key is the same.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newFormat[typedKey] = acc[typedKey] as any;
      }
    }
    return newFormat;
  });
}

/**
 * By default, it is in `strict` mode, which only returns the formats that all the text in the range share.
 * formats with different values, such as different links, are considered different formats.
 *
 * If the `loose` mode is enabled, any format that exists in the range will be returned.
 * formats with different values will only return the last one.
 */
export function getCombinedFormat(
  pageElement: PageBlockComponent,
  textSelection: TextSelection,
  loose = false
): AffineTextAttributes {
  const selectedModel = getSelectedContentModels(pageElement);
  if (selectedModel.length === 0) {
    return {};
  }

  if (selectedModel.length === 1) {
    const vEditor = getVirgoByModel(selectedModel[0]);
    assertExists(vEditor);
    const format = vEditor.getFormat(
      {
        index: textSelection.from.index,
        length: textSelection.from.length,
      },
      loose
    );
    return format;
  }
  const formatArr = [];
  // Start block
  // Skip code block or empty block
  const startModel = selectedModel[0];
  if (
    !matchFlavours(startModel, ['affine:code']) &&
    startModel.text &&
    startModel.text.length
  ) {
    const vEditor = getVirgoByModel(startModel);
    assertExists(vEditor);
    const startFormat = vEditor.getFormat(
      {
        index: textSelection.from.index,
        length: textSelection.from.length,
      },
      loose
    );
    formatArr.push(startFormat);
  }
  // End block
  const endModel = selectedModel[selectedModel.length - 1];
  if (
    !matchFlavours(endModel, ['affine:code']) &&
    endModel.text &&
    endModel.text.length
  ) {
    const vEditor = getVirgoByModel(endModel);
    assertExists(vEditor);
    const endFormat = vEditor.getFormat(
      {
        index: 0,
        length: textSelection.to?.length ?? 0,
      },
      loose
    );
    formatArr.push(endFormat);
  }
  // Between blocks
  selectedModel
    .slice(1, -1)
    .filter(model => !matchFlavours(model, ['affine:code']))
    .filter(model => model.text && model.text.length)
    .forEach(model => {
      const vEditor = getVirgoByModel(model);
      assertExists(vEditor);
      const format = vEditor.getFormat({
        index: 0,
        length: vEditor.yText.length - 1,
      });
      formatArr.push(format);
    }, loose);

  return mergeFormat(formatArr, loose);
}

export function getCurrentCombinedFormat(
  pageElement: PageBlockComponent,
  textSelection: TextSelection,
  loose = false
): AffineTextAttributes {
  return getCombinedFormat(pageElement, textSelection, loose);
}

function formatTextSelection(
  pageElement: PageBlockComponent,
  textSelection: TextSelection,
  key: keyof Omit<AffineTextAttributes, 'link' | 'reference'>
) {
  const selectedModels = getSelectedContentModels(pageElement);

  if (selectedModels.length === 0) {
    throw new Error('No selected models');
  }

  const selectionManager = pageElement.root.selectionManager;
  const { from, to } = textSelection;
  const startModel = selectedModels[0];
  const endModel = selectedModels[selectedModels.length - 1];
  // edge case 1: collapsed range
  if (textSelection.isCollapsed()) {
    // Collapsed range

    const vEditor = getVirgoByModel(startModel);
    const delta = vEditor?.getDeltaByRangeIndex(from.index);
    if (!vEditor || !delta) return;
    vEditor.setMarks({
      ...vEditor.marks,
      [key]:
        (vEditor.marks && vEditor.marks[key]) ||
        (delta.attributes && delta.attributes[key])
          ? null
          : true,
    });
    clearMarksOnDiscontinuousInput(vEditor);

    return;
  }
  const format = getCombinedFormat(pageElement, textSelection);

  // edge case 2: same model
  if (textSelection.isInSameBlock()) {
    if (matchFlavours(startModel, ['affine:code'])) return;
    const vEditor = getVirgoByModel(startModel);
    vEditor?.slots.updated.once(() => {
      selectionManager.set([textSelection]);
    });
    startModel.text?.format(from.index, from.length, {
      [key]: format[key] ? null : true,
    });
    return;
  }
  // common case
  // format start model
  if (!matchFlavours(startModel, ['affine:code'])) {
    startModel.text?.format(from.index, from.length, {
      [key]: format[key] ? null : true,
    });
  }
  // format end model
  if (!matchFlavours(endModel, ['affine:code'])) {
    endModel.text?.format(to?.index ?? 0, to?.length ?? 0, {
      [key]: format[key] ? null : true,
    });
  }
  // format between models
  selectedModels
    .slice(1, -1)
    .filter(model => !matchFlavours(model, ['affine:code']))
    .forEach(model => {
      model.text?.format(0, model.text.length, {
        [key]: format[key] ? null : true,
      });
    });

  // Native selection maybe shifted after format
  // We need to restore it manually
  const allTextUpdated = selectedModels
    .filter(model => !matchFlavours(model, ['affine:code']))
    .map(
      model =>
        // We can not use `onModelTextUpdated` here because it is asynchronous, which
        // will make updated event emit before we observe it.
        new Promise(resolve => {
          const vEditor = getVirgoByModel(model);
          vEditor?.slots.updated.once(() => {
            resolve(vEditor);
          });
        })
    );

  Promise.all(allTextUpdated).then(() => {
    selectionManager.set([textSelection]);
  });
}

export function handleFormat(
  pageElement: PageBlockComponent,
  textSelection: TextSelection,
  key: keyof Omit<AffineTextAttributes, 'link' | 'reference'>
) {
  pageElement.page.captureSync();
  formatTextSelection(pageElement, textSelection, key);
}

export async function onModelTextUpdated(
  model: BaseBlockModel,
  callback?: (text: RichText) => void
) {
  const richText = await asyncGetRichTextByModel(model);
  richText?.vEditor?.slots.updated.once(() => {
    if (callback) {
      callback(richText);
    }
  });
}

// Run the callback until a model's element updated.
// Please notice that the callback will be called **once the element itself is ready**.
// The children may be not updated.
// If you want to wait for the text elements,
// please use `onModelTextUpdated`.
export async function onModelElementUpdated(
  model: BaseBlockModel,
  callback: (blockElement: BlockComponentElement) => void
) {
  const element = await asyncGetBlockElementByModel(model);
  if (element) {
    callback(element);
  }
}

export function tryUpdateNoteSize(page: Page, zoom: number) {
  requestAnimationFrame(() => {
    if (!page.root) return;
    const notes = page.root.children.filter(
      child => child.flavour === 'affine:note'
    ) as TopLevelBlockModel[];
    notes.forEach(model => {
      // DO NOT resize shape block
      // FIXME: we don't have shape block for now.
      // if (matchFlavours(model, ['affine:shape'])) return;
      const blockElement = getBlockElementByModel(model);
      if (!blockElement) return;
      const bound = blockElement.getBoundingClientRect();

      const [x, y, w, h] = deserializeXYWH(model.xywh);
      const newModelHeight =
        bound.height / zoom + EDGELESS_BLOCK_CHILD_PADDING * 2;
      if (!almostEqual(newModelHeight, h)) {
        page.updateBlock(model, {
          xywh: JSON.stringify([x, y, w, Math.round(newModelHeight)]),
        });
      }
    });
  });
}
