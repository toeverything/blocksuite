import type { BlockSelection } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';

import {
  ensureBlockInContainer,
  getBlockSelectionBySide,
  getNextBlock,
  getPrevBlock,
  getTextSelection,
  moveCursorToNextBlockElement,
  moveCursorToPrevBlockElement,
  pathToBlock,
  selectBetween,
  setBlockSelection,
} from './utils.js';

export const bindHotKey = (blockElement: BlockElement) => {
  let anchorSel: BlockSelection | null = null;
  let focusBlock: BlockElement | null = null;
  const reset = () => {
    anchorSel = null;
    focusBlock = null;
  };

  blockElement.handleEvent('keyDown', ctx => {
    const state = ctx.get('keyboardState');
    if (state.raw.key === 'Shift') {
      return;
    }
    reset();
  });
  blockElement.bindHotKey({
    ArrowDown: () => {
      reset();

      const textSelection = getTextSelection(blockElement);
      if (textSelection) {
        const end = textSelection.to ?? textSelection.from;
        const block = pathToBlock(blockElement, end.path);
        if (!block) {
          return;
        }
        const nextBlock = getNextBlock(block, block => !!block.model.text);
        if (!nextBlock) {
          return;
        }
        moveCursorToNextBlockElement(nextBlock);
        return true;
      }

      const blockSelection = getBlockSelectionBySide(blockElement, true);
      if (!blockSelection) {
        return;
      }
      const focus = pathToBlock(blockElement, blockSelection.path);
      if (!focus) {
        return;
      }

      const nextBlock = getNextBlock(focus);

      if (!nextBlock || !ensureBlockInContainer(nextBlock, blockElement)) {
        return;
      }

      setBlockSelection(nextBlock);

      return true;
    },
    ArrowUp: () => {
      reset();

      const textSelection = getTextSelection(blockElement);
      if (textSelection) {
        const start = textSelection.from;
        const block = pathToBlock(blockElement, start.path);
        if (!block) {
          return;
        }
        const prevBlock = getPrevBlock(block, block => !!block.model.text);
        if (!prevBlock) {
          return;
        }
        moveCursorToPrevBlockElement(prevBlock);
        return true;
      }

      const blockSelection = getBlockSelectionBySide(blockElement, false);
      if (!blockSelection) {
        return;
      }
      const focus = pathToBlock(blockElement, blockSelection.path);
      if (!focus) {
        return;
      }

      const prevBlock = getPrevBlock(focus);

      if (!prevBlock || !ensureBlockInContainer(prevBlock, blockElement)) {
        return;
      }

      setBlockSelection(prevBlock);

      return true;
    },
    'Shift-ArrowDown': () => {
      if (!anchorSel) {
        anchorSel = getBlockSelectionBySide(blockElement, true);
      }

      if (!anchorSel) {
        return null;
      }

      const anchorBlock = pathToBlock(blockElement, anchorSel.path);
      if (!anchorBlock) {
        return null;
      }

      focusBlock = getNextBlock(focusBlock ?? anchorBlock);

      if (!focusBlock) {
        return;
      }

      if (!ensureBlockInContainer(focusBlock, blockElement)) {
        return;
      }

      selectBetween(anchorBlock, focusBlock, true);

      return true;
    },
    'Shift-ArrowUp': () => {
      if (!anchorSel) {
        anchorSel = getBlockSelectionBySide(blockElement, false);
      }

      if (!anchorSel) {
        return null;
      }

      const anchorBlock = pathToBlock(blockElement, anchorSel.path);
      if (!anchorBlock) {
        return null;
      }

      focusBlock = getPrevBlock(focusBlock ?? anchorBlock);

      if (!focusBlock) {
        return;
      }

      if (!ensureBlockInContainer(focusBlock, blockElement)) {
        return;
      }

      selectBetween(anchorBlock, focusBlock, false);

      return true;
    },
    Escape: () => {
      const blockSelection = getBlockSelectionBySide(blockElement, true);
      if (!blockSelection) {
        return;
      }
      const selection = blockElement.root.selectionManager;
      selection.update(selList => {
        return selList.filter(sel => !sel.is('block'));
      });
      return true;
    },
    Enter: () => {
      const blockSelection = getBlockSelectionBySide(blockElement, true);
      if (!blockSelection) {
        return;
      }
      const element = blockElement.root.viewStore.viewFromPath(
        'block',
        blockSelection.path
      );
      if (!element) {
        return;
      }

      const page = blockElement.page;
      const { model } = element;
      const parent = page.getParent(model);
      if (!parent) {
        return;
      }

      const index = parent.children.indexOf(model) ?? undefined;

      const blockId = page.addBlock('affine:paragraph', {}, parent, index + 1);

      const selection = element.root.selectionManager;
      const sel = selection.getInstance('text', {
        from: {
          path: element.parentPath.concat(blockId),
          index: 0,
          length: 0,
        },
        to: null,
      });
      selection.update(selList => {
        return selList.filter(sel => !sel.is('block')).concat(sel);
      });

      return true;
    },
  });
};
