import type {
  BaseSelection,
  BlockSelection,
  UIEventHandler,
  UIEventStateContext,
} from '@blocksuite/block-std';
import type { BlockComponent } from '@blocksuite/block-std';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

import { assertExists } from '@blocksuite/global/utils';

import { moveBlockConfigs } from '../_common/configs/move-block.js';
import { quickActionConfig } from '../_common/configs/quick-action/config.js';
import { textConversionConfigs } from '../_common/configs/text-conversion.js';
import { matchFlavours } from '../_common/utils/index.js';
import { onModelElementUpdated } from '../root-block/utils/callback.js';
import { ensureBlockInContainer } from './utils.js';

export class KeymapController implements ReactiveController {
  private _anchorSel: BlockSelection | null = null;

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

            const [result] = this._std.command
              .chain()
              .updateBlockType({
                flavour: item.flavour,
                props: {
                  type: item.type,
                },
              })
              .inline((ctx, next) => {
                const newModels = ctx.updatedBlocks;
                const host = ctx.std.host;
                if (!host || !newModels) {
                  return;
                }

                if (item.flavour !== 'affine:code') {
                  return;
                }

                const [codeModel] = newModels;
                onModelElementUpdated(host, codeModel, codeElement => {
                  this._std.selection.setGroup('note', [
                    this._std.selection.create('text', {
                      from: {
                        blockId: codeElement.blockId,
                        index: 0,
                        length: codeModel.text?.length ?? 0,
                      },
                      to: null,
                    }),
                  ]);
                }).catch(console.error);

                next();
              })
              .run();

            return result;
          },
        });
      });
    });
  };

  private _focusBlock: BlockComponent | null = null;

  private _onArrowDown = (ctx: UIEventStateContext) => {
    const event = ctx.get('defaultState').event;

    const [result] = this._std.command
      .chain()
      .inline((_, next) => {
        this._reset();
        return next();
      })
      .try(cmd => [
        // text selection - select the next block
        // 1. is paragraph, list, code block - follow the default behavior
        // 2. is not - select the next block (use block selection instead of text selection)
        cmd
          .getTextSelection()
          .inline<'currentSelectionPath'>((ctx, next) => {
            const currentTextSelection = ctx.currentTextSelection;
            assertExists(currentTextSelection);
            return next({ currentSelectionPath: currentTextSelection.blockId });
          })
          .getNextBlock()
          .inline((ctx, next) => {
            const { nextBlock } = ctx;

            if (!nextBlock) {
              return;
            }

            if (
              !matchFlavours(nextBlock.model, [
                'affine:paragraph',
                'affine:list',
                'affine:code',
              ])
            ) {
              this._std.command
                .chain()
                .with({
                  focusBlock: nextBlock,
                })
                .selectBlock()
                .run();
            }

            return next({});
          }),

        // block selection - select the next block
        // 1. is paragraph, list, code block - focus it
        // 2. is not - select it using block selection
        cmd
          .getBlockSelections()
          .inline<'currentSelectionPath'>((ctx, next) => {
            const currentBlockSelections = ctx.currentBlockSelections;
            assertExists(currentBlockSelections);
            const blockSelection = currentBlockSelections.at(-1);
            if (!blockSelection) {
              return;
            }
            return next({ currentSelectionPath: blockSelection.blockId });
          })
          .getNextBlock()
          .inline<'focusBlock'>((ctx, next) => {
            const { nextBlock } = ctx;
            assertExists(nextBlock);

            event.preventDefault();
            if (
              matchFlavours(nextBlock.model, [
                'affine:paragraph',
                'affine:list',
                'affine:code',
              ])
            ) {
              this._std.command
                .chain()
                .focusBlockStart({ focusBlock: nextBlock })
                .run();
              return next();
            }

            this._std.command
              .chain()
              .with({ focusBlock: nextBlock })
              .selectBlock()
              .run();
            return next();
          }),
      ])
      .run();

    return result;
  };

  private _onArrowUp = (ctx: UIEventStateContext) => {
    const event = ctx.get('defaultState').event;

    const [result] = this._std.command
      .chain()
      .inline((_, next) => {
        this._reset();
        return next();
      })
      .try(cmd => [
        // text selection - select the previous block
        // 1. is paragraph, list, code block - follow the default behavior
        // 2. is not - select the previous block (use block selection instead of text selection)
        cmd
          .getTextSelection()
          .inline<'currentSelectionPath'>((ctx, next) => {
            const currentTextSelection = ctx.currentTextSelection;
            assertExists(currentTextSelection);
            return next({ currentSelectionPath: currentTextSelection.blockId });
          })
          .getPrevBlock()
          .inline((ctx, next) => {
            const { prevBlock } = ctx;

            if (!prevBlock) {
              return;
            }

            if (
              !matchFlavours(prevBlock.model, [
                'affine:paragraph',
                'affine:list',
                'affine:code',
              ])
            ) {
              this._std.command
                .chain()
                .with({
                  focusBlock: prevBlock,
                })
                .selectBlock()
                .run();
            }

            return next({});
          }),
        // block selection - select the previous block
        // 1. is paragraph, list, code block - focus it
        // 2. is not - select it using block selection
        cmd
          .getBlockSelections()
          .inline<'currentSelectionPath'>((ctx, next) => {
            const currentBlockSelections = ctx.currentBlockSelections;
            assertExists(currentBlockSelections);
            const blockSelection = currentBlockSelections.at(-1);
            if (!blockSelection) {
              return;
            }
            return next({ currentSelectionPath: blockSelection.blockId });
          })
          .getPrevBlock()
          .inline<'focusBlock'>((ctx, next) => {
            const { prevBlock } = ctx;
            assertExists(prevBlock);

            if (
              matchFlavours(prevBlock.model, [
                'affine:paragraph',
                'affine:list',
                'affine:code',
              ])
            ) {
              event.preventDefault();
              this._std.command
                .chain()
                .focusBlockEnd({ focusBlock: prevBlock })
                .run();
              return next();
            }

            this._std.command
              .chain()
              .with({ focusBlock: prevBlock })
              .selectBlock()
              .run();
            return next();
          }),
      ])
      .run();

    return result;
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

        const anchorBlock = ctx.std.view.getBlock(this._anchorSel.blockId);
        if (!anchorBlock) {
          return;
        }
        return next({
          anchorBlock,
          currentSelectionPath:
            this._focusBlock?.blockId ?? anchorBlock?.blockId,
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
        const anchorBlock = ctx.std.view.getBlock(this._anchorSel.blockId);
        if (!anchorBlock) {
          return;
        }
        return next({
          anchorBlock,
          currentSelectionPath:
            this._focusBlock?.blockId ?? anchorBlock?.blockId,
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

  private _onEnter = (ctx: UIEventStateContext) => {
    const event = ctx.get('defaultState').event;
    const [result] = this._std.command
      .chain()
      .getBlockSelections()
      .inline((ctx, next) => {
        const blockSelection = ctx.currentBlockSelections?.at(-1);
        if (!blockSelection) {
          return;
        }

        const { view, doc, selection } = ctx.std;

        const element = view.getBlock(blockSelection.blockId);
        if (!element) {
          return;
        }

        const { model } = element;
        const parent = doc.getParent(model);
        if (!parent) {
          return;
        }

        const index = parent.children.indexOf(model) ?? undefined;

        const blockId = doc.addBlock('affine:paragraph', {}, parent, index + 1);

        const sel = selection.create('text', {
          from: {
            blockId,
            index: 0,
            length: 0,
          },
          to: null,
        });

        event.preventDefault();
        selection.setGroup('note', [sel]);

        return next();
      })
      .run();

    return result;
  };

  private _onEsc = () => {
    const [result] = this._std.command
      .chain()
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

    return result;
  };

  private _onSelectAll: UIEventHandler = ctx => {
    ctx.get('defaultState').event.preventDefault();
    const selection = this._std.selection;
    // eslint-disable-next-line unicorn/prefer-array-some
    if (!selection.find('block')) {
      return;
    }
    const children = this.host.model.children;
    const blocks: BlockSelection[] = children.map(child => {
      return selection.create('block', {
        blockId: child.id,
      });
    });
    selection.update(selList => {
      return selList
        .filter<BaseSelection>(sel => !sel.is('block'))
        .concat(blocks);
    });
  };

  private _onShiftArrowDown = () => {
    const [result] = this._std.command
      .chain()
      .try(cmd => [
        // block selection
        this._onBlockShiftDown(cmd),
      ])
      .run();

    return result;
  };

  private _onShiftArrowUp = () => {
    const [result] = this._std.command
      .chain()
      .try(cmd => [
        // block selection
        this._onBlockShiftUp(cmd),
      ])
      .run();

    return result;
  };

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
      'Shift-ArrowDown': this._onShiftArrowDown,
      'Shift-ArrowUp': this._onShiftArrowUp,
      Escape: this._onEsc,
      Enter: this._onEnter,
      'Mod-a': this._onSelectAll,
    });

    this._bindQuickActionHotKey();
    this._bindTextConversionHotKey();
    this._bindMoveBlockHotKey();
  };

  host: ReactiveControllerHost & BlockComponent;

  constructor(host: ReactiveControllerHost & BlockComponent) {
    (this.host = host).addController(this);
  }

  private get _std() {
    return this.host.std;
  }

  hostConnected() {
    this._reset();
  }

  hostDisconnected() {
    this._reset();
  }
}
