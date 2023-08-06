import type { BaseSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';

import type { DocPageBlockComponent } from '../doc/doc-page-block.js';
import { autoScroll } from '../text-selection/utils.js';
import type { PageBlockComponent } from '../types.js';
import {
  horizontalGetNextCaret,
  horizontalMoveCursorToNextText,
} from './utils.js';

export class PageKeyboardManager {
  private get _pageBlock() {
    const page = this.host.closest<PageBlockComponent>(
      'affine-doc-page,affine-edgeless-page'
    );
    assertExists(page);
    return page;
  }

  private get _viewportElement() {
    if (this.host.tagName === 'AFFINE-DOC-PAGE') {
      return (this.host as DocPageBlockComponent).viewportElement;
    }
    return null;
  }

  private get _rangeManager() {
    const { rangeManager } = this._pageBlock;
    assertExists(rangeManager);

    return rangeManager;
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

  private _setSelections = (selection: BaseSelection[]) => {
    const otherSelections = this._currentSelection.filter(
      sel => !sel.is('text') && !sel.is('block')
    );

    this._selection.set([...otherSelections, ...selection]);
  };

  constructor(public host: PageBlockComponent) {
    this.host.bindHotKey({
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
        const current = this._matchedSelections.at(0);
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
          const result = horizontalMoveCursorToNextText(
            {
              x: rect.left,
              y: rect.top,
            },
            this.host,
            true
          );
          const nextRect =
            result?.caret.node.parentElement?.getBoundingClientRect();
          if (nextRect) {
            ctx.get('keyboardState').raw.preventDefault();
            if (this._viewportElement) {
              autoScroll(this._viewportElement, nextRect.top, 200);
            }
          }
          return;
        }
      },
      ArrowDown: ctx => {
        const current = this._matchedSelections.at(-1);
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
          const result = horizontalMoveCursorToNextText(
            {
              x: rect.right,
              y: rect.top,
            },
            this.host
          );
          const nextRect =
            result?.caret.node.parentElement?.getBoundingClientRect();
          if (nextRect) {
            ctx.get('keyboardState').raw.preventDefault();
            if (this._viewportElement) {
              autoScroll(this._viewportElement, nextRect.bottom, 200);
            }
          }
          return;
        }
      },
      ArrowLeft: ctx => {
        const current = this._matchedSelections.at(0);
        if (!current) {
          return;
        }
        if (current.is('text')) {
          ctx.get('keyboardState').raw.preventDefault();
          const selection = document.getSelection();
          if (!selection || selection.rangeCount === 0) {
            return;
          }
          const range = selection.getRangeAt(0);
          const rect = Array.from(range.getClientRects()).at(0);
          if (!rect) {
            return;
          }
          const caret = horizontalGetNextCaret(
            {
              x: rect.right,
              y: rect.top,
            },
            this.host,
            true
          );
          if (!caret) return;
          const { node } = caret;
          const blockElement = node.parentElement?.closest(
            '[data-block-id]'
          ) as BlockElement;
          if (!blockElement) return;

          this._setSelections([
            this._selection.getInstance('text', {
              from: {
                index: blockElement.model.text?.length ?? 0,
                length: 0,
                path: blockElement.path,
              },
              to: null,
            }),
          ]);
        }
      },
      ArrowRight: ctx => {
        const current = this._matchedSelections.at(-1);
        if (!current) {
          return;
        }
        if (current.is('text')) {
          ctx.get('keyboardState').raw.preventDefault();
          const selection = document.getSelection();
          if (!selection || selection.rangeCount === 0) {
            return;
          }
          const range = selection.getRangeAt(0);
          const rect = Array.from(range.getClientRects()).at(-1);
          if (!rect) {
            return;
          }
          const caret = horizontalGetNextCaret(
            {
              x: rect.right,
              y: rect.top,
            },
            this.host,
            false
          );
          if (!caret) return;
          const { node } = caret;
          const blockElement = node.parentElement?.closest(
            '[data-block-id]'
          ) as BlockElement;
          if (!blockElement) return;

          this._setSelections([
            this._selection.getInstance('text', {
              from: {
                index: 0,
                length: 0,
                path: blockElement.path,
              },
              to: null,
            }),
          ]);
        }
      },
      Escape: () => {
        const current = this._matchedSelections.at(0);
        if (!current) {
          return;
        }

        if (current.is('text')) {
          const selection = document.getSelection();
          if (!selection || selection.rangeCount === 0) {
            return;
          }
          const range = selection.getRangeAt(0);
          const blocks = this._rangeManager.findBlockElementsByRange(range);

          const manager = this.host.root.selectionManager;

          const blockSelections = blocks.map(block => {
            return manager.getInstance('block', {
              path: block.path,
            });
          });

          this._setSelections(blockSelections);
          return;
        }

        if (current.is('block')) {
          this._setSelections([]);
          return true;
        }
        return;
      },
    });
  }

  private get _page() {
    return this.host.page;
  }
}
