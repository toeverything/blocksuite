import { assertExists } from '@blocksuite/global/utils';
import type { PointerEventState } from '@blocksuite/lit';

import type { BrushMouseMode } from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { DEFAULT_LINE_COLOR } from '../components/color-panel.js';
import { MouseModeController } from './index.js';

export class BrushModeController extends MouseModeController<BrushMouseMode> {
  readonly mouseMode = <BrushMouseMode>{
    type: 'brush',
    color: DEFAULT_LINE_COLOR,
    lineWidth: 4,
  };

  private _draggingElementId: string | null = null;
  protected _draggingPathPoints: number[][] | null = null;

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

    this._page.captureSync();
    const { viewport } = this._edgeless.surface;

    // create a shape block when drag start
    const [modelX, modelY] = viewport.toModelCoord(e.point.x, e.point.y);
    const { color, lineWidth } = this.mouseMode;
    const points = [[modelX, modelY]];

    const id = this._surface.addElement('brush', {
      points,
      color,
      lineWidth,
    });

    this._draggingElementId = id;
    this._draggingPathPoints = points;

    this._edgeless.slots.surfaceUpdated.emit();
  }

  onContainerDragMove(e: PointerEventState) {
    if (!this._page.awarenessStore.getFlag('enable_surface')) return;
    if (!this._draggingElementId) return;

    assertExists(this._draggingElementId);
    assertExists(this._draggingPathPoints);

    const { lineWidth } = this.mouseMode;

    const [modelX, modelY] = this._edgeless.surface.toModelCoord(
      e.point.x,
      e.point.y
    );

    const points = [...this._draggingPathPoints, [modelX, modelY]];

    this._draggingPathPoints = points;

    this._surface.updateElement<'brush'>(this._draggingElementId, {
      points,
      lineWidth,
    });

    this._edgeless.slots.surfaceUpdated.emit();
  }

  onContainerDragEnd(e: PointerEventState) {
    this._draggingElementId = null;
    this._draggingPathPoints = null;
    this._page.captureSync();
    this._edgeless.slots.surfaceUpdated.emit();
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
}
