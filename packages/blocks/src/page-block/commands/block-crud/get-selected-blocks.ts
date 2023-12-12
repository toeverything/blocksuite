import type {
  BlockSelection,
  Command,
  TextSelection,
} from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';

import type { ImageSelection } from '../../../image-block/image-selection.js';

export const getSelectedBlocksCommand: Command<
  | 'currentTextSelection'
  | 'currentBlockSelections'
  | 'currentImageSelections'
  | 'host',
  'selectedBlocks',
  {
    textSelection?: TextSelection;
    blockSelections?: BlockSelection[];
    imageSelections?: ImageSelection[];
    filter?: (el: BlockElement) => boolean;
    types: Extract<BlockSuite.SelectionType, 'block' | 'text' | 'image'>[];
  }
> = (ctx, next) => {
  const { host, types } = ctx;
  assertExists(
    host,
    '`host` is required, you need to use `withHost` command before adding this command to the pipeline.'
  );

  let dirtyResult: BlockElement[] = [];

  const textSelection = ctx.textSelection ?? ctx.currentTextSelection;
  if (types.includes('text') && textSelection) {
    const rangeManager = host.rangeManager;
    assertExists(rangeManager);
    const range = rangeManager.textSelectionToRange(textSelection);
    if (!range) return;

    const selectedBlockElements = rangeManager.getSelectedBlockElementsByRange(
      range,
      {
        match: (el: BlockElement) => el.model.role === 'content',
        mode: 'flat',
      }
    );
    dirtyResult.push(...selectedBlockElements);
  }

  const blockSelections = ctx.blockSelections ?? ctx.currentBlockSelections;
  if (types.includes('block') && blockSelections) {
    const viewStore = host.view;
    const selectedBlockElements = blockSelections.flatMap(selection => {
      const el = viewStore.viewFromPath('block', selection.path);
      return el ?? [];
    });
    dirtyResult.push(...selectedBlockElements);
  }

  const imageSelections = ctx.imageSelections ?? ctx.currentImageSelections;
  if (types.includes('image') && imageSelections) {
    const viewStore = host.view;
    const selectedBlockElements = imageSelections.flatMap(selection => {
      const el = viewStore.viewFromPath('block', selection.path);
      return el ?? [];
    });
    dirtyResult.push(...selectedBlockElements);
  }

  if (ctx.filter) {
    dirtyResult = dirtyResult.filter(ctx.filter);
  }

  // remove duplicate elements
  const result: BlockElement[] = dirtyResult
    .filter((el, index) => dirtyResult.indexOf(el) === index)
    // sort by document position
    .sort((a, b) => {
      if (a === b) {
        return 0;
      }

      const position = a.compareDocumentPosition(b);
      if (
        position & Node.DOCUMENT_POSITION_FOLLOWING ||
        position & Node.DOCUMENT_POSITION_CONTAINED_BY
      ) {
        return -1;
      }

      if (
        position & Node.DOCUMENT_POSITION_PRECEDING ||
        position & Node.DOCUMENT_POSITION_CONTAINS
      ) {
        return 1;
      }

      return 0;
    });

  if (result.length === 0) return;

  next({
    selectedBlocks: result,
  });
};

declare global {
  namespace BlockSuite {
    interface CommandData {
      selectedBlocks?: BlockElement[];
    }

    interface Commands {
      getSelectedBlocks: typeof getSelectedBlocksCommand;
    }
  }
}
