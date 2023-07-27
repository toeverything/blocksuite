import type {
  PointerEventState,
  TextSelection,
  UIEventHandler,
} from '@blocksuite/block-std';
import { getTextNodesFromElement } from '@blocksuite/virgo';

import type { DefaultPageBlockComponent } from '../default-page-block.js';
import { caretFromPoint, pointIsNotText, rangeFromCaret } from './utils.js';

export interface PageViewport {
  left: number;
  top: number;
  scrollLeft: number;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  clientWidth: number;
}

export class Gesture {
  isNativeSelection = false;

  private _startRange: Range | null = null;
  private _rafID = 0;
  private get _viewport(): PageViewport {
    if (!this.host.viewportElement) {
      return {
        left: 0,
        top: 0,
        scrollLeft: 0,
        scrollTop: 0,
        scrollHeight: 0,
        clientHeight: 0,
        clientWidth: 0,
      };
    }

    const { clientHeight, clientWidth, scrollHeight, scrollLeft, scrollTop } =
      this.host.viewportElement;
    const { top, left } = this.host.viewportElement.getBoundingClientRect();
    return {
      top,
      left,
      clientHeight,
      clientWidth,
      scrollHeight,
      scrollLeft,
      scrollTop,
    };
  }

  private get _selection() {
    return this.host.root.selectionManager;
  }

  private get rangeController() {
    return this.host.rangeController;
  }

  constructor(public host: DefaultPageBlockComponent) {
    this.host.handleEvent('dragStart', this._dragStartHandler);
    this.host.handleEvent('dragMove', this._dragMoveHandler);
    this.host.handleEvent('dragEnd', this._dragEndHandler);
    this.host.handleEvent('pointerMove', this._pointerMoveHandler);
    this.host.handleEvent('click', this._clickHandler);
    this.host.handleEvent('doubleClick', this._doubleClickHandler);
    this.host.handleEvent('tripleClick', this._tripleClickHandler);
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

    this.rangeController.render(range);
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

      const result = this._autoScroll(state.y);
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
    this.rangeController.render(range);
  };

  private _clickHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    if (state.button > 0) {
      return;
    }

    const text =
      this._selection.value.find((selection): selection is TextSelection =>
        selection.is('text')
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

    this.rangeController.render(range);
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

    this.rangeController.render(this._startRange, range);
  };

  private _autoScroll = (y: number): boolean => {
    const { scrollHeight, clientHeight, scrollTop } = this._viewport;
    let _scrollTop = scrollTop;
    const threshold = 50;
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

    _scrollTop += d * 0.25;

    if (this.host.viewportElement && flag && scrollTop !== _scrollTop) {
      this.host.viewportElement.scrollTop = _scrollTop;
      return true;
    }
    return false;
  };
}
