import type {
  PanMouseMode,
  SelectionEvent,
} from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { MouseModeController } from './index.js';

export class PanModeController extends MouseModeController<PanMouseMode> {
  readonly mouseMode = <PanMouseMode>{
    type: 'pan',
  };

  private _lastPoint: [number, number] | null = null;

  onContainerClick(e: SelectionEvent): void {
    noop();
  }

  onContainerContextMenu(e: SelectionEvent): void {
    noop();
  }

  onContainerDblClick(e: SelectionEvent): void {
    noop();
  }

  onContainerDragStart(e: SelectionEvent) {
    if (!this._page.awarenessStore.getFlag('enable_surface')) return;

    this._lastPoint = [e.x, e.y];
  }

  onContainerDragMove(e: SelectionEvent) {
    if (!this._page.awarenessStore.getFlag('enable_surface')) return;
    if (!this._lastPoint) return;

    const [lastX, lastY] = this._lastPoint;
    const deltaX = lastX - e.x;
    const deltaY = lastY - e.y;

    this._lastPoint = [e.x, e.y];

    this._edgeless.viewport.applyDeltaCenter(deltaX, deltaY);

    this._edgeless.signals.surfaceUpdated.emit();
  }

  onContainerDragEnd() {
    this._lastPoint = null;
  }

  onContainerMouseMove(e: SelectionEvent) {
    noop();
  }

  onContainerMouseOut(e: SelectionEvent) {
    noop();
  }

  syncSelectionRect() {
    noop();
  }

  clearSelection() {
    noop();
  }
}
