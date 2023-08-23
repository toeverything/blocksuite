import type { BlockElement } from '@blocksuite/lit';

import {
  getBlockSelectionBySide,
  getNextBlock,
  getPrevBlock,
  getTextSelection,
  pathToBlock,
} from '../../note-block/utils.js';

interface MoveBlockConfig {
  name: string;
  hotkey: string[];
  action: (blockElement: BlockElement) => void;
}

export const moveBlockConfig: MoveBlockConfig[] = [
  {
    name: 'Move Up',
    hotkey: ['Mod-Alt-ArrowUp', 'Mod-Shift-ArrowUp'],
    action: blockElement => {
      const textSelection = getTextSelection(blockElement);
      if (textSelection) {
        const block = pathToBlock(blockElement, textSelection.from.path);
        if (!block) return;
        const prevBlock = getPrevBlock(block, block => !!block.model.text);
        if (!prevBlock) return;
        const parent = blockElement.page.getParent(prevBlock.model);
        if (!parent) return;
        blockElement.page.moveBlocks(
          [block.model],
          parent,
          prevBlock.model,
          true
        );
        return true;
      }
      const blockSelection = getBlockSelectionBySide(blockElement, true);
      if (blockSelection) {
        const block = pathToBlock(blockElement, blockSelection.path);
        if (!block) return;
        const prevBlock = getPrevBlock(block);
        if (!prevBlock) return;
        const parent = blockElement.page.getParent(prevBlock.model);
        if (!parent || parent.flavour === 'affine:page') return;
        blockElement.page.moveBlocks(
          [block.model],
          parent,
          prevBlock.model,
          true
        );
        return true;
      }
      return;
    },
  },
  {
    name: 'Move Down',
    hotkey: ['Mod-Alt-ArrowDown', 'Mod-Shift-ArrowDown'],
    action: blockElement => {
      const textSelection = getTextSelection(blockElement);
      if (textSelection) {
        const block = pathToBlock(blockElement, textSelection.from.path);
        if (!block) return;
        const nextBlock = getNextBlock(block, block => !!block.model.text);
        if (!nextBlock) return;
        const parent = blockElement.page.getParent(nextBlock.model);
        if (!parent) return;
        blockElement.page.moveBlocks(
          [block.model],
          parent,
          nextBlock.model,
          false
        );
        return true;
      }
      const blockSelection = getBlockSelectionBySide(blockElement, true);
      if (blockSelection) {
        const block = pathToBlock(blockElement, blockSelection.path);
        if (!block) return;
        const nextBlock = getNextBlock(block);
        if (!nextBlock) return;
        const parent = blockElement.page.getParent(nextBlock.model);
        if (!parent) return;
        blockElement.page.moveBlocks(
          [block.model],
          parent,
          nextBlock.model,
          false
        );
        return true;
      }
      return;
    },
  },
];
