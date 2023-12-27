import type { BlockSelection, UIEventHandler } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement, EditorHost } from '@blocksuite/lit';
import type { ReactiveController } from 'lit';
import type { ReactiveControllerHost } from 'lit';

import { moveBlockConfigs } from '../_common/configs/move-block.js';
import { quickActionConfig } from '../_common/configs/quick-action/config.js';
import { textConversionConfigs } from '../_common/configs/text-conversion.js';
import { buildPath } from '../_common/utils/index.js';
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

  private _onArrowDown = () => {
    return this._std.command
      .pipe()
      .inline((_, next) => {
        this._reset();
        return next();
      })
      .try(cmd => [
        // block selection - select the next block
        this._onBlockDown(cmd),
      ])
      .run();
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
        // block selection - select the previous block
        this._onBlockUp(cmd),
      ])
      .run();
  };

  private _onBlockUp = (cmd: BlockSuite.CommandChain) => {
    return cmd
      .getBlockSelections()
      .inline<'currentSelectionPath'>((ctx, next) => {
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

  private _onShiftArrowDown = () => {
    return this._std.command
      .pipe()
      .try(cmd => [
        // block selection
        this._onBlockShiftDown(cmd),
      ])
      .run();
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
        // block selection
        this._onBlockShiftUp(cmd),
      ])
      .run();
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

        const sel = selection.create('text', {
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
          selection.create('block', {
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
                onModelElementUpdated(
                  this._std.host as EditorHost,
                  codeModel,
                  () => {
                    const codeElement = this._std.view.viewFromPath(
                      'block',
                      buildPath(codeModel)
                    );
                    assertExists(codeElement);
                    this._std.selection.setGroup('note', [
                      this._std.selection.create('text', {
                        from: {
                          path: codeElement.path,
                          index: 0,
                          length: codeModel.text?.length ?? 0,
                        },
                        to: null,
                      }),
                    ]);
                  }
                ).catch(console.error);

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
