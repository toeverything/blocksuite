import type { BlockSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import type { DefaultPageBlockComponent } from '../../default-page-block.js';
import { BlockNavigation } from './block-navigation.js';
import { TextNavigation } from './text-navigation.js';

export class Keyboard {
  constructor(public host: DefaultPageBlockComponent) {
    const textNavigation = new TextNavigation(host);
    const blockNavigation = new BlockNavigation(host);
    this.host.handleEvent('keyDown', ctx => {
      textNavigation.keyDown(ctx);
      blockNavigation.keyDown(ctx);
    });
    this.host.bindHotKey({
      'Mod-z': ctx => {
        ctx.get('defaultState').event.preventDefault();
        if (this.page.canUndo) {
          this.page.undo();
        }
      },
      'Mod-Z': ctx => {
        ctx.get('defaultState').event.preventDefault();
        if (this.page.canRedo) {
          this.page.redo();
        }
      },
      ArrowUp: ctx => {
        const current = this._currentSelection.at(0);
        if (!current) {
          return;
        }
        ctx.get('keyboardState').raw.preventDefault();
        if (current.is('text')) {
          textNavigation.ArrowUp(ctx);
          return;
        }

        if (current.is('block')) {
          blockNavigation.ArrowUp(ctx);
          return;
        }
      },
      ArrowDown: ctx => {
        const current = this._currentSelection.at(-1);
        if (!current) {
          return;
        }
        ctx.get('keyboardState').raw.preventDefault();
        if (current.is('text')) {
          textNavigation.ArrowDown(ctx);
          return;
        }
        if (current.is('block')) {
          blockNavigation.ArrowDown(ctx);
          return;
        }
      },
      'Shift-ArrowUp': ctx => {
        const event = ctx.get('keyboardState').raw;
        const current = this._currentSelection.at(0);
        if (!current) {
          return;
        }
        if (current.is('text')) {
          event.preventDefault();
          textNavigation.ShiftArrowUp(ctx);
          return true;
        }
        if (current.is('block')) {
          blockNavigation.ShiftArrowUp(ctx);
          return true;
        }
        return;
      },
      'Shift-ArrowDown': ctx => {
        const event = ctx.get('keyboardState').raw;
        const current = this._currentSelection.at(-1);
        if (!current) {
          return;
        }
        if (current.is('text')) {
          event.preventDefault();
          textNavigation.ShiftArrowDown(ctx);
          return true;
        }
        if (current.is('block')) {
          blockNavigation.ShiftArrowDown(ctx);
          return true;
        }
        return;
      },
      Backspace: this._handleDelete,
      Delete: this._handleDelete,
      Escape: ctx => {
        const current = this._currentSelection.at(0);
        if (!current) {
          return;
        }
        if (current.is('text')) {
          textNavigation.Escape(ctx);
          return;
        }

        this._selection.set([]);
      },
    });
  }

  private get page() {
    return this.host.page;
  }

  private get _selection() {
    return this.host.root.selectionManager;
  }

  private get _currentSelection() {
    return this._selection.value;
  }

  private _handleDelete = () => {
    const blockSelections = this._currentSelection.filter(sel =>
      sel.is('block')
    );
    if (blockSelections.length === 0) {
      return;
    }

    this.page.transact(() => {
      const { blockId, path } = this._replaceBlocksBySelection(
        blockSelections,
        'affine:paragraph',
        {}
      );

      this._selection.set([
        this._selection.getInstance('text', {
          from: {
            index: 0,
            length: 0,
            blockId,
            path,
          },
          to: null,
        }),
      ]);
    });
  };

  private _deleteBlocksBySelection(selections: BlockSelection[]) {
    selections.forEach(selection => {
      const block = this.page.getBlockById(selection.blockId);
      if (block) {
        this.page.deleteBlock(block);
      }
    });
  }

  private _replaceBlocksBySelection(
    selections: BlockSelection[],
    flavour: string,
    props: Record<string, unknown>
  ) {
    const current = selections[0];
    const first = this.page.getBlockById(current.blockId);
    const firstElement = this.host.root.blockViewMap.get(current.path);

    assertExists(first, `Cannot find block ${current.blockId}`);
    assertExists(
      firstElement,
      `Cannot find block view ${current.path.join(' -> ')}`
    );

    const parentPath = firstElement.parentPath;

    const parent = this.page.getParent(first);
    const index = parent?.children.indexOf(first);

    this._deleteBlocksBySelection(selections);
    const blockId = this.page.addBlock(flavour, props, parent, index);

    return {
      blockId,
      path: parentPath.concat(blockId),
    };
  }
}
