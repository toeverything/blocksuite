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
        moveCursorToNextBlockElement(blockElement, nextBlock);
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
        moveCursorToPrevBlockElement(blockElement, prevBlock);
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
  });
};
