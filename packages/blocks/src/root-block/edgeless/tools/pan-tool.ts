import type { PointerEventState } from '@blocksuite/block-std';

import { noop } from '@blocksuite/global/utils';

import { EdgelessToolController } from './edgeless-tool.js';

type PanTool = {
  type: 'pan';
  panning: boolean;
};

export class PanToolController extends EdgelessToolController<PanTool> {
  private _lastPoint: [number, number] | null = null;

  readonly tool = {
    type: 'pan',
  } as PanTool;

  afterModeSwitch() {
    noop();
  }

  beforeModeSwitch() {
    noop();
  }

  onContainerClick(): void {
    noop();
  }

  onContainerContextMenu(): void {
    noop();
  }

  onContainerDblClick(): void {
    noop();
  }

  onContainerDragEnd() {
    this._lastPoint = null;
    this._edgeless.tools.setEdgelessTool({
      type: 'pan',
      panning: false,
    });
  }

  onContainerDragMove(e: PointerEventState) {
    if (!this._lastPoint) return;

    const { viewport } = this._service;
    const { zoom } = viewport;

    const [lastX, lastY] = this._lastPoint;
    const deltaX = lastX - e.x;
    const deltaY = lastY - e.y;

    this._lastPoint = [e.x, e.y];

    viewport.applyDeltaCenter(deltaX / zoom, deltaY / zoom);
  }

  onContainerDragStart(e: PointerEventState) {
    this._lastPoint = [e.x, e.y];
    this._edgeless.tools.setEdgelessTool({
      type: 'pan',
      panning: true,
    });
  }

  onContainerMouseMove() {
    noop();
  }

  onContainerMouseOut() {
    noop();
  }

  onContainerPointerDown(): void {
    noop();
  }

  onContainerTripleClick() {
    noop();
  }

  onPressShiftKey(_: boolean) {
    noop();
  }

  onPressSpaceBar(_pressed: boolean): void {
    noop();
  }
}

declare global {
  namespace BlockSuite {
    interface EdgelessToolMap {
      pan: PanToolController;
    }
  }
}
