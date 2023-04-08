import {
  handleNativeRangeAtPoint,
  noop,
  Point,
  type SelectionEvent,
  type TextMouseMode,
} from '@blocksuite/blocks/std';

import { DEFAULT_FRAME_WIDTH } from '../utils.js';
import { MouseModeController } from './index.js';

export class TextModeController extends MouseModeController<TextMouseMode> {
  readonly mouseMode = <TextMouseMode>{
    type: 'text',
  };

  private _dragStartEvent: SelectionEvent | null = null;

  private _addText(e: SelectionEvent, width = DEFAULT_FRAME_WIDTH) {
    const frameId = this._edgeless.addFrameWithPoint(
      new Point(e.x, e.y),
      width
    );
    this._page.addBlock('affine:paragraph', {}, frameId);
    this._edgeless.slots.mouseModeUpdated.emit({ type: 'default' });

    // Wait for mouseMode updated
    requestAnimationFrame(() => {
      const element = this._blocks.find(b => b.id === frameId);
      if (element) {
        const selectionState = {
          selected: [element],
          active: true,
        };
        this._edgeless.slots.selectionUpdated.emit(selectionState);

        // Waiting dom updated, `frame mask` is removed
        this._edgeless.updateComplete.then(() => {
          // Cannot reuse `handleNativeRangeClick` directly here,
          // since `retargetClick` will re-target to pervious editor
          handleNativeRangeAtPoint(e.raw.clientX, e.raw.clientY);
        });
      }
    });
  }

  onContainerClick(e: SelectionEvent): void {
    this._addText(e);
  }

  onContainerContextMenu(e: SelectionEvent): void {
    noop();
  }

  onContainerDblClick(e: SelectionEvent): void {
    noop();
  }

  onContainerDragStart(e: SelectionEvent) {
    this._dragStartEvent = e;
    this._draggingArea = {
      start: new DOMPoint(e.x, e.y),
      end: new DOMPoint(e.x, e.y),
    };
  }

  onContainerDragMove(e: SelectionEvent) {
    if (this._draggingArea) {
      this._draggingArea.end = new DOMPoint(e.x, e.y);
      this._edgeless.slots.hoverUpdated.emit();
    }
  }

  onContainerDragEnd(e: SelectionEvent) {
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

  onContainerMouseMove(e: SelectionEvent) {
    noop();
  }

  onContainerMouseOut(e: SelectionEvent) {
    noop();
  }

  syncDraggingArea() {
    noop();
  }

  clearSelection() {
    noop();
  }
}
