import type { EventName, UIEventHandler } from '@blocksuite/block-std';
import { BlockService } from '@blocksuite/block-std';

import type { PageBlockModel } from '../page-model.js';
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

export class DefaultPageService extends BlockService<PageBlockModel> {
  selection: DefaultSelectionManager | null = null;

  private _isNativeSelection = false;
  private _startRange: Range | null = null;

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
    if (this._isNativeSelection && this._startRange) {
      const caret = caretFromPoint(state.x, state.y);
      if (!caret) {
        return;
      }

      if (caret.node.nodeType !== Node.TEXT_NODE) {
        return;
      }

      caret.node.parentElement
        ?.closest('v-line')
        ?.scrollIntoView({ block: 'nearest' });

      const range = rangeFromCaret(caret);
      this.selectionManager.rangeController.add(this._startRange);
      this.selectionManager.rangeController.add(range);

      this._isNativeSelection = true;
    }
  };

  private _dragEndHandler: UIEventHandler = ctx => {
    if (this._isNativeSelection) {
      this._startRange = null;
      this._isNativeSelection = false;
    }
  };

  override mounted() {
    super.mounted();

    this._addEvent('dragStart', this._dragStartHandler);

    this._addEvent('dragMove', this._dragMoveHandler);

    this._addEvent('dragEnd', this._dragEndHandler);
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
    this.unmountSelectionManager();
  }
}
