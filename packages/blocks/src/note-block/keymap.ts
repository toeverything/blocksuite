import type { BlockSelection } from '@blocksuite/block-std';
import { TextSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';

import { getBlockElementByModel } from '../__internal__/utils/query.js';
import { actionConfig } from '../page-block/const/action-config.js';
import { moveBlockConfig } from '../page-block/const/move-block-config.js';
import { paragraphConfig } from '../page-block/const/paragraph-config.js';
import type { PageBlockComponent } from '../page-block/types.js';
import {
  getSelectedContentBlockElements,
  onModelElementUpdated,
  updateBlockElementType,
} from '../page-block/utils/index.js';
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
  setTextSelectionBySide,
} from './utils.js';

export const bindHotKey = (blockElement: BlockElement) => {
  let anchorSel: BlockSelection | null = null;
  let focusBlock: BlockElement | null = null;
  let composition = false;
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
  blockElement.handleEvent('compositionStart', () => {
    composition = true;
  });
  blockElement.handleEvent('compositionEnd', () => {
    composition = false;
  });
  blockElement.bindHotKey({
    ArrowDown: () => {
      reset();

      if (composition) {
        return true;
      }

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

      if (composition) {
        return true;
      }

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
    ArrowLeft: () => {
      reset();

      if (composition) {
        return true;
      }

      const textSelection = getTextSelection(blockElement);
      if (!textSelection) {
        return;
      }

      const start = textSelection.from;
      const block = pathToBlock(blockElement, start.path);
      if (!block) {
        return;
      }
      const prevBlock = getPrevBlock(block, block => !!block.model.text);
      if (!prevBlock) {
        return;
      }

      setTextSelectionBySide(prevBlock, true);

      return true;
    },
    ArrowRight: () => {
      reset();

      if (composition) {
        return true;
      }

      const textSelection = getTextSelection(blockElement);
      if (!textSelection) {
        return;
      }

      const start = textSelection.to ?? textSelection.from;
      const block = pathToBlock(blockElement, start.path);
      if (!block) {
        return;
      }
      const nextBlock = getNextBlock(block, block => !!block.model.text);
      if (!nextBlock) {
        return;
      }

      setTextSelectionBySide(nextBlock, false);

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
    'Mod-a': ctx => {
      ctx.get('defaultState').event.preventDefault();
      const view = blockElement.root.viewStore;
      const selection = blockElement.root.selectionManager;
      const blocks: BlockSelection[] = [];
      view.walkThrough(nodeView => {
        if (nodeView.type === 'block') {
          blocks.push(
            selection.getInstance('block', {
              path: nodeView.path,
            })
          );
        }
        return null;
      }, blockElement.path);
      selection.update(selList => {
        return selList.filter(sel => !sel.is('block')).concat(blocks);
      });
    },
  });

  actionConfig.forEach(config => {
    if (!config.hotkey) return;
    blockElement.bindHotKey({
      [config.hotkey]: ctx => {
        const pageElement = blockElement.closest<PageBlockComponent>(
          'affine-doc-page,affine-edgeless-page'
        );
        if (!pageElement) return;

        if (!config.showWhen(pageElement)) return;

        ctx.get('defaultState').event.preventDefault();
        config.action(pageElement);
      },
    });
  });

  paragraphConfig.forEach(config => {
    if (!config.hotkey) {
      return;
    }

    config.hotkey.forEach(key => {
      blockElement.bindHotKey({
        [key]: ctx => {
          const selectionManager = blockElement.root.selectionManager;

          ctx.get('defaultState').event.preventDefault();

          const selected = getSelectedContentBlockElements(blockElement, [
            'text',
            'block',
          ]);

          const newModels = updateBlockElementType(
            selected,
            config.flavour,
            config.type
          );

          if (config.flavour !== 'affine:code') {
            return;
          }

          const [codeModel] = newModels;
          onModelElementUpdated(codeModel, () => {
            const codeElement = getBlockElementByModel(codeModel);
            assertExists(codeElement);
            selectionManager.setGroup('note', [
              new TextSelection({
                from: {
                  path: codeElement.path,
                  index: 0,
                  length: codeModel.text?.length ?? 0,
                },
                to: null,
              }),
            ]);
          });

          return true;
        },
      });
    });
  });

  moveBlockConfig.forEach(config => {
    config.hotkey.forEach(key => {
      blockElement.bindHotKey({
        [key]: context => {
          context.get('defaultState').event.preventDefault();
          return config.action(blockElement);
        },
      });
    });
  });
};
