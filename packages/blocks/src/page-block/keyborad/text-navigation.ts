import type { UIEventHandler } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';
import { assertExists } from '@blocksuite/store';

import { DocPageBlockComponent } from '../index.js';
import { autoScroll } from '../text-selection/utils.js';
import type { PageBlockComponent } from '../types.js';
import {
  horizontalGetNextCaret,
  horizontalMoveCursorToNextText,
} from './utils.js';

export class TextNavigation {
  private _anchorRange: Range | null = null;
  private _focusRange: Range | null = null;

  private get _viewportElement() {
    if (this.pageElement instanceof DocPageBlockComponent) {
      return this.pageElement.viewportElement;
    }
    return null;
  }

  private get _rangeManager() {
    assertExists(this.pageElement.rangeManager);
    return this.pageElement.rangeManager;
  }

  private get _selection() {
    return this.pageElement.root.selectionManager;
  }

  constructor(public pageElement: PageBlockComponent) {}

  Escape: UIEventHandler = () => {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    const blocks = this._rangeManager.findBlockElementsByRange(range);

    const manager = this.pageElement.root.selectionManager;
    manager.set(
      blocks.map(block => {
        return manager.getInstance('block', {
          path: block.path,
        });
      })
    );
  };

  ArrowUp: UIEventHandler = ctx => {
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
      this.pageElement,
      true
    );
    const nextRect = result?.caret.node.parentElement?.getBoundingClientRect();
    if (nextRect) {
      ctx.get('keyboardState').raw.preventDefault();
      if (this._viewportElement) {
        autoScroll(this._viewportElement, nextRect.top);
      }
    }
    return;
  };

  ArrowDown: UIEventHandler = ctx => {
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
      this.pageElement
    );
    const nextRect = result?.caret.node.parentElement?.getBoundingClientRect();
    if (nextRect) {
      ctx.get('keyboardState').raw.preventDefault();
      if (this._viewportElement) {
        autoScroll(this._viewportElement, nextRect.bottom);
      }
    }
    return;
  };

  ArrowRight: UIEventHandler = () => {
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
      this.pageElement,
      false
    );
    if (!caret) return;
    const { node } = caret;
    const blockElement = node.parentElement?.closest(
      '[data-block-id]'
    ) as BlockElement;
    if (!blockElement) return;

    this._selection.set([
      this._selection.getInstance('text', {
        from: {
          index: 0,
          length: 0,
          path: blockElement.path,
        },
        to: null,
      }),
    ]);
  };

  ArrowLeft: UIEventHandler = () => {
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
      this.pageElement,
      true
    );
    if (!caret) return;
    const { node } = caret;
    const blockElement = node.parentElement?.closest(
      '[data-block-id]'
    ) as BlockElement;
    if (!blockElement) return;

    this._selection.set([
      this._selection.getInstance('text', {
        from: {
          index: blockElement.model.text?.length ?? 0,
          length: 0,
          path: blockElement.path,
        },
        to: null,
      }),
    ]);
  };

  ShiftArrowUp: UIEventHandler = () => {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (!this._anchorRange) {
      this._anchorRange = range.cloneRange();
    }
    const rect = Array.from((this._focusRange ?? range).getClientRects()).at(0);
    if (!rect) {
      return;
    }
    const caret = horizontalGetNextCaret(
      {
        x: rect.left,
        y: rect.top,
      },
      this.pageElement,
      true
    );
    if (!caret) {
      return;
    }
    const _range = document.createRange();
    _range.setStart(caret.node, caret.offset);
    this._rangeManager.renderRange(_range, this._anchorRange);
    this._focusRange = _range.cloneRange();

    if (this._viewportElement) {
      autoScroll(
        this._viewportElement,
        this._rangeManager.value.getBoundingClientRect().top
      );
    }

    return true;
  };

  ShiftArrowDown: UIEventHandler = () => {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (!this._anchorRange) {
      this._anchorRange = range.cloneRange();
    }
    const rect = Array.from((this._focusRange ?? range).getClientRects()).at(
      -1
    );
    if (!rect) {
      return;
    }
    const caret = horizontalGetNextCaret(
      {
        x: rect.right,
        y: rect.top,
      },
      this.pageElement,
      false
    );
    if (!caret) {
      return;
    }
    const _range = document.createRange();
    _range.setStart(caret.node, caret.offset);
    this._rangeManager.renderRange(_range, this._anchorRange);
    this._focusRange = _range.cloneRange();

    if (this._viewportElement) {
      autoScroll(
        this._viewportElement,
        this._rangeManager.value.getBoundingClientRect().bottom
      );
    }

    return true;
  };

  keyDown: UIEventHandler = () => {
    this._anchorRange = null;
    this._focusRange = null;
  };
}
