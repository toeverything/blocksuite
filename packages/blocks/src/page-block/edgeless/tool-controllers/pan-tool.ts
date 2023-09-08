import type { PointerEventState } from '@blocksuite/block-std';
import { noop } from '@blocksuite/global/utils';

import type { PanTool } from '../../../__internal__/index.js';
import { EdgelessToolController } from './index.js';

export class PanToolController extends EdgelessToolController<PanTool> {
  readonly tool = <PanTool>{
    type: 'pan',
  };

  private _lastPoint: [number, number] | null = null;

  onContainerClick(): void {
    noop();
  }

  onContainerContextMenu(): void {
    noop();
  }

  onContainerPointerDown(): void {
    noop();
  }

  onContainerDblClick(): void {
    noop();
  }

  onContainerTripleClick() {
    noop();
  }

  onContainerDragStart(e: PointerEventState) {
    this._lastPoint = [e.x, e.y];
    this._edgeless.slots.edgelessToolUpdated.emit({
      type: 'pan',
      panning: true,
    });
  }

  onContainerDragMove(e: PointerEventState) {
    if (!this._lastPoint) return;

    const { viewport } = this._edgeless.surface;
    const { zoom } = viewport;

    const [lastX, lastY] = this._lastPoint;
    const deltaX = lastX - e.x;
    const deltaY = lastY - e.y;

    this._lastPoint = [e.x, e.y];

    viewport.applyDeltaCenter(deltaX / zoom, deltaY / zoom);
  }

  onContainerDragEnd() {
    this._lastPoint = null;
    this._edgeless.slots.edgelessToolUpdated.emit({
      type: 'pan',
      panning: false,
    });
  }

  onContainerMouseMove() {
    noop();
  }

  onContainerMouseOut() {
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
