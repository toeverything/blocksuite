import type { BlockSelection } from '@blocksuite/block-std';
import { TextSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';

import { getBlockElementByModel } from '../__internal__/utils/query.js';
import { actionConfig } from '../common/actions/action-config.js';
import { moveBlockConfig } from '../common/move-block-config.js';
import { paragraphConfig } from '../common/paragraph-config.js';
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
  moveCursorToNextBlockElement,
  moveCursorToPrevBlockElement,
  pathToBlock,
  selectBetween,
  setBlockSelection,
  setTextSelectionBySide,
} from './utils.js';

export const bindHotKey = (blockElement: BlockElement) => {
  const root = blockElement.root;
  const selectionManager = blockElement.root.selection;

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
      return root.std.command
        .pipe()
        .inline((_, next) => {
          reset();
          return next();
        })
        .try<'textSelection' | 'blockSelections'>(cmd => [
          cmd
            .getTextSelection()
            .inline<'currentSelectionPath'>(async (ctx, next) => {
              const textSelection = ctx.textSelection;
              const end = textSelection.to ?? textSelection.from;
              return next({ currentSelectionPath: end.path });
            })
            .getNextBlock({
              filter: block => !!block.model.text,
            })
            .inline((ctx, next) => {
              moveCursorToNextBlockElement(ctx.nextBlock);
              return next();
            }),

          cmd
            .getBlockSelections()
            .inline<'currentSelectionPath'>(async (ctx, next) => {
              const blockSelection = ctx.blockSelections.at(-1);
              if (!blockSelection) {
                return;
              }
              return next({ currentSelectionPath: blockSelection.path });
            })
            .getNextBlock({})
            .inline((ctx, next) => {
              const { nextBlock } = ctx;

              if (!ensureBlockInContainer(nextBlock, blockElement)) {
                return;
              }

              setBlockSelection(nextBlock);
              return next();
            }),
        ])
        .run();
    },
    ArrowUp: () => {
      return root.std.command
        .pipe()
        .inline((_, next) => {
          reset();
          return next();
        })
        .try<'textSelection' | 'blockSelections'>(cmd => [
          cmd
            .getTextSelection()
            .inline<'currentSelectionPath'>(async (ctx, next) => {
              const textSelection = ctx.textSelection;
              return next({ currentSelectionPath: textSelection.from.path });
            })
            .getPrevBlock({
              filter: block => !!block.model.text,
            })
            .inline((ctx, next) => {
              moveCursorToPrevBlockElement(ctx.prevBlock);
              return next();
            }),

          cmd
            .getBlockSelections()
            .inline<'currentSelectionPath'>(async (ctx, next) => {
              const blockSelection = ctx.blockSelections.at(0);
              if (!blockSelection) {
                return;
              }
              return next({ currentSelectionPath: blockSelection.path });
            })
            .getPrevBlock({})
            .inline((ctx, next) => {
              const { prevBlock } = ctx;

              if (!ensureBlockInContainer(prevBlock, blockElement)) {
                return;
              }

              setBlockSelection(prevBlock);
              return next();
            }),
        ])
        .run();
    },
    ArrowLeft: () => {
      return root.std.command
        .pipe()
        .inline((_, next) => {
          reset();
          return next();
        })
        .getTextSelection()
        .inline<'currentSelectionPath'>(async (ctx, next) => {
          const textSelection = ctx.textSelection;
          return next({ currentSelectionPath: textSelection.from.path });
        })
        .getPrevBlock({
          filter: block => !!block.model.text,
        })
        .inline((ctx, next) => {
          setTextSelectionBySide(ctx.prevBlock, true);
          return next();
        })
        .run();
    },
    ArrowRight: () => {
      return root.std.command
        .pipe()
        .inline((_, next) => {
          reset();
          return next();
        })
        .getTextSelection()
        .inline<'currentSelectionPath'>(async (ctx, next) => {
          const textSelection = ctx.textSelection;
          const end = textSelection.to ?? textSelection.from;
          return next({ currentSelectionPath: end.path });
        })
        .getNextBlock({
          filter: block => !!block.model.text,
        })
        .inline((ctx, next) => {
          setTextSelectionBySide(ctx.nextBlock, false);
          return next();
        })
        .run();
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
      const selection = blockElement.root.selection;
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
      const element = blockElement.root.view.viewFromPath(
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

      const selection = element.root.selection;
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
      const view = blockElement.root.view;
      const selection = blockElement.root.selection;
      if (!selection.find('block')) {
        return;
      }
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
        if (!config.showWhen(root)) return;

        ctx.get('defaultState').event.preventDefault();
        config.action(root);
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
          ctx.get('defaultState').event.preventDefault();

          const selected = getSelectedContentBlockElements(root, [
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
