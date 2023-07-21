import type {
  BaseSelection,
  EventName,
  PointerEventState,
  TextSelection,
  UIEventHandler,
} from '@blocksuite/block-std';
import { BlockService } from '@blocksuite/block-std';
import type { BlockSuiteRoot } from '@blocksuite/lit';

import { showFormatQuickBar } from '../../components/format-quick-bar/index.js';
import type { PageBlockModel } from '../page-model.js';
import {
  calcCurrentSelectionPosition,
  getDragDirection,
} from '../utils/position.js';
import type {
  DefaultPageBlockComponent,
  DefaultSelectionSlots,
} from './default-page-block.js';
import { DefaultSelectionManager } from './selection-manager/index.js';
import { RangeController } from './selection-manager/range-controller.js';

function pointIsNotText(element: unknown) {
  if (element instanceof Element) {
    const { cursor } = window.getComputedStyle(element);
    return cursor !== 'text';
  }

  return true;
}

function caretFromPoint(
  x: number,
  y: number
): { node: Node; offset: number } | undefined {
  // @ts-ignore
  if (document.caretPositionFromPoint) {
    try {
      // Firefox throws for this call in hard-to-predict circumstances
      const pos = document.caretPositionFromPoint(x, y);
      if (pos) return { node: pos.offsetNode, offset: pos.offset };
    } catch (_) {
      // do nothing
    }
  }
  if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(x, y);
    if (range) return { node: range.startContainer, offset: range.startOffset };
  }

  return undefined;
}

function rangeFromCaret(caret: { node: Node; offset: number }): Range {
  const range = document.createRange();
  range.setStart(caret.node, caret.offset);
  range.setEnd(caret.node, caret.offset);

  return range;
}

export interface PageViewport {
  left: number;
  top: number;
  scrollLeft: number;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  clientWidth: number;
}

export class DefaultPageService extends BlockService<PageBlockModel> {
  selection: DefaultSelectionManager | null = null;
  rangeController = new RangeController(this.store.root as BlockSuiteRoot);

  private _isNativeSelection = false;
  private _startRange: Range | null = null;
  private _viewportElement: HTMLElement | null = null;
  private _prevSelection: BaseSelection | null = null;
  private _rafID = 0;

  private get _viewport(): PageViewport {
    if (!this._viewportElement) {
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
      this._viewportElement;
    const { top, left } = this._viewportElement.getBoundingClientRect();
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

  private _addEvent(name: EventName, handler: UIEventHandler) {
    this.disposables.add(this.uiEventDispatcher.add(name, handler));
  }

  private _dragStartHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    if (pointIsNotText(state.event.target)) {
      this._isNativeSelection = false;
      return;
    }
    this._nativeDragStartHandler(ctx);
  };

  private _nativeDragStartHandler: UIEventHandler = ctx => {
    this._isNativeSelection = true;
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

  private _dragMoveHandler: UIEventHandler = ctx => {
    this._clearRaf();
    if (!this._isNativeSelection) {
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
    if (!this._isNativeSelection) {
      return;
    }
    this._nativeDragEndHandler(ctx);
  };

  private _pointerMoveHandler: UIEventHandler = ctx => {
    if (!this._isNativeSelection) {
      return;
    }
    const state = ctx.get('defaultState');
    state.event.preventDefault();
  };

  private _nativeDragEndHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    requestAnimationFrame(() => {
      this._showFormatBar(state);
    });
    this._startRange = null;
    this._isNativeSelection = false;
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

    if (this._viewportElement && flag && scrollTop !== _scrollTop) {
      this._viewportElement.scrollTop = _scrollTop;
      return true;
    }
    return false;
  };

  private _showFormatBar = (event: PointerEventState) => {
    const selection = window.getSelection();
    if (!selection) return;

    const direction = getDragDirection(event);
    showFormatQuickBar({
      page: this.page,
      direction,
      anchorEl: {
        getBoundingClientRect: () => {
          return calcCurrentSelectionPosition(direction);
        },
      },
    });
  };

  override mounted() {
    super.mounted();

    this._addEvent('dragStart', this._dragStartHandler);
    this._addEvent('dragMove', this._dragMoveHandler);
    this._addEvent('dragEnd', this._dragEndHandler);
    this._addEvent('pointerMove', this._pointerMoveHandler);

    this._addEvent('selectionChange', () => {
      const selection = window.getSelection();
      if (!selection) {
        return;
      }
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      this._prevSelection = this.rangeController.writeRange(range);
    });

    this.disposables.add(
      this.selectionManager.slots.changed.on(selections => {
        if (this._isNativeSelection) {
          return;
        }
        const text =
          selections.find((selection): selection is TextSelection =>
            selection.is('text')
          ) ?? null;
        const eq =
          text && this._prevSelection
            ? text.equals(this._prevSelection)
            : text === this._prevSelection;
        if (eq) {
          return;
        }

        this._prevSelection = text;
        this.rangeController.syncRange(text);
        return;
      })
    );
  }

  bindViewport(viewportElement: HTMLElement) {
    this._viewportElement = viewportElement;
  }

  mountSelectionManager(
    container: DefaultPageBlockComponent,
    slots: DefaultSelectionSlots
  ) {
    if (this.selection) {
      this.unmountSelectionManager();
      return;
    }
    this.selection = new DefaultSelectionManager({
      slots,
      container,
      dispatcher: this.uiEventDispatcher,
    });
  }

  unmountSelectionManager() {
    if (!this.selection) {
      return;
    }

    this.selection.clear();
    this.selection.dispose();
    this.selection = null;
  }

  override unmounted() {
    super.unmounted();
    this._clearRaf();
    this.unmountSelectionManager();
  }
}
