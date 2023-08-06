import type { BlockSelection } from '@blocksuite/block-std';
import type { BaseSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import type { NoteBlockComponent } from '../note-block.js';
import { BlockNavigation } from './block-navigation.js';

export class NoteKeyboardManager {
  constructor(public host: NoteBlockComponent) {
    const blockNavigation = new BlockNavigation(host);
    this.host.handleEvent('keyDown', ctx => {
      blockNavigation.keyDown(ctx);
    });
    this.host.bindHotKey({
      ArrowUp: ctx => {
        const current = this._matchedSelections.at(0);
        if (!current) {
          return;
        }

        if (current.is('block')) {
          return blockNavigation.ArrowUp(ctx);
        }
      },
      ArrowDown: ctx => {
        const current = this._matchedSelections.at(-1);
        if (!current) {
          return;
        }
        if (current.is('block')) {
          return blockNavigation.ArrowDown(ctx);
        }
      },
      'Shift-ArrowUp': ctx => {
        const current = this._matchedSelections.at(0);
        if (!current) {
          return;
        }
        if (current.is('block')) {
          return blockNavigation.ShiftArrowUp(ctx);
        }
        return;
      },
      'Shift-ArrowDown': ctx => {
        const current = this._matchedSelections.at(-1);
        if (!current) {
          return;
        }
        if (current.is('block')) {
          return blockNavigation.ShiftArrowDown(ctx);
        }
        return;
      },
      Backspace: this._handleDelete,
      Delete: this._handleDelete,
      Enter: ctx => {
        const current = this._matchedSelections.at(0);
        if (!current) {
          return;
        }
        if (current.is('block')) {
          return blockNavigation.Enter(ctx);
        }
      },
    });
  }

  private get _page() {
    return this.host.page;
  }

  private get _selection() {
    return this.host.root.selectionManager;
  }

  private get _currentSelection() {
    return this._selection.value;
  }

  private get _matchedSelections() {
    return this._currentSelection.filter(
      sel => sel.is('text') || sel.is('block')
    );
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

      this._setSelections([
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
    const firstElement = this.host.root.viewStore.viewFromPath(
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

  private _setSelections = (selection: BaseSelection[]) => {
    const otherSelections = this._currentSelection.filter(
      sel => !sel.is('text') && !sel.is('block')
    );

    this._selection.set([...otherSelections, ...selection]);
  };
}
