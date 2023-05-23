import {
  type SelectionEvent,
  type TextMouseMode,
} from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { addText } from '../utils.js';
import { MouseModeController } from './index.js';

export class TextModeController extends MouseModeController<TextMouseMode> {
  readonly mouseMode = <TextMouseMode>{
    type: 'text',
  };

  onContainerClick(e: SelectionEvent): void {
    addText(this._edgeless, e);
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
    noop();
  }

  onContainerDragMove(e: SelectionEvent) {
    noop();
  }

  onContainerDragEnd(e: SelectionEvent) {
    noop();
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
