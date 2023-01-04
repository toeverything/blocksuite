import type {
  HandwritingMode,
  SelectionEvent,
} from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { SelectionController } from './index.js';

export class HandwritingSelectionController extends SelectionController<HandwritingMode> {
  readonly mouseMode = <HandwritingMode>{
    type: 'handwriting',
  };

  onContainerClick(e: SelectionEvent): void {
    noop();
  }

  onContainerContextMenu(e: SelectionEvent): void {
    noop();
  }

  onContainerDblClick(e: SelectionEvent): void {
    noop();
  }
  onContainerDragStart(e: SelectionEvent): void {
    noop();
  }

  onContainerDragMove(e: SelectionEvent): void {
    noop();
  }

  onContainerDragEnd(e: SelectionEvent): void {
    noop();
  }

  onContainerMouseMove(e: SelectionEvent): void {
    noop();
  }

  onContainerMouseOut(e: SelectionEvent): void {
    noop();
  }

  syncBlockSelectionRect() {
    noop();
  }
}
