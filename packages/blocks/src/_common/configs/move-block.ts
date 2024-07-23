import type { BlockSelection } from '@blocksuite/block-std';
import type { BlockComponent } from '@blocksuite/block-std';

import { assertExists } from '@blocksuite/global/utils';

const getSelection = (blockComponent: BlockComponent) =>
  blockComponent.host.selection;

function getBlockSelectionBySide(block: BlockComponent, tail: boolean) {
  const selection = getSelection(block);
  const selections = selection.filter('block');
  const sel = selections.at(tail ? -1 : 0) as BlockSelection | undefined;
  return sel ?? null;
}

function getTextSelection(block: BlockComponent) {
  const selection = getSelection(block);
  return selection.find('text');
}

const pathToBlock = (block: BlockComponent, blockId: string) =>
  block.host.view.getBlock(blockId);

interface MoveBlockConfig {
  name: string;
  hotkey: string[];
  action: (block: BlockComponent) => void;
}

export const moveBlockConfigs: MoveBlockConfig[] = [
  {
    name: 'Move Up',
    hotkey: ['Mod-Alt-ArrowUp', 'Mod-Shift-ArrowUp'],
    action: block => {
      const doc = block.doc;
      const textSelection = getTextSelection(block);
      if (textSelection) {
        const currentModel = pathToBlock(
          block,
          textSelection.from.blockId
        )?.model;
        if (!currentModel) return;

        const previousSiblingModel = doc.getPrev(currentModel);
        if (!previousSiblingModel) return;

        const parentModel = block.doc.getParent(previousSiblingModel);
        if (!parentModel) return;

        block.doc.moveBlocks(
          [currentModel],
          parentModel,
          previousSiblingModel,
          true
        );
        block.updateComplete
          .then(() => {
            const rangeManager = block.host.rangeManager;
            assertExists(rangeManager);
            rangeManager.syncTextSelectionToRange(textSelection);
          })
          .catch(console.error);
        return true;
      }
      const blockSelection = getBlockSelectionBySide(block, true);
      if (blockSelection) {
        const currentModel = pathToBlock(block, blockSelection.blockId)?.model;
        if (!currentModel) return;

        const previousSiblingModel = doc.getPrev(currentModel);
        if (!previousSiblingModel) return;

        const parentModel = doc.getParent(previousSiblingModel);
        if (!parentModel) return;

        doc.moveBlocks(
          [currentModel],
          parentModel,
          previousSiblingModel,
          false
        );
        return true;
      }
      return;
    },
  },
  {
    name: 'Move Down',
    hotkey: ['Mod-Alt-ArrowDown', 'Mod-Shift-ArrowDown'],
    action: block => {
      const doc = block.doc;
      const textSelection = getTextSelection(block);
      if (textSelection) {
        const currentModel = pathToBlock(
          block,
          textSelection.from.blockId
        )?.model;
        if (!currentModel) return;

        const nextSiblingModel = doc.getNext(currentModel);
        if (!nextSiblingModel) return;

        const parentModel = doc.getParent(nextSiblingModel);
        if (!parentModel) return;

        doc.moveBlocks([currentModel], parentModel, nextSiblingModel, false);
        block.updateComplete
          .then(() => {
            // `textSelection` will not change so we need wo sync it manually
            const rangeManager = block.host.rangeManager;
            assertExists(rangeManager);
            rangeManager.syncTextSelectionToRange(textSelection);
          })
          .catch(console.error);
        return true;
      }
      const blockSelection = getBlockSelectionBySide(block, true);
      if (blockSelection) {
        const currentModel = pathToBlock(block, blockSelection.blockId)?.model;
        if (!currentModel) return;

        const nextSiblingModel = doc.getNext(currentModel);
        if (!nextSiblingModel) return;

        const parentModel = doc.getParent(nextSiblingModel);
        if (!parentModel) return;

        doc.moveBlocks([currentModel], parentModel, nextSiblingModel, false);
        return true;
      }
      return;
    },
  },
];
