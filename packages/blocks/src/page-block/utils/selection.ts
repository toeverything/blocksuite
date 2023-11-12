import type { TextSelection } from '@blocksuite/block-std';
import type { BlockSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { type BaseBlockModel } from '@blocksuite/store';

import type { AffineTextAttributes } from '../../_common/components/rich-text/virgo/types.js';
import { matchFlavours } from '../../_common/utils/model.js';
import { getVirgoByModel } from '../../_common/utils/query.js';

export function getSelectedContentModels(
  root: BlockSuiteRoot,
  types: Extract<BlockSuite.SelectionType, 'block' | 'text' | 'image'>[]
): BaseBlockModel[] {
  const result: BaseBlockModel[] = [];
  root.std.command
    .pipe()
    .withRoot()
    .tryAll(chain => [
      chain.getTextSelection(),
      chain.getBlockSelections(),
      chain.getImageSelections(),
    ])
    .getSelectedBlocks({
      types,
    })
    .inline(ctx => {
      const { selectedBlocks } = ctx;
      assertExists(selectedBlocks);
      result.push(...selectedBlocks.map(el => el.model));
    })
    .run();
  return result;
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
export function getCombinedFormatInTextSelection(
  root: BlockSuiteRoot,
  textSelection: TextSelection,
  loose = false
): AffineTextAttributes {
  const selectedModels = getSelectedContentModels(root, ['text', 'block']);
  if (selectedModels.length === 0) {
    return {};
  }

  if (selectedModels.length === 1) {
    const vEditor = getVirgoByModel(selectedModels[0]);
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
  const startModel = selectedModels[0];
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
  const endModel = selectedModels[selectedModels.length - 1];
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
  selectedModels
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

export function getCombinedFormatInBlockSelections(
  root: BlockSuiteRoot,
  blockSelections: BlockSelection[],
  loose = false
): AffineTextAttributes {
  const viewStore = root.view;
  const selectionManager = root.selection;

  const formats = blockSelections.flatMap(blockSelection => {
    const blockElement = viewStore.viewFromPath('block', blockSelection.path);
    if (!blockElement || !blockElement.model.text) {
      return [];
    }

    const textSelection = selectionManager.getInstance('text', {
      from: {
        path: blockSelection.path,
        index: 0,
        length: blockElement.model.text.length,
      },
      to: null,
    });
    const format = getCombinedFormatInTextSelection(root, textSelection, loose);

    return format;
  });

  return mergeFormat(formats, loose);
}
