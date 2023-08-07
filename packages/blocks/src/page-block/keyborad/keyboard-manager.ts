import type { BlockSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import type { PageBlockComponent } from '../types.js';
import { BlockNavigation } from './block-navigation.js';
import { TextNavigation } from './text-navigation.js';

export class PageKeyboardManager {
  constructor(public pageElement: PageBlockComponent) {
    const textNavigation = new TextNavigation(pageElement);
    const blockNavigation = new BlockNavigation(pageElement);
    this.pageElement.handleEvent('keyDown', ctx => {
      textNavigation.keyDown(ctx);
      blockNavigation.keyDown(ctx);
    });
    this.pageElement.bindHotKey({
      'Mod-z': ctx => {
        ctx.get('defaultState').event.preventDefault();
        if (this._page.canUndo) {
          this._page.undo();
        }
      },
      'Mod-Z': ctx => {
        ctx.get('defaultState').event.preventDefault();
        if (this._page.canRedo) {
          this._page.redo();
        }
      },
      ArrowUp: ctx => {
        const current = this._currentSelection.at(0);
        if (!current) {
          return;
        }
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
        if (current.is('text')) {
          textNavigation.ArrowDown(ctx);
          return;
        }
        if (current.is('block')) {
          blockNavigation.ArrowDown(ctx);
          return;
        }
      },
      ArrowLeft: ctx => {
        const current = this._currentSelection.at(0);
        if (!current) {
          return;
        }
        ctx.get('keyboardState').raw.preventDefault();
        if (current.is('text')) {
          textNavigation.ArrowLeft(ctx);
          return;
        }
      },
      ArrowRight: ctx => {
        const current = this._currentSelection.at(-1);
        if (!current) {
          return;
        }
        ctx.get('keyboardState').raw.preventDefault();
        if (current.is('text')) {
          textNavigation.ArrowRight(ctx);
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
      Enter: ctx => {
        const current = this._currentSelection.at(0);
        if (!current) {
          return;
        }
        if (current.is('block')) {
          blockNavigation.Enter(ctx);
          return;
        }
      },
    });
  }

  private get _page() {
    return this.pageElement.page;
  }

  private get _selection() {
    return this.pageElement.root.selectionManager;
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

    this._page.transact(() => {
      const { path } = this._replaceBlocksBySelection(
        blockSelections,
        'affine:paragraph',
        {}
      );

      this._selection.set([
        this._selection.getInstance('text', {
          from: {
            index: 0,
            length: 0,
            path,
          },
          to: null,
        }),
      ]);
    });
  };

  private _deleteBlocksBySelection(selections: BlockSelection[]) {
    selections.forEach(selection => {
      const block = this._page.getBlockById(selection.blockId);
      if (block) {
        this._page.deleteBlock(block);
      }
    });
  }

  private _replaceBlocksBySelection(
    selections: BlockSelection[],
    flavour: string,
    props: Record<string, unknown>
  ) {
    const current = selections[0];
    const first = this._page.getBlockById(current.blockId);
    const firstElement = this.pageElement.root.viewStore.viewFromPath(
      'block',
      current.path
    );

    assertExists(first, `Cannot find block ${current.blockId}`);
    assertExists(
      firstElement,
      `Cannot find block view ${current.path.join(' -> ')}`
    );

    const parentPath = firstElement.parentPath;

    const parent = this._page.getParent(first);
    const index = parent?.children.indexOf(first);

    this._deleteBlocksBySelection(selections);
    const blockId = this._page.addBlock(flavour, props, parent, index);

    return {
      blockId,
      path: parentPath.concat(blockId),
    };
  }
}
