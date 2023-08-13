import type { TextSelection } from '@blocksuite/block-std';
import type { BlockSelection } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';
import {
  assertExists,
  type BaseBlockModel,
  matchFlavours,
} from '@blocksuite/store';

import type { AffineTextAttributes } from '../../__internal__/rich-text/virgo/types.js';
import { getVirgoByModel } from '../../__internal__/utils/query.js';
import type { PageBlockComponent } from '../types.js';

export function getSelectedContentModels(
  pageElement: PageBlockComponent,
  types: Extract<BlockSuiteSelectionType, 'block' | 'text'>[]
): BaseBlockModel[] {
  const { rangeManager } = pageElement;
  const selectionManager = pageElement.root.selectionManager;
  const selections = selectionManager.value;

  if (selections.length === 0) {
    return [];
  }

  const dirtyResult: BaseBlockModel[] = [];

  const textSelection = selectionManager.find('text');
  if (textSelection && types.includes('text')) {
    assertExists(rangeManager);
    const range = rangeManager.value;
    const selectedBlocks = rangeManager
      .getSelectedBlocksIdByRange(range)
      .flatMap(id => {
        const model = pageElement.page.getBlockById(id);
        // model can be null if the block is deleted
        return model ?? [];
      });

    dirtyResult.push(
      ...selectedBlocks.filter(model => model.role === 'content')
    );
  }

  const blockSelections = selectionManager.filter('block');
  if (blockSelections.length > 0 && types.includes('block')) {
    dirtyResult.push(
      ...blockSelections
        .map(selection => {
          const model = pageElement.page.getBlockById(selection.blockId);
          assertExists(model);
          return model;
        })
        .filter(model => model.role === 'content')
    );
  }

  // remove duplicate models
  const result: BaseBlockModel[] = dirtyResult.filter(
    (model, index) => dirtyResult.indexOf(model) === index
  );

  return result;
}

export function getSelectedContentBlockElements(
  pageElement: PageBlockComponent,
  types: Extract<BlockSuiteSelectionType, 'block' | 'text'>[]
): BlockElement[] {
  const { rangeManager } = pageElement;
  const selectionManager = pageElement.root.selectionManager;
  const selections = selectionManager.value;

  if (selections.length === 0) {
    return [];
  }

  const dirtyResult: BlockElement[] = [];

  if (types.includes('text')) {
    assertExists(rangeManager);
    const range = rangeManager.value;
    const selectedBlockElements =
      rangeManager.getSelectedBlockElementsByRange(range);
    dirtyResult.push(
      ...selectedBlockElements.filter(el => el.model.role === 'content')
    );
  }

  if (types.includes('block')) {
    const viewStore = pageElement.root.viewStore;
    const blockSelections = selectionManager.filter('block');
    dirtyResult.push(
      ...blockSelections.flatMap(selection => {
        const el = viewStore.viewFromPath('block', selection.path);
        return el ?? [];
      })
    );
  }

  // remove duplicate elements
  const result: BlockElement[] = dirtyResult.filter(
    (el, index) => dirtyResult.indexOf(el) === index
  );

  return result;
}

export function getTextSelection(
  blockElement: BlockElement
): TextSelection | null {
  return blockElement.root.selectionManager.find('text') ?? null;
}

export function getBlockSelections(
  blockElement: BlockElement
): BlockSelection[] {
  return blockElement.root.selectionManager.filter('block');
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
  pageElement: PageBlockComponent,
  textSelection: TextSelection,
  loose = false
): AffineTextAttributes {
  const selectedModel = getSelectedContentModels(pageElement, [
    'text',
    'block',
  ]);
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

export function getCombinedFormatInBlockSelections(
  pageElement: PageBlockComponent,
  blockSelections: BlockSelection[],
  loose = false
): AffineTextAttributes {
  const viewStore = pageElement.root.viewStore;
  const selectionManager = pageElement.root.selectionManager;

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
    const format = getCombinedFormatInTextSelection(
      pageElement,
      textSelection,
      loose
    );

    return format;
  });

  return mergeFormat(formats, loose);
}
