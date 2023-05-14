import { assertExists } from '@blocksuite/global/utils';

import type {
  BrushMouseMode,
  SelectionEvent,
} from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { DEFAULT_SELECTED_COLOR } from '../components/color-panel.js';
import { MouseModeController } from './index.js';

export class BrushModeController extends MouseModeController<BrushMouseMode> {
  readonly mouseMode = <BrushMouseMode>{
    type: 'brush',
    color: DEFAULT_SELECTED_COLOR,
    lineWidth: 4,
  };

  private _draggingElementId: string | null = null;
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

  onContainerTripleClick(e: SelectionEvent) {
    noop();
  }

  onContainerDragStart(e: SelectionEvent) {
    if (!this._page.awarenessStore.getFlag('enable_surface')) return;

    this._page.captureSync();
    const { viewport } = this._edgeless.surface;

    // create a shape block when drag start
    const [modelX, modelY] = viewport.toModelCoord(e.x, e.y);
    const { color, lineWidth } = this.mouseMode;
    const points =
      e.raw instanceof PointerEvent
        ? [[modelX, modelY, e.raw.pressure]]
        : [[modelX, modelY]];

    const id = this._surface.addElement('brush', {
      points,
      color,
      lineWidth,
    });

    this._draggingElementId = id;
    this._draggingPathPoints = points;

    this._edgeless.slots.surfaceUpdated.emit();
  }

  onContainerDragMove(e: SelectionEvent) {
    if (!this._page.awarenessStore.getFlag('enable_surface')) return;
    if (!this._draggingElementId) return;

    assertExists(this._draggingElementId);
    assertExists(this._draggingPathPoints);

    const { lineWidth } = this.mouseMode;

    const [modelX, modelY] = this._edgeless.surface.toModelCoord(e.x, e.y);

    const points = [...this._draggingPathPoints, [modelX, modelY]];

    this._draggingPathPoints = points;

    this._surface.updateElement(this._draggingElementId, {
      points,
      lineWidth,
    });

    this._edgeless.slots.surfaceUpdated.emit();
  }

  onContainerDragEnd(e: SelectionEvent) {
    this._draggingElementId = null;
    this._draggingPathPoints = null;
    this._page.captureSync();
    this._edgeless.slots.surfaceUpdated.emit();
  }

  onContainerMouseMove(e: SelectionEvent) {
    noop();
  }

  onContainerMouseOut(e: SelectionEvent) {
    noop();
  }

  clearSelection() {
    noop();
  }
}
