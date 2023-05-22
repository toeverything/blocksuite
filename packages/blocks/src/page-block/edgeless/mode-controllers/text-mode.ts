import type { PointerEventState } from '@blocksuite/lit';

import type { TextMouseMode } from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { addText, DEFAULT_FRAME_WIDTH } from '../utils.js';
import { MouseModeController } from './index.js';

export class TextModeController extends MouseModeController<TextMouseMode> {
  readonly mouseMode = <TextMouseMode>{
    type: 'text',
  };

  private _dragStartEvent: PointerEventState | null = null;

  private _addText(e: PointerEventState, width = DEFAULT_FRAME_WIDTH) {
    addText(this._edgeless, this._page, e, width);
  }

  onContainerClick(e: PointerEventState): void {
    this._addText(e);
  }

  onContainerContextMenu(e: PointerEventState): void {
    noop();
  }

  onContainerDblClick(e: PointerEventState): void {
    noop();
  }

  onContainerTripleClick(e: PointerEventState) {
    noop();
  }

  onContainerDragStart(e: PointerEventState) {
    this._dragStartEvent = e;
    this._draggingArea = {
      start: new DOMPoint(e.x, e.y),
      end: new DOMPoint(e.x, e.y),
    };
  }

  onContainerDragMove(e: PointerEventState) {
    if (this._draggingArea) {
      this._draggingArea.end = new DOMPoint(e.x, e.y);
      this._edgeless.slots.hoverUpdated.emit();
    }
  }

  onContainerDragEnd(e: PointerEventState) {
    if (this._dragStartEvent) {
      const startEvent =
        e.x > this._dragStartEvent.x ? this._dragStartEvent : e;
      const width = Math.max(
        Math.abs(e.x - this._dragStartEvent.x),
        DEFAULT_FRAME_WIDTH
      );
      this._addText(startEvent, width);
    }

    this._dragStartEvent = null;
    this._draggingArea = null;
  }

  onContainerMouseMove(e: PointerEventState) {
    noop();
  }

  onContainerMouseOut(e: PointerEventState) {
    noop();
  }

  syncDraggingArea() {
    noop();
  }

  clearSelection() {
    noop();
  }
}
