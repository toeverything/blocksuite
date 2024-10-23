/* eslint-disable */
import type { BlockSelection, UIEventHandler } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';
import type { ReactiveController } from 'lit';

import { assertExists } from '@blocksuite/global/utils';
import type { ReactiveControllerHost } from 'lit';

export const ensureBlockInContainer = (
  blockElement: BlockElement,
  containerElement: BlockElement
) =>
  containerElement.contains(blockElement) && blockElement !== containerElement;

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
      // ArrowDown: this._onArrowDown,
      // ArrowUp: this._onArrowUp,
      // 'Shift-ArrowDown': this._onShiftArrowDown,
      // 'Shift-ArrowUp': this._onShiftArrowUp,
      // Escape: this._onEsc,
      Enter: this._onEnter,
      'Mod-a': this._onSelectAll,
    });

    // this._bindQuickActionHotKey();
    // this._bindTextConversionHotKey();
    // this._bindMoveBlockHotKey();
  };

  private _onArrowDown = () => {
    const [result] = this._std.command
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

    return result;
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
    const [result] = this._std.command
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

    return result;
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
    const [result] = this._std.command
      .pipe()
      .try(cmd => [
        // block selection
        this._onBlockShiftDown(cmd),
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
    const [result] = this._std.command
      .pipe()
      .try(cmd => [
        // block selection
        this._onBlockShiftUp(cmd),
      ])
      .run();

    return result;
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
    const [result] = this._std.command
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

    return result;
  };

  private _onEnter = () => {
    const [result] = this._std.command
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
        console.log(model, parent);
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

        selection.setGroup('cell', [sel]);

        return next();
      })
      .run();

    return result;
  };

  private _onSelectAll: UIEventHandler = ctx => {
    ctx.get('defaultState').event.preventDefault();
    const selection = this._std.selection;
    if (!selection.find('block')) {
      return;
    }

    try {
      if (selection.value.length === this.host.model.children.length) return;
    } catch (err) {
      console.log(err);
    }
    const blocks: BlockSelection[] = this.host.model.children.map(child => {
      return selection.create('block', {
        blockId: child.id,
      });
    });
    selection.update(selList => {
      return selList
        .filter<BaseSelection>(sel => !sel.is('block'))
        .concat(blocks);
    });

    return true;
  };
}
