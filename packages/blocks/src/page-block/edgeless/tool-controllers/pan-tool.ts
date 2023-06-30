import type { PointerEventState } from '@blocksuite/block-std';

import type { PanTool } from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { EdgelessToolController } from './index.js';

export class PanToolController extends EdgelessToolController<PanTool> {
  readonly tool = <PanTool>{
    type: 'pan',
  };

  private _lastPoint: [number, number] | null = null;

  onContainerClick(e: PointerEventState): void {
    noop();
  }

  onContainerContextMenu(e: PointerEventState): void {
    noop();
  }

  onContainerPointerDown(e: PointerEventState): void {
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
    this._edgeless.slots.edgelessToolUpdated.emit({
      type: 'pan',
      panning: true,
    });
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
    this._edgeless.slots.edgelessToolUpdated.emit({
      type: 'pan',
      panning: false,
    });
  }

  onContainerMouseMove(e: PointerEventState) {
    noop();
  }

  onContainerMouseOut(e: PointerEventState) {
    noop();
  }

  onPressShiftKey(_: boolean) {
    noop();
  }

  beforeModeSwitch() {
    noop();
  }

  afterModeSwitch() {
    noop();
  }
}
