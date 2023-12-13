import type { BlockSelection, UIEventHandler } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import type { ReactiveController } from 'lit';
import type { ReactiveControllerHost } from 'lit';

import { moveBlockConfigs } from '../_common/configs/move-block.js';
import { quickActionConfig } from '../_common/configs/quick-action/config.js';
import { textConversionConfigs } from '../_common/configs/text-conversion.js';
import { getBlockComponentByModel } from '../_common/utils/index.js';
import { onModelElementUpdated } from '../page-block/utils/callback.js';
import { updateBlockElementType } from '../page-block/utils/operations/element/block-level.js';
import { ensureBlockInContainer } from './utils.js';

export class KeymapController implements ReactiveController {
  private _anchorSel: BlockSelection | null = null;
  private _focusBlock: BlockElement | null = null;

  host: ReactiveControllerHost & BlockElement;

  private get _std() {
    return this.host.std;
  }

  constructor(host: ReactiveControllerHost & BlockElement) {
    (this.host = host).addController(this);
  }

  hostConnected() {
    this._reset();
  }

  hostDisconnected() {
    this._reset();
  }

  private _reset = () => {
    this._anchorSel = null;
    this._focusBlock = null;
  };

  bind = () => {
    this.host.handleEvent('keyDown', ctx => {
      const state = ctx.get('keyboardState');
      if (state.raw.key === 'Shift') {
        return;
      }
      this._reset();
    });

    this.host.bindHotKey({
      ArrowDown: this._onArrowDown,
      ArrowUp: this._onArrowUp,
      ArrowLeft: this._onArrowLeft,
      ArrowRight: this._onArrowRight,
      'Shift-ArrowDown': this._onShiftArrowDown,
      'Shift-ArrowUp': this._onShiftArrowUp,
      'Shift-ArrowLeft': this._onShiftArrowLeft,
      'Shift-ArrowRight': this._onShiftArrowRight,
      Escape: this._onEsc,
      Enter: this._onEnter,
      'Mod-a': this._onSelectAll,
    });

    this._bindQuickActionHotKey();
    this._bindTextConversionHotKey();
    this._bindMoveBlockHotKey();
  };

  private _onArrowDown = () => {
    return this._std.command
      .pipe()
      .inline((_, next) => {
        this._reset();
        return next();
      })
      .try(cmd => [
        // text selection
        this._onTextDown(cmd),

        // block selection - select the next block
        this._onBlockDown(cmd),
      ])
      .run();
  };

  private _onTextDown = (cmd: BlockSuite.CommandChain) => {
    return cmd
      .getTextSelection()
      .inline<'currentSelectionPath' | 'focusBlock'>((ctx, next) => {
        const textSelection = ctx.currentTextSelection;
        assertExists(textSelection);
        const end = textSelection.end;
        return next({
          currentSelectionPath: end.path,
          focusBlock: ctx.std.view.viewFromPath('block', end.path),
        });
      })
      .try(cmd => [
        // text selection - case 1: move cursor down within the same block
        cmd.moveCursorVertically({ forward: false }),

        // text selection - case 2: move cursor down to the next block
        cmd
          .getNextBlock({
            filter: block => !!block.model.text,
          })
          .inline<'focusBlock'>((ctx, next) =>
            next({ focusBlock: ctx.nextBlock })
          )
          .moveCursorVertically({ forward: false }),

        // text selection - case 3: move cursor to the next block start
        cmd
          .getNextBlock({
            filter: block => !!block.model.text,
          })
          .inline<'focusBlock'>((ctx, next) =>
            next({ focusBlock: ctx.nextBlock })
          )
          .moveCursorToBlock({ tail: false }),

        // text selection - case 4: move cursor to the current block end
        cmd.moveCursorToBlock({ tail: true }),
      ]);
  };

  private _onBlockDown = (cmd: BlockSuite.CommandChain) => {
    return cmd
      .getBlockSelections()
      .inline<'currentSelectionPath'>((ctx, next) => {
        const currentBlockSelections = ctx.currentBlockSelections;
        assertExists(currentBlockSelections);
        const blockSelection = currentBlockSelections.at(-1);
        if (!blockSelection) {
          return;
        }
        return next({ currentSelectionPath: blockSelection.path });
      })
      .getNextBlock()
      .inline<'focusBlock'>((ctx, next) => {
        const { nextBlock } = ctx;
        assertExists(nextBlock);

        if (!ensureBlockInContainer(nextBlock, this.host)) {
          return;
        }

        return next({
          focusBlock: nextBlock,
        });
      })
      .selectBlock();
  };

  private _onArrowUp = () => {
    return this._std.command
      .pipe()
      .inline((_, next) => {
        this._reset();
        return next();
      })
      .try(cmd => [
        // text selection
        this._onTextUp(cmd),

        // block selection - select the previous block
        this._onBlockUp(cmd),
      ])
      .run();
  };

  private _onTextUp = (cmd: BlockSuite.CommandChain) => {
    return cmd
      .getTextSelection()
      .inline<'currentSelectionPath' | 'focusBlock'>((ctx, next) => {
        const textSelection = ctx.currentTextSelection;
        assertExists(textSelection);
        const end = textSelection.end;
        return next({
          currentSelectionPath: end.path,
          focusBlock: ctx.std.view.viewFromPath('block', end.path),
        });
      })
      .try(cmd => [
        // text selection - case 1: move cursor up within the same block
        cmd.moveCursorVertically({ forward: true }),

        // text selection - case 2: move cursor up to the previous block
        cmd
          .getPrevBlock({
            filter: block => !!block.model.text,
          })
          .inline<'focusBlock'>((ctx, next) =>
            next({ focusBlock: ctx.prevBlock })
          )
          .moveCursorVertically({ forward: true }),

        // text selection - case 3: move cursor to the previous block end
        cmd
          .getPrevBlock({
            filter: block => !!block.model.text,
          })
          .inline<'focusBlock'>((ctx, next) =>
            next({ focusBlock: ctx.prevBlock })
          )
          .moveCursorToBlock({ tail: true }),

        // text selection - case 4: move cursor to the current block start
        cmd.moveCursorToBlock({ tail: false }),
      ]);
  };

  private _onBlockUp = (cmd: BlockSuite.CommandChain) => {
    return cmd
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

        if (!ensureBlockInContainer(prevBlock, this.host)) {
          return;
        }

        return next({
          focusBlock: prevBlock,
        });
      })
      .selectBlock();
  };

  private _onArrowLeft = () => {
    return this._std.command
      .pipe()
      .inline((_, next) => {
        this._reset();
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
        return next({ focusBlock: ctx.prevBlock });
      })
      .selectBlockTextBySide({ tail: true })
      .run();
  };

  private _onArrowRight = () => {
    return this._std.command
      .pipe()
      .inline((_, next) => {
        this._reset();
        return next();
      })
      .getTextSelection()
      .inline<'currentSelectionPath'>((ctx, next) => {
        const textSelection = ctx.currentTextSelection;
        assertExists(textSelection);
        const end = textSelection.to ?? textSelection.from;
        return next({ currentSelectionPath: end.path });
      })
      .getNextBlock({
        filter: block => !!block.model.text,
      })
      .inline((ctx, next) => {
        return next({ focusBlock: ctx.nextBlock });
      })
      .selectBlockTextBySide({ tail: false })
      .run();
  };

  private _onShiftArrowDown = () => {
    return this._std.command
      .pipe()
      .try(cmd => [
        // text selection
        this._onTextShiftDown(cmd),

        // block selection
        this._onBlockShiftDown(cmd),
      ])
      .run();
  };

  private _onTextShiftDown = (cmd: BlockSuite.CommandChain) => {
    return cmd
      .getTextSelection()
      .inline<'currentSelectionPath' | 'focusBlock'>((ctx, next) => {
        const textSelection = ctx.currentTextSelection;
        assertExists(textSelection);
        const end = textSelection.end;
        return next({
          currentSelectionPath: end.path,
          focusBlock: ctx.std.view.viewFromPath('block', end.path),
        });
      })
      .try(cmd => [
        // text selection - case 1: change selection downwards within the same block
        cmd.changeTextSelectionVertically({ upward: false }),

        // text selection - case 2: change selection downwards to the next block
        cmd
          .getNextBlock({
            filter: block => !!block.model.text,
          })
          .inline((ctx, next) => {
            return next({ focusBlock: ctx.nextBlock });
          })
          .changeTextSelectionVertically({ upward: false }),

        // text selection - case 3: change selection downwards to the next block start
        cmd
          .getNextBlock({
            filter: block => !!block.model.text,
          })
          .inline((ctx, next) => {
            return next({ focusBlock: ctx.nextBlock });
          })
          .changeTextSelectionToBlockStartEnd({ tail: false }),

        // text selection - case 4: change selection to the current block end
        cmd.changeTextSelectionToBlockStartEnd({ tail: true }),
      ])
      .inline((ctx, next) => {
        const { focusBlock } = ctx;
        this._focusBlock = focusBlock ?? null;
        return next();
      });
  };

  private _onBlockShiftDown = (cmd: BlockSuite.CommandChain) => {
    return cmd
      .getBlockSelections()
      .inline<'currentSelectionPath' | 'anchorBlock'>((ctx, next) => {
        const blockSelections = ctx.currentBlockSelections;
        assertExists(blockSelections);
        if (!this._anchorSel) {
          this._anchorSel = blockSelections.at(-1) ?? null;
        }
        if (!this._anchorSel) {
          return;
        }

        const anchorBlock = ctx.std.view.viewFromPath(
          'block',
          this._anchorSel.path
        );
        if (!anchorBlock) {
          return;
        }
        return next({
          anchorBlock,
          currentSelectionPath: this._focusBlock?.path ?? anchorBlock?.path,
        });
      })
      .getNextBlock({})
      .inline<'focusBlock'>((ctx, next) => {
        assertExists(ctx.nextBlock);
        this._focusBlock = ctx.nextBlock;
        if (!ensureBlockInContainer(this._focusBlock, this.host)) {
          return;
        }
        return next({
          focusBlock: this._focusBlock,
        });
      })
      .selectBlocksBetween({ tail: true });
  };

  private _onShiftArrowUp = () => {
    return this._std.command
      .pipe()
      .try(cmd => [
        // text selection
        this._onTextShiftUp(cmd),

        // block selection
        this._onBlockShiftUp(cmd),
      ])
      .run();
  };

  private _onTextShiftUp = (cmd: BlockSuite.CommandChain) => {
    return cmd
      .getTextSelection()
      .inline<'currentSelectionPath' | 'focusBlock'>((ctx, next) => {
        const textSelection = ctx.currentTextSelection;
        assertExists(textSelection);
        const end = textSelection.end;
        return next({
          currentSelectionPath: end.path,
          focusBlock: ctx.std.view.viewFromPath('block', end.path),
        });
      })
      .try(cmd => [
        // text selection - case 1: change selection upwards within the same block
        cmd.changeTextSelectionVertically({ upward: true }),
        // text selection - case 2: change selection upwards to the previous block
        cmd
          .getPrevBlock({
            filter: block => !!block.model.text,
          })
          .inline((ctx, next) => {
            return next({ focusBlock: ctx.prevBlock });
          })
          .changeTextSelectionVertically({ upward: true }),
        // text selection - case 3: change selection upwards to the previous block end
        cmd
          .getPrevBlock({
            filter: block => !!block.model.text,
          })
          .inline((ctx, next) => {
            return next({ focusBlock: ctx.prevBlock });
          })
          .changeTextSelectionToBlockStartEnd({ tail: true }),
        // text selection - case 4: change selection to the current block start
        cmd.changeTextSelectionToBlockStartEnd({ tail: false }),
      ])
      .inline((ctx, next) => {
        const { focusBlock } = ctx;
        this._focusBlock = focusBlock ?? null;
        return next();
      });
  };

  private _onBlockShiftUp = (cmd: BlockSuite.CommandChain) => {
    return cmd
      .getBlockSelections()
      .inline<'currentSelectionPath' | 'anchorBlock'>((ctx, next) => {
        const blockSelections = ctx.currentBlockSelections;
        assertExists(blockSelections);
        if (!this._anchorSel) {
          this._anchorSel = blockSelections.at(0) ?? null;
        }
        if (!this._anchorSel) {
          return;
        }
        const anchorBlock = ctx.std.view.viewFromPath(
          'block',
          this._anchorSel.path
        );
        if (!anchorBlock) {
          return;
        }
        return next({
          anchorBlock,
          currentSelectionPath: this._focusBlock?.path ?? anchorBlock?.path,
        });
      })
      .getPrevBlock({})
      .inline((ctx, next) => {
        assertExists(ctx.prevBlock);
        this._focusBlock = ctx.prevBlock;
        if (!ensureBlockInContainer(this._focusBlock, this.host)) {
          return;
        }
        return next({
          focusBlock: this._focusBlock,
        });
      })
      .selectBlocksBetween({ tail: false });
  };

  private _onShiftArrowRight = () => {
    return this._std.command
      .pipe()
      .getTextSelection()
      .inline<'currentSelectionPath' | 'focusBlock'>((ctx, next) => {
        const textSelection = ctx.currentTextSelection;
        assertExists(textSelection);
        const end = textSelection.end;
        return next({
          currentSelectionPath: end.path,
          focusBlock: ctx.std.view.viewFromPath('block', end.path),
        });
      })
      .try(cmd => [
        // text selection - case 1: change selection towards right within the same block
        cmd.changeTextSelectionSideways({ left: false }),

        // text selection - case 2: change selection towards right to the next block
        cmd
          .getNextBlock({
            filter: block => !!block.model.text,
          })
          .inline<'focusBlock'>((ctx, next) => {
            return next({ focusBlock: ctx.nextBlock });
          })
          .changeTextSelectionSidewaysToBlock({ left: false }),
      ])
      .inline((ctx, next) => {
        const { focusBlock } = ctx;
        this._focusBlock = focusBlock ?? null;
        return next();
      })
      .run();
  };

  private _onShiftArrowLeft = () => {
    return this._std.command
      .pipe()
      .getTextSelection()
      .inline<'currentSelectionPath' | 'focusBlock'>((ctx, next) => {
        const textSelection = ctx.currentTextSelection;
        assertExists(textSelection);
        const end = textSelection.end;
        return next({
          currentSelectionPath: end.path,
          focusBlock: ctx.std.view.viewFromPath('block', end.path),
        });
      })
      .try(cmd => [
        // text selection - case 1: change selection towards left within the same block
        cmd.changeTextSelectionSideways({ left: true }),
        // text selection - case 2: change selection towards left to the next block
        cmd
          .getPrevBlock({
            filter: block => !!block.model.text,
          })
          .inline<'focusBlock'>((ctx, next) => {
            return next({ focusBlock: ctx.prevBlock });
          })
          .changeTextSelectionSidewaysToBlock({ left: true }),
      ])
      .inline((ctx, next) => {
        const { focusBlock } = ctx;
        this._focusBlock = focusBlock ?? null;
        return next();
      })
      .run();
  };

  private _onEsc = () => {
    return this._std.command
      .pipe()
      .getBlockSelections()
      .inline((ctx, next) => {
        const blockSelection = ctx.currentBlockSelections?.at(-1);
        if (!blockSelection) {
          return;
        }

        ctx.std.selection.update(selList => {
          return selList.filter(sel => !sel.is('block'));
        });

        return next();
      })
      .run();
  };

  private _onEnter = () => {
    return this._std.command
      .pipe()
      .getBlockSelections()
      .inline((ctx, next) => {
        const blockSelection = ctx.currentBlockSelections?.at(-1);
        if (!blockSelection) {
          return;
        }

        const { view, page, selection } = ctx.std;

        const element = view.viewFromPath('block', blockSelection.path);
        if (!element) {
          return;
        }

        const { model } = element;
        const parent = page.getParent(model);
        if (!parent) {
          return;
        }

        const index = parent.children.indexOf(model) ?? undefined;

        const blockId = page.addBlock(
          'affine:paragraph',
          {},
          parent,
          index + 1
        );

        const sel = selection.getInstance('text', {
          from: {
            path: element.parentPath.concat(blockId),
            index: 0,
            length: 0,
          },
          to: null,
        });

        selection.setGroup('note', [sel]);

        return next();
      })
      .run();
  };

  private _onSelectAll: UIEventHandler = ctx => {
    ctx.get('defaultState').event.preventDefault();
    const view = this._std.view;
    const selection = this._std.selection;
    if (!selection.find('block')) {
      return;
    }
    const blocks: BlockSelection[] = [];
    view.walkThrough(nodeView => {
      if (
        nodeView.type === 'block' &&
        // Remove children blocks, only select the most top level blocks.
        !blocks
          .map(b => b.path)
          .reduce(
            (acc, cur) =>
              // check whether cur is a sub list of nodeView.path
              acc || cur.every(path => nodeView.path.includes(path)),
            false
          )
      ) {
        blocks.push(
          selection.getInstance('block', {
            path: nodeView.path,
          })
        );
      }
      return null;
    }, this.host.path);
    selection.update(selList => {
      return selList.filter(sel => !sel.is('block')).concat(blocks);
    });
  };

  private _bindQuickActionHotKey = () => {
    quickActionConfig.forEach(config => {
      if (!config.hotkey) return;
      this.host.bindHotKey({
        [config.hotkey]: ctx => {
          if (!config.showWhen(this.host.host)) return;

          ctx.get('defaultState').event.preventDefault();
          config.action(this.host.host);
        },
      });
    });
  };

  private _bindTextConversionHotKey = () => {
    textConversionConfigs.forEach(item => {
      if (!item.hotkey) return;

      item.hotkey.forEach(key => {
        this.host.bindHotKey({
          [key]: ctx => {
            ctx.get('defaultState').event.preventDefault();

            return this._std.command
              .pipe()
              .withHost()
              .tryAll(chain => [
                chain.getTextSelection(),
                chain.getBlockSelections(),
              ])
              .getSelectedBlocks({
                types: ['text', 'block'],
              })
              .inline((ctx, next) => {
                const { selectedBlocks } = ctx;
                assertExists(selectedBlocks);

                const newModels = updateBlockElementType(
                  selectedBlocks,
                  item.flavour,
                  item.type
                );

                if (item.flavour !== 'affine:code') {
                  return;
                }

                const [codeModel] = newModels;
                onModelElementUpdated(codeModel, () => {
                  const codeElement = getBlockComponentByModel(codeModel);
                  assertExists(codeElement);
                  this._std.selection.setGroup('note', [
                    this._std.selection.getInstance('text', {
                      from: {
                        path: codeElement.path,
                        index: 0,
                        length: codeModel.text?.length ?? 0,
                      },
                      to: null,
                    }),
                  ]);
                });

                next();
              })
              .run();
          },
        });
      });
    });
  };

  private _bindMoveBlockHotKey = () => {
    moveBlockConfigs.forEach(config => {
      config.hotkey.forEach(key => {
        this.host.bindHotKey({
          [key]: ctx => {
            ctx.get('defaultState').event.preventDefault();
            return config.action(this.host);
          },
        });
      });
    });
  };
}
