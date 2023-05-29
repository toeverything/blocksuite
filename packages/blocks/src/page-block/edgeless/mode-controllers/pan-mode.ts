import type { PointerEventState } from '@blocksuite/lit';

import type { PanMouseMode } from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { MouseModeController } from './index.js';

export class PanModeController extends MouseModeController<PanMouseMode> {
  readonly mouseMode = <PanMouseMode>{
    type: 'pan',
  };

  private _lastPoint: [number, number] | null = null;

  onContainerClick(e: PointerEventState): void {
    noop();
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
    if (!this._page.awarenessStore.getFlag('enable_surface')) return;

    this._lastPoint = [e.x, e.y];
    this._edgeless.slots.mouseModeUpdated.emit({ type: 'pan', panning: true });
  }

  onContainerDragMove(e: PointerEventState) {
    if (!this._page.awarenessStore.getFlag('enable_surface')) return;
    if (!this._lastPoint) return;

    const { viewport } = this._edgeless.surface;
    const { zoom } = viewport;

    const [lastX, lastY] = this._lastPoint;
    const deltaX = lastX - e.x;
    const deltaY = lastY - e.y;

    this._lastPoint = [e.x, e.y];

    viewport.applyDeltaCenter(deltaX / zoom, deltaY / zoom);

    this._edgeless.slots.viewportUpdated.emit();
  }

  onContainerDragEnd() {
    this._lastPoint = null;
    this._edgeless.slots.mouseModeUpdated.emit({ type: 'pan', panning: false });
  }

  onContainerMouseMove(e: PointerEventState) {
    noop();
  }

  onContainerMouseOut(e: PointerEventState) {
    noop();
  }

  onPressShift(_: boolean) {
    noop();
  }
}
