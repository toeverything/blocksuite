import type { BlockSelection } from '@blocksuite/block-std';
import { TextSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';

import { moveBlockConfigs } from '../_common/configs/move-block.js';
import { quickActionConfig } from '../_common/configs/quick-action/config.js';
import { textEditingConfigs } from '../_common/configs/text-editing.js';
import { getBlockElementByModel } from '../_legacy/utils/query.js';
import {
  getSelectedContentBlockElements,
  onModelElementUpdated,
  updateBlockElementType,
} from '../page-block/utils/index.js';
import {
  ensureBlockInContainer,
  getBlockSelectionBySide,
  moveCursorToNextBlockElement,
  moveCursorToPrevBlockElement,
  pathToBlock,
  selectBetween,
  setBlockSelection,
  setTextSelectionBySide,
} from './utils.js';

export function bindHotKey(blockElement: BlockElement) {
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
          next();
        })
        .try(cmd => [
          cmd
            .getTextSelection()
            .inline<'currentSelectionPath'>((ctx, next) => {
              const textSelection = ctx.currentTextSelection;
              assertExists(textSelection);
              const end = textSelection.to ?? textSelection.from;
              next({ currentSelectionPath: end.path });
            })
            .getNextBlock({
              filter: block => !!block.model.text,
            })
            .inline((ctx, next) => {
              assertExists(ctx.nextBlock);
              moveCursorToNextBlockElement(ctx.nextBlock);
              next();
            }),
          cmd
            .getBlockSelections()
            .inline<'currentSelectionPath'>((ctx, next) => {
              const currentBlockSelections = ctx.currentBlockSelections;
              assertExists(currentBlockSelections);
              const blockSelection = currentBlockSelections.at(-1);
              if (!blockSelection) {
                return;
              }
              next({ currentSelectionPath: blockSelection.path });
            })
            .getNextBlock()
            .inline((ctx, next) => {
              const { nextBlock } = ctx;
              assertExists(nextBlock);

              if (!ensureBlockInContainer(nextBlock, blockElement)) {
                return;
              }

              setBlockSelection(nextBlock);
              next();
            }),
        ])
        .run();
    },
    ArrowUp: () => {
      return root.std.command
        .pipe()
        .inline((_, next) => {
          reset();
          next();
        })
        .try(cmd => [
          cmd
            .getTextSelection()
            .inline<'currentSelectionPath'>((ctx, next) => {
              const textSelection = ctx.currentTextSelection;
              assertExists(textSelection);
              next({ currentSelectionPath: textSelection.from.path });
            })
            .getPrevBlock({
              filter: block => !!block.model.text,
            })
            .inline((ctx, next) => {
              assertExists(ctx.prevBlock);
              moveCursorToPrevBlockElement(ctx.prevBlock);
              next();
            }),

          cmd
            .getBlockSelections()
            .inline<'currentSelectionPath'>(async (ctx, next) => {
              const currentBlockSelections = ctx.currentBlockSelections;
              assertExists(currentBlockSelections);
              const blockSelection = currentBlockSelections.at(0);
              if (!blockSelection) {
                return;
              }
              return next({ currentSelectionPath: blockSelection.path });
            })
            .getPrevBlock()
            .inline((ctx, next) => {
              const { prevBlock } = ctx;
              assertExists(prevBlock);

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
          const textSelection = ctx.currentTextSelection;
          assertExists(textSelection);
          return next({ currentSelectionPath: textSelection.from.path });
        })
        .getPrevBlock({
          filter: block => !!block.model.text,
        })
        .inline((ctx, next) => {
          const prevBlock = ctx.prevBlock;
          assertExists(prevBlock);
          setTextSelectionBySide(prevBlock, true);
          return next();
        })
        .run();
    },
    ArrowRight: () => {
      return root.std.command
        .pipe()
        .inline((_, next) => {
          reset();
          next();
        })
        .getTextSelection()
        .inline<'currentSelectionPath'>((ctx, next) => {
          const textSelection = ctx.currentTextSelection;
          assertExists(textSelection);
          const end = textSelection.to ?? textSelection.from;
          next({ currentSelectionPath: end.path });
        })
        .getNextBlock({
          filter: block => !!block.model.text,
        })
        .inline((ctx, next) => {
          const nextBlock = ctx.nextBlock;
          assertExists(nextBlock);
          setTextSelectionBySide(nextBlock, false);
          next();
        })
        .run();
    },
    'Shift-ArrowDown': () => {
      let anchorBlock: BlockElement | null = null;
      return root.std.command
        .pipe()
        .getBlockSelections()
        .inline<'currentSelectionPath'>((ctx, next) => {
          const blockSelections = ctx.currentBlockSelections;
          assertExists(blockSelections);
          if (!anchorSel) {
            anchorSel = blockSelections.at(-1) ?? null;
          }
          if (!anchorSel) {
            return;
          }
          anchorBlock = pathToBlock(blockElement, anchorSel.path);
          if (!anchorBlock) {
            return;
          }
          next({
            currentSelectionPath: focusBlock?.path ?? anchorBlock?.path,
          });
        })
        .getNextBlock({})
        .inline((ctx, next) => {
          assertExists(ctx.nextBlock);
          focusBlock = ctx.nextBlock;
          if (!ensureBlockInContainer(focusBlock, blockElement)) {
            return;
          }
          if (!anchorBlock) {
            return;
          }
          selectBetween(anchorBlock, focusBlock, true);
          next();
        })
        .run();
    },
    'Shift-ArrowUp': () => {
      let anchorBlock: BlockElement | null = null;
      return root.std.command
        .pipe()
        .getBlockSelections()
        .inline<'currentSelectionPath'>((ctx, next) => {
          const blockSelections = ctx.currentBlockSelections;
          assertExists(blockSelections);
          if (!anchorSel) {
            anchorSel = blockSelections.at(0) ?? null;
          }
          if (!anchorSel) {
            return;
          }
          anchorBlock = pathToBlock(blockElement, anchorSel.path);
          if (!anchorBlock) {
            return;
          }
          return next({
            currentSelectionPath: focusBlock?.path ?? anchorBlock?.path,
          });
        })
        .getPrevBlock({})
        .inline((ctx, next) => {
          assertExists(ctx.prevBlock);
          focusBlock = ctx.prevBlock;
          if (!ensureBlockInContainer(focusBlock, blockElement)) {
            return;
          }
          if (!anchorBlock) {
            return;
          }
          selectBetween(anchorBlock, focusBlock, false);
          return next();
        })
        .run();
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

  quickActionConfig.forEach(config => {
    if (!config.hotkey) return;
    blockElement.bindHotKey({
      [config.hotkey]: ctx => {
        if (!config.showWhen(root)) return;

        ctx.get('defaultState').event.preventDefault();
        config.action(root);
      },
    });
  });

  textEditingConfigs.forEach(item => {
    if (!item.hotkey) return;

    item.hotkey.forEach(key => {
      blockElement.bindHotKey({
        [key]: ctx => {
          ctx.get('defaultState').event.preventDefault();

          const selected = getSelectedContentBlockElements(root, [
            'text',
            'block',
          ]);

          const newModels = updateBlockElementType(
            selected,
            item.flavour,
            item.type
          );

          if (item.flavour !== 'affine:code') {
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

  moveBlockConfigs.forEach(config => {
    config.hotkey.forEach(key => {
      blockElement.bindHotKey({
        [key]: context => {
          context.get('defaultState').event.preventDefault();
          return config.action(blockElement);
        },
      });
    });
  });
}
