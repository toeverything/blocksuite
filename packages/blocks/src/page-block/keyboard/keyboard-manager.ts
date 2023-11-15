import type { BlockSelection } from '@blocksuite/block-std';
import { IS_MAC, IS_WINDOWS } from '@blocksuite/global/env';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';

export class PageKeyboardManager {
  constructor(public pageElement: BlockElement) {
    this.pageElement.bindHotKey(
      {
        'Mod-z': ctx => {
          ctx.get('defaultState').event.preventDefault();

          if (this._page.canUndo) {
            this._page.undo();
          }
        },
        'Shift-Mod-z': ctx => {
          ctx.get('defaultState').event.preventDefault();
          if (this._page.canRedo) {
            this._page.redo();
          }
        },
        'Control-y': ctx => {
          if (!IS_WINDOWS) return;

          ctx.get('defaultState').event.preventDefault();
          if (this._page.canRedo) {
            this._page.redo();
          }
        },
        'Mod-Backspace': () => true,
        Backspace: this._handleDelete,
        Delete: this._handleDelete,
        'Control-d': () => {
          if (!IS_MAC) return;
          this._handleDelete();
        },
      },
      {
        global: true,
      }
    );
  }

  private get _page() {
    return this.pageElement.page;
  }

  private get _selection() {
    return this.pageElement.root.selection;
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
      const selection = this._replaceBlocksBySelection(
        blockSelections,
        'affine:paragraph',
        {}
      );

      if (selection) {
        this._selection.set([
          this._selection.getInstance('text', {
            from: {
              index: 0,
              length: 0,
              path: selection.path,
            },
            to: null,
          }),
        ]);
      }
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
    const firstElement = this.pageElement.root.view.viewFromPath(
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

    try {
      this._page.schema.validate(flavour, parent?.flavour);
    } catch {
      return null;
    }

    const blockId = this._page.addBlock(flavour, props, parent, index);

    return {
      blockId,
      path: parentPath.concat(blockId),
    };
  }
}
