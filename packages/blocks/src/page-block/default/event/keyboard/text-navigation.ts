import type { UIEventHandler } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';

import type { DefaultPageBlockComponent } from '../../default-page-block.js';
import {
  horizontalGetNextCaret,
  horizontalMoveCursorToNextText,
} from '../utils.js';

export class TextNavigation {
  private _anchorRange: Range | null = null;
  private _focusRange: Range | null = null;

  private get _viewport() {
    return this.host.viewport;
  }

  Escape: UIEventHandler = () => {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    const blocks = this.host.rangeController.findBlockElementsByRange(range);

    const manager = this.host.root.selectionManager;
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
      this.host,
      true
    );
    const nextRect = result?.caret.node.parentElement?.getBoundingClientRect();
    if (nextRect) {
      ctx.get('keyboardState').raw.preventDefault();
      this._autoScroll(nextRect.top);
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
      this.host
    );
    const nextRect = result?.caret.node.parentElement?.getBoundingClientRect();
    if (nextRect) {
      ctx.get('keyboardState').raw.preventDefault();
      this._autoScroll(nextRect.bottom);
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
      this.host,
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
      this.host,
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
      this.host,
      true
    );
    if (!caret) {
      return;
    }
    const _range = document.createRange();
    _range.setStart(caret.node, caret.offset);
    this.host.rangeController.render(_range, this._anchorRange);
    this._focusRange = _range.cloneRange();
    this._autoScroll(
      this.host.rangeController.value.getBoundingClientRect().top
    );
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
      this.host,
      false
    );
    if (!caret) {
      return;
    }
    const _range = document.createRange();
    _range.setStart(caret.node, caret.offset);
    this.host.rangeController.render(_range, this._anchorRange);
    this._focusRange = _range.cloneRange();

    this._autoScroll(
      this.host.rangeController.value.getBoundingClientRect().bottom
    );
    return true;
  };

  keyDown: UIEventHandler = () => {
    this._anchorRange = null;
    this._focusRange = null;
  };

  constructor(public host: DefaultPageBlockComponent) {}

  private _autoScroll = (y: number): boolean => {
    const { scrollHeight, clientHeight, scrollTop } = this._viewport;
    let _scrollTop = scrollTop;
    const threshold = 100;
    const max = scrollHeight - clientHeight;

    let d = 0;
    let flag = false;

    if (Math.ceil(scrollTop) < max && clientHeight - y < threshold) {
      // ↓
      d = threshold - (clientHeight - y);
      flag = Math.ceil(_scrollTop) < max;
    } else if (scrollTop > 0 && y < threshold) {
      // ↑
      d = y - threshold;
      flag = _scrollTop > 0;
    }

    _scrollTop += d * 0.5;

    if (this.host.viewportElement && flag && scrollTop !== _scrollTop) {
      this.host.viewportElement.scrollTop = _scrollTop;
      return true;
    }
    return false;
  };

  private get _selection() {
    return this.host.root.selectionManager;
  }
}
