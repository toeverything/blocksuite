import {
  type NoteMouseMode,
  type SelectionEvent,
} from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { addNote, DEFAULT_FRAME_WIDTH } from '../utils.js';
import { MouseModeController } from './index.js';

export class NoteModeController extends MouseModeController<NoteMouseMode> {
  readonly mouseMode = <NoteMouseMode>{
    type: 'note',
  };

  private _dragStartEvent: SelectionEvent | null = null;

  private _addNote(e: SelectionEvent, width = DEFAULT_FRAME_WIDTH) {
    addNote(this._edgeless, this._page, e, width);
  }

  onContainerClick(e: SelectionEvent): void {
    this._addNote(e);
  }

  onContainerContextMenu(e: SelectionEvent): void {
    noop();
  }

  onContainerDblClick(e: SelectionEvent): void {
    noop();
  }

  onContainerTripleClick(e: SelectionEvent) {
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
      this._addNote(startEvent, width);
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
