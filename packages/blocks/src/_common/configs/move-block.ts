import type { BlockSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';

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

const pathToBlock = (blockElement: BlockElement, path: string[]) =>
  blockElement.host.view.viewFromPath('block', path);

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
      const page = blockElement.page;
      const textSelection = getTextSelection(blockElement);
      if (textSelection) {
        const currentModel = pathToBlock(blockElement, textSelection.from.path)
          ?.model;
        if (!currentModel) return;

        const previousSiblingModel = page.getPreviousSibling(currentModel);
        if (!previousSiblingModel) return;

        const parentModel = blockElement.page.getParent(previousSiblingModel);
        if (!parentModel) return;

        blockElement.page.moveBlocks(
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
        const currentModel = pathToBlock(blockElement, blockSelection.path)
          ?.model;
        if (!currentModel) return;

        const previousSiblingModel = page.getPreviousSibling(currentModel);
        if (!previousSiblingModel) return;

        const parentModel = page.getParent(previousSiblingModel);
        if (!parentModel) return;

        page.moveBlocks(
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
      const page = blockElement.page;
      const textSelection = getTextSelection(blockElement);
      if (textSelection) {
        const currentModel = pathToBlock(blockElement, textSelection.from.path)
          ?.model;
        if (!currentModel) return;

        const nextSiblingModel = page.getNextSibling(currentModel);
        if (!nextSiblingModel) return;

        const parentModel = page.getParent(nextSiblingModel);
        if (!parentModel) return;

        page.moveBlocks([currentModel], parentModel, nextSiblingModel, false);
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
        const currentModel = pathToBlock(blockElement, blockSelection.path)
          ?.model;
        if (!currentModel) return;

        const nextSiblingModel = page.getNextSibling(currentModel);
        if (!nextSiblingModel) return;

        const parentModel = page.getParent(nextSiblingModel);
        if (!parentModel) return;

        page.moveBlocks([currentModel], parentModel, nextSiblingModel, false);
        return true;
      }
      return;
    },
  },
];
