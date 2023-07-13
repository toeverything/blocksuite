import type {
  EventName,
  PointerEventState,
  UIEventHandler,
} from '@blocksuite/block-std';
import { BlockService } from '@blocksuite/block-std';

import { debounce } from '../../__internal__/utils/index.js';
import { showFormatQuickBar } from '../../components/format-quick-bar/index.js';
import type { PageBlockModel } from '../page-model.js';
import { calcCurrentSelectionPosition } from '../utils/position.js';
import type {
  DefaultPageBlockComponent,
  DefaultSelectionSlots,
} from './default-page-block.js';
import { DefaultSelectionManager } from './selection-manager/index.js';

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

  private _isNativeSelection = false;
  private _startRange: Range | null = null;
  private _viewportElement: HTMLElement | null = null;
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
      // TODO: area drag handler
      return;
    }

    const caret = caretFromPoint(state.raw.clientX, state.raw.clientY);
    if (!caret) {
      return;
    }

    const range = rangeFromCaret(caret);

    this._startRange = range;

    this.selectionManager.rangeController.add(range);
    this._isNativeSelection = true;
  };

  private _dragMoveHandler: UIEventHandler = ctx => {
    const state = ctx.get('pointerState');
    this._clearRaf();
    if (this._isNativeSelection) {
      const runner = () => {
        if (!this._rafID) {
          return;
        }

        this._updateRange(state);
        this._showFormatBar();

        const result = this._autoScroll(state.y);
        if (result) {
          this._rafID = requestAnimationFrame(runner);
          return;
        }

        this._clearRaf();
      };

      this._rafID = requestAnimationFrame(runner);
    }
  };

  private _dragEndHandler: UIEventHandler = ctx => {
    if (this._isNativeSelection) {
      this._startRange = null;
      this._isNativeSelection = false;
    }
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
    this.selectionManager.rangeController.add(this._startRange);
    this.selectionManager.rangeController.add(range);
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

  private _showFormatBar = debounce(() => {
    const selection = window.getSelection();
    if (!selection) return;

    const offsetDelta = selection.anchorOffset - selection.focusOffset;
    let selectionDirection: 'left-right' | 'right-left' | 'none' = 'none';

    if (offsetDelta > 0) {
      selectionDirection = 'right-left';
    } else if (offsetDelta < 0) {
      selectionDirection = 'left-right';
    }
    const direction =
      selectionDirection === 'left-right' ? 'right-bottom' : 'left-top';
    // Show quick bar when user select text by keyboard(Shift + Arrow)
    showFormatQuickBar({
      page: this.page,
      direction,
      anchorEl: {
        getBoundingClientRect: () => {
          return calcCurrentSelectionPosition(direction);
        },
      },
    });
  }, 100);

  override mounted() {
    super.mounted();

    this._addEvent('dragStart', this._dragStartHandler);
    this._addEvent('dragMove', this._dragMoveHandler);
    this._addEvent('dragEnd', this._dragEndHandler);
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
