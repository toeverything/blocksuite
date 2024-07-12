import type { BlockSelection } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/block-std';

import { assertExists } from '@blocksuite/global/utils';

const getSelection = (blockComponent: BlockElement) =>
  blockComponent.host.selection;

function getBlockSelectionBySide(blockElement: BlockElement, tail: boolean) {
  const selection = getSelection(blockElement);
  const selections = selection.filter('block');
  const sel = selections.at(tail ? -1 : 0) as BlockSelection | undefined;
  return sel ?? null;
}

function getTextSelection(blockElement: BlockElement) {
  const selection = getSelection(blockElement);
  return selection.find('text');
}

const pathToBlock = (blockElement: BlockElement, blockId: string) =>
  blockElement.host.view.getBlock(blockId);

interface MoveBlockConfig {
  name: string;
  hotkey: string[];
  action: (blockElement: BlockElement) => void;
}

export const moveBlockConfigs: MoveBlockConfig[] = [
  {
    name: 'Move Up',
    hotkey: ['Mod-Alt-ArrowUp', 'Mod-Shift-ArrowUp'],
    action: blockElement => {
      const doc = blockElement.doc;
      const textSelection = getTextSelection(blockElement);
      if (textSelection) {
        const currentModel = pathToBlock(
          blockElement,
          textSelection.from.blockId
        )?.model;
        if (!currentModel) return;

        const previousSiblingModel = doc.getPrev(currentModel);
        if (!previousSiblingModel) return;

        const parentModel = blockElement.doc.getParent(previousSiblingModel);
        if (!parentModel) return;

        blockElement.doc.moveBlocks(
          [currentModel],
          parentModel,
          previousSiblingModel,
          true
        );
        blockElement.updateComplete
          .then(() => {
            const rangeManager = blockElement.host.rangeManager;
            assertExists(rangeManager);
            rangeManager.syncTextSelectionToRange(textSelection);
          })
          .catch(console.error);
        return true;
      }
      const blockSelection = getBlockSelectionBySide(blockElement, true);
      if (blockSelection) {
        const currentModel = pathToBlock(
          blockElement,
          blockSelection.blockId
        )?.model;
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
    action: blockElement => {
      const doc = blockElement.doc;
      const textSelection = getTextSelection(blockElement);
      if (textSelection) {
        const currentModel = pathToBlock(
          blockElement,
          textSelection.from.blockId
        )?.model;
        if (!currentModel) return;

        const nextSiblingModel = doc.getNext(currentModel);
        if (!nextSiblingModel) return;

        const parentModel = doc.getParent(nextSiblingModel);
        if (!parentModel) return;

        doc.moveBlocks([currentModel], parentModel, nextSiblingModel, false);
        blockElement.updateComplete
          .then(() => {
            // `textSelection` will not change so we need wo sync it manually
            const rangeManager = blockElement.host.rangeManager;
            assertExists(rangeManager);
            rangeManager.syncTextSelectionToRange(textSelection);
          })
          .catch(console.error);
        return true;
      }
      const blockSelection = getBlockSelectionBySide(blockElement, true);
      if (blockSelection) {
        const currentModel = pathToBlock(
          blockElement,
          blockSelection.blockId
        )?.model;
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
