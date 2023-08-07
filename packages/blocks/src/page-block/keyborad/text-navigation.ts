import type { UIEventHandler } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/store';

import { DocPageBlockComponent } from '../index.js';
import { autoScroll } from '../text-selection/utils.js';
import type { PageBlockComponent } from '../types.js';
import { horizontalGetNextCaret } from './utils.js';

// This still needs to be polished.
export class TextNavigation {
  private _anchorRange: Range | null = null;
  private _focusRange: Range | null = null;

  private get _viewportElement() {
    if (this.host instanceof DocPageBlockComponent) {
      return this.host.viewportElement;
    }
    return null;
  }

  private get _rangeManager() {
    assertExists(this.host.rangeManager);
    return this.host.rangeManager;
  }

  constructor(public host: PageBlockComponent) {}

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
      this.host,
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
