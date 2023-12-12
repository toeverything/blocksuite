import type {
  PointerEventState,
  TextSelection,
  UIEventHandler,
} from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { getTextNodesFromElement, INLINE_ROOT_ATTR } from '@blocksuite/inline';

import type { DocPageBlockComponent } from '../doc/doc-page-block.js';
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
    return this.pageElement.host.selection;
  }

  private get _viewportElement() {
    if (this.pageElement.tagName === 'AFFINE-DOC-PAGE') {
      return (this.pageElement as DocPageBlockComponent).viewportElement;
    }
    return null;
  }

  private get _rangeManager() {
    assertExists(this.pageElement.host.rangeManager);
    return this.pageElement.host.rangeManager;
  }

  constructor(public pageElement: PageBlockComponent) {
    this.pageElement.handleEvent('dragStart', this._dragStartHandler);
    this.pageElement.handleEvent('dragMove', this._dragMoveHandler);
    this.pageElement.handleEvent('dragEnd', this._dragEndHandler);
    this.pageElement.handleEvent('pointerMove', this._pointerMoveHandler);
    this.pageElement.handleEvent('click', this._clickHandler);
    this.pageElement.handleEvent('doubleClick', this._doubleClickHandler);
    this.pageElement.handleEvent('tripleClick', this._tripleClickHandler);
    this.pageElement.handleEvent('beforeInput', () => {
      const selection = document.getSelection();
      this._startRange =
        selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    });
  }

  private _dragStartHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    if (pointIsNotText(state.event.target)) {
      this.isNativeSelection = false;
      return;
    }

    if (state.button !== 0) {
      return;
    }

    this.isNativeSelection = true;
    this._selectByCaret(ctx);
    state.raw.preventDefault();
  };

  private _selectByCaret: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const caret = caretFromPoint(state.raw.x, state.raw.y);
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

  private _dragMoveHandler: UIEventHandler = ctx => {
    this._clearRaf();
    if (!this.isNativeSelection) {
      return;
    }

    const state = ctx.get('pointerState');
    state.raw.preventDefault();
    const runner = () => {
      if (!this._rafID) return;

      this._updateRange(state);

      const result = this._viewportElement
        ? autoScroll(this._viewportElement, state.raw.y)
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

  private _dragEndHandler: UIEventHandler = () => {
    this._clearRaf();
    if (!this.isNativeSelection) {
      return;
    }
    this._startRange = null;
    this.isNativeSelection = false;
  };

  private _pointerMoveHandler: UIEventHandler = ctx => {
    if (!this.isNativeSelection) {
      return;
    }
    const state = ctx.get('defaultState');
    state.event.preventDefault();
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
      .elementFromPoint(state.raw.x, state.raw.y)
      ?.closest(`[${INLINE_ROOT_ATTR}]`);

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

    if (state.keys.shift) {
      state.raw.preventDefault();
      this._updateRange(state);
      return;
    }

    const text =
      this._selectionManager.value.find(
        (selection): selection is TextSelection => selection.is('text')
      ) ?? null;
    if (!text) {
      return;
    }

    this._selectByCaret(ctx);
  };

  private _doubleClickHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    const caret = caretFromPoint(state.raw.x, state.raw.y);
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

    const caret = caretFromPoint(state.raw.x, state.raw.y);
    if (!caret) {
      return;
    }

    if (caret.node.nodeType !== Node.TEXT_NODE) {
      return;
    }

    if (!caret.node.parentElement?.closest(`[${INLINE_ROOT_ATTR}]`)) {
      return;
    }

    const range = rangeFromCaret(caret);

    this._rangeManager.renderRange(this._startRange, range);
  };
}
