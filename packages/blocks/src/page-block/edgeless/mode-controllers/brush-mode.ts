import { assertExists } from '@blocksuite/global/utils';

import type {
  BrushMouseMode,
  SelectionEvent,
} from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { MouseModeController } from './index.js';

export class BrushModeController extends MouseModeController<BrushMouseMode> {
  readonly mouseMode = <BrushMouseMode>{
    type: 'brush',
    color: '#000000',
  };

  private _draggingElementId: string | null = null;

  protected _draggingStartPoint: [number, number] | null = null;
  protected _draggingPathPoints: number[][] | null = null;

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

    this._page.captureSync();

    // create a shape block when drag start
    const [modelX, modelY] = this._edgeless.viewport.toModelCoord(e.x, e.y);
    const { color } = this.mouseMode;

    const points = [[0, 0]];
    const id = this._surface.addBrushElement(modelX, modelY, color, points);
    this._draggingElementId = id;

    this._draggingPathPoints = points;
    this._draggingStartPoint = [e.x, e.y];

    this._edgeless.signals.shapeUpdated.emit();
  }

  onContainerDragMove(e: SelectionEvent) {
    if (!this._page.awarenessStore.getFlag('enable_surface')) return;
    if (!this._draggingElementId) return;

    assertExists(this._draggingElementId);
    assertExists(this._draggingPathPoints);
    assertExists(this._draggingStartPoint);

    this._draggingPathPoints.push([
      e.x - this._draggingStartPoint[0],
      e.y - this._draggingStartPoint[1],
    ]);
    this._surface.updateBrushElementPoints(
      this._draggingElementId,
      this._draggingPathPoints
    );

    this._edgeless.signals.shapeUpdated.emit();
  }

  onContainerDragEnd(e: SelectionEvent) {
    this._draggingElementId = null;
    this._draggingPathPoints = null;
    this._draggingStartPoint = null;
    this._page.captureSync();
    this._edgeless.signals.shapeUpdated.emit();
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
