import type {
  PointerEventState,
  TextSelection,
  UIEventHandler,
} from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/store';
import { getTextNodesFromElement } from '@blocksuite/virgo';

import { DocPageBlockComponent } from '../doc/doc-page-block.js';
import type { PageBlockComponent } from '../types.js';
import {
  autoScroll,
  caretFromPoint,
  pointIsNotText,
  rangeFromCaret,
} from './utils.js';

/**
 * Used to support native range between multiple contenteditable elements
 */
export class Gesture {
  isNativeSelection = false;

  private _startRange: Range | null = null;
  private _rafID = 0;

  private get _selectionManager() {
    return this.pageElement.root.selectionManager;
  }

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

  constructor(public pageElement: PageBlockComponent) {
    this.pageElement.handleEvent('dragStart', this._dragStartHandler);
    this.pageElement.handleEvent('dragMove', this._dragMoveHandler);
    this.pageElement.handleEvent('dragEnd', this._dragEndHandler);
    this.pageElement.handleEvent('pointerMove', this._pointerMoveHandler);
    this.pageElement.handleEvent('click', this._clickHandler);
    this.pageElement.handleEvent('doubleClick', this._doubleClickHandler);
    this.pageElement.handleEvent('tripleClick', this._tripleClickHandler);
  }

  private _dragStartHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    if (pointIsNotText(state.event.target)) {
      this.isNativeSelection = false;
      return;
    }
    this._nativeDragStartHandler(ctx);
  };

  private _selectByCaret: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const caret = caretFromPoint(state.raw.clientX, state.raw.clientY);
    if (!caret) {
      return;
    }

    const range = rangeFromCaret(caret);

    this._startRange = range;

    const element =
      caret.node instanceof Element ? caret.node : caret.node.parentElement;
    if (!element) {
      return;
    }

    this._rangeManager.renderRange(range);
  };

  private _nativeDragStartHandler: UIEventHandler = ctx => {
    this.isNativeSelection = true;
    this._selectByCaret(ctx);
  };

  private _dragMoveHandler: UIEventHandler = ctx => {
    this._clearRaf();
    if (!this.isNativeSelection) {
      return;
    }
    this._nativeDragMoveHandler(ctx);
  };

  private _nativeDragMoveHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const runner = () => {
      if (!this._rafID) return;

      this._updateRange(state);

      const result = this._viewportElement
        ? autoScroll(this._viewportElement, state.y)
        : false;
      if (result) {
        this._rafID = requestAnimationFrame(runner);
        return;
      }

      this._clearRaf();
    };

    this._rafID = requestAnimationFrame(runner);
    return;
  };

  private _dragEndHandler: UIEventHandler = ctx => {
    this._clearRaf();
    if (!this.isNativeSelection) {
      return;
    }
    this._nativeDragEndHandler(ctx);
  };

  private _pointerMoveHandler: UIEventHandler = ctx => {
    if (!this.isNativeSelection) {
      return;
    }
    const state = ctx.get('defaultState');
    state.event.preventDefault();
  };

  private _nativeDragEndHandler: UIEventHandler = ctx => {
    this._startRange = null;
    this.isNativeSelection = false;
  };

  private _tripleClickHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const caret = caretFromPoint(state.raw.clientX, state.raw.clientY);
    if (!caret) {
      return;
    }
    const element =
      caret.node instanceof Element ? caret.node : caret.node.parentElement;
    if (!element) {
      return;
    }

    const editor = document
      .elementFromPoint(state.x, state.y)
      ?.closest('[data-virgo-root="true"]');

    if (!editor) return;

    const textNodes = getTextNodesFromElement(editor);
    const first = textNodes[0];
    const last = textNodes[textNodes.length - 1];
    const range = document.createRange();
    range.setStart(first, 0);
    range.setEnd(last, Number(last.textContent?.length));
    this._rangeManager.renderRange(range);
  };

  private _clickHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    if (state.button > 0) {
      return;
    }

    const text =
      this._selectionManager.value.find(
        (selection): selection is TextSelection => selection.is('text')
      ) ?? null;

    if (state.keys.shift) {
      this._updateRange(state);
      return;
    }

    if (!text) {
      return;
    }

    this._selectByCaret(ctx);
  };

  private _doubleClickHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const caret = caretFromPoint(state.x, state.y);
    if (!caret) {
      return;
    }
    const { node, offset } = caret;

    if (node.nodeType !== Node.TEXT_NODE) {
      return;
    }

    const content = node.textContent;
    if (!content || !content[offset]) {
      return;
    }

    let left: number;
    let right: number;
    if (/\W/.test(content[offset])) {
      left = offset;
      right = offset + 1;
    } else {
      left = content.slice(0, offset + 1).search(/\w+$/);
      right = content.slice(offset).search(/\W/);

      if (right < 0) {
        right = content.length;
      } else {
        right = right + offset;
      }
    }

    const range = document.createRange();
    range.setStart(node, left);
    range.setEnd(node, right);

    this._rangeManager.renderRange(range);
  };

  private _clearRaf() {
    if (this._rafID) {
      cancelAnimationFrame(this._rafID);
      this._rafID = 0;
    }
  }

  private _updateRange = (state: PointerEventState) => {
    if (!this._startRange) return;

    const caret = caretFromPoint(state.x, state.y);
    if (!caret) {
      return;
    }

    if (caret.node.nodeType !== Node.TEXT_NODE) {
      return;
    }

    const range = rangeFromCaret(caret);

    this._rangeManager.renderRange(this._startRange, range);
  };
}
