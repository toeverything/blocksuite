import type { TextSelection } from '@blocksuite/block-std';
import { EDGELESS_BLOCK_CHILD_PADDING } from '@blocksuite/global/config';
import type { BlockModels } from '@blocksuite/global/types';
import {
  assertExists,
  assertFlavours,
  matchFlavours,
} from '@blocksuite/global/utils';
import { deserializeXYWH } from '@blocksuite/phasor';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { Text } from '@blocksuite/store';

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
import { asyncFocusRichText } from '../../__internal__/utils/common-operations.js';
import { clearMarksOnDiscontinuousInput } from '../../__internal__/utils/virgo.js';
import type { BlockSchemas } from '../../models.js';
import type { PageBlockComponent } from '../types.js';
import { getSelectedContentModels, getTextSelection } from './selection.js';

export function deleteModelsByRange(
  host: PageBlockComponent,
  textSelection?: TextSelection
) {
  if (!textSelection) {
    textSelection = getTextSelection(host) ?? undefined;
  }
  assertExists(textSelection);

  const page = host.page;
  const selectedModels = getSelectedContentModels(host);

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
  host: PageBlockComponent,
  e: KeyboardEvent
) {
  if (!hasNativeSelection()) return;
  if (isCollapsedNativeSelection()) return;
  if (!isMultiBlockRange()) return;
  e.preventDefault();
  deleteModelsByRange(host);
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

  const id = page.addBlock(
    'affine:code',
    { text: new Text(text) },
    parent,
    index
  );
  return id;
}

export function updateBlockType(
  host: PageBlockComponent,
  models: BaseBlockModel[],
  flavour: keyof BlockSchemas,
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
  const selectionManager = host.root.selectionManager;
  const savedSelection = selectionManager.value;
  if (flavour === 'affine:code') {
    const id = mergeToCodeBlocks(page, models);
    const model = page.getBlockById(id);
    if (!model) {
      throw new Error('Failed to get model after merge code block!');
    }
    return [model];
  }
  if (flavour === 'affine:divider') {
    const model = models.at(-1);
    if (!model) {
      return [];
    }
    const parent = page.getParent(model);
    if (!parent) {
      return [];
    }
    const index = parent.children.indexOf(model);
    const nextSibling = page.getNextSibling(model);
    let nextSiblingId = nextSibling?.id as string;
    const id = page.addBlock('affine:divider', {}, parent, index + 1);
    if (!nextSibling) {
      nextSiblingId = page.addBlock('affine:paragraph', {}, parent);
    }
    asyncFocusRichText(page, nextSiblingId);
    const newModel = page.getBlockById(id);
    if (!newModel) {
      throw new Error('Failed to get model after add divider block!');
    }
    return [newModel];
  }

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
    newModels.push(newModel);
  });

  const allTextUpdated = newModels.map(model => onModelTextUpdated(model));

  Promise.all(allTextUpdated).then(() => {
    selectionManager.set(savedSelection);
  });

  return newModels;
}

function transformBlock(
  model: BaseBlockModel,
  flavour: keyof BlockModels,
  type?: string
) {
  const page = model.page;
  const parent = page.getParent(model);
  assertExists(parent);
  const blockProps: {
    type?: string;
    text?: Text;
    children?: BaseBlockModel[];
  } = {
    type,
    text: model?.text?.clone(), // should clone before `deleteBlock`
    children: model.children,
  };
  const index = parent.children.indexOf(model);
  page.deleteBlock(model);
  return page.addBlock(flavour, blockProps, parent, index);
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
  host: PageBlockComponent,
  textSelection: TextSelection,
  loose = false
): AffineTextAttributes {
  const selectedModel = getSelectedContentModels(host);
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
  host: PageBlockComponent,
  textSelection: TextSelection,
  loose = false
): AffineTextAttributes {
  return getCombinedFormat(host, textSelection, loose);
}

function formatTextSelection(
  host: PageBlockComponent,
  textSelection: TextSelection,
  key: keyof Omit<AffineTextAttributes, 'link' | 'reference'>
) {
  const selectedModels = getSelectedContentModels(host);

  if (selectedModels.length === 0) {
    throw new Error('No selected models');
  }

  const selectionManager = host.root.selectionManager;
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
  const format = getCombinedFormat(host, textSelection);

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
  host: PageBlockComponent,
  textSelection: TextSelection,
  key: keyof Omit<AffineTextAttributes, 'link' | 'reference'>
) {
  host.page.captureSync();
  formatTextSelection(host, textSelection, key);
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
