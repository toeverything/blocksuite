import type { BlockSelection } from '@blocksuite/block-std';

import type { DefaultPageBlockComponent } from '../default-page-block.js';
import {
  horizontalMoveCursorToNextText,
  isPrintableKeyEvent,
} from './utils.js';

export class Keyboard {
  constructor(public host: DefaultPageBlockComponent) {
    this.host.handleEvent('keyDown', ctx => {
      const event = ctx.get('keyboardState').raw;
      if (this.host.page.readonly || !isPrintableKeyEvent(event)) return;

      const current = this._currentSelection.at(0);
      if (!current) return;

      if (current.is('block')) {
        const first = this.page.getBlockById(current.blockId);
        const firstElement = this.host.root.blockViewMap.get(current.path);
        if (!first || !firstElement) return;
        const parent = this.page.getParent(first);
        const index = parent?.children.indexOf(first);
        this._deleteBlockBySelection(
          this._currentSelection.filter(selection => selection.is('block'))
        );
        const blockId = this.page.addBlock(
          'affine:paragraph',
          {
            text: new this.page.Text(event.key),
          },
          parent,
          index
        );
        this._selection.set([
          this._selection.getInstance('text', {
            from: {
              index: 1,
              length: 0,
              blockId: blockId,
              path: firstElement.parentPath.concat(blockId),
            },
            to: null,
          }),
        ]);
        return;
      }
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
      ArrowUp: () => {
        const current = this._currentSelection.at(0);
        if (!current) {
          return;
        }
        if (current.is('text')) {
          const selection = document.getSelection();
          if (!selection || selection.rangeCount === 0) {
            return;
          }
          const range = selection.getRangeAt(0);
          const rect = Array.from(range.getClientRects()).at(0);
          if (!rect) {
            return;
          }
          horizontalMoveCursorToNextText(
            {
              x: rect.left,
              y: rect.top,
            },
            this.host,
            true
          );
        }
      },
      ArrowDown: () => {
        const current = this._currentSelection.at(-1);
        if (!current) {
          return;
        }
        if (current.is('text')) {
          const selection = document.getSelection();
          if (!selection || selection.rangeCount === 0) {
            return;
          }
          const range = selection.getRangeAt(0);
          const rect = Array.from(range.getClientRects()).at(-1);
          if (!rect) {
            return;
          }
          horizontalMoveCursorToNextText(
            {
              x: rect.right,
              y: rect.bottom,
            },
            this.host
          );
        }
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
  private _deleteBlockBySelection(selections: BlockSelection[]) {
    selections.forEach(selection => {
      const block = this.page.getBlockById(selection.blockId);
      if (block) {
        this.page.deleteBlock(block);
      }
    });
  }
}
