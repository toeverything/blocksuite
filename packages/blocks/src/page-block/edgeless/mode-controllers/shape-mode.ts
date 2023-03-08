import { assertExists } from '@blocksuite/global/utils';
import { Bound } from '@blocksuite/phasor';

import type {
  SelectionEvent,
  ShapeMouseMode,
} from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import type { SelectionArea } from '../selection-manager.js';
import { MouseModeController } from './index.js';

export class ShapeModeController extends MouseModeController<ShapeMouseMode> {
  readonly mouseMode = <ShapeMouseMode>{
    type: 'shape',
    color: '#000000',
    shape: 'rect',
  };

  private _draggingElementId: string | null = null;

  protected _draggingArea: SelectionArea | null = null;

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
    const { viewport } = this._edgeless.surface;

    // create a shape block when drag start
    const [modelX, modelY] = viewport.toModelCoord(e.x, e.y);
    const bound = new Bound(modelX, modelY, 0, 0);
    const { shape, color } = this.mouseMode;

    const shapeType = shape === 'roundedRect' ? 'rect' : shape;
    const shapeProps = {
      strokeColor: color,
      radius: shape === 'roundedRect' ? 0.1 : 0,
    };
    const id = this._surface.addShapeElement(bound, shapeType, shapeProps);
    this._draggingElementId = id;

    this._draggingArea = {
      start: new DOMPoint(e.x, e.y),
      end: new DOMPoint(e.x, e.y),
    };
    this._edgeless.slots.surfaceUpdated.emit();
  }

  onContainerDragMove(e: SelectionEvent) {
    if (!this._page.awarenessStore.getFlag('enable_surface')) return;

    assertExists(this._draggingElementId);
    assertExists(this._draggingArea);

    const { viewport } = this._edgeless.surface;

    this._draggingArea.end = new DOMPoint(e.x, e.y);

    const [x, y] = viewport.toModelCoord(
      Math.min(this._draggingArea.start.x, this._draggingArea.end.x),
      Math.min(this._draggingArea.start.y, this._draggingArea.end.y)
    );
    const w =
      Math.abs(this._draggingArea.start.x - this._draggingArea.end.x) /
      viewport.zoom;
    const h =
      Math.abs(this._draggingArea.start.y - this._draggingArea.end.y) /
      viewport.zoom;

    const bound = new Bound(x, y, w, h);
    const id = this._draggingElementId;
    this._surface.setElementBound(id, bound);
    this._edgeless.slots.surfaceUpdated.emit();
  }

  onContainerDragEnd(e: SelectionEvent) {
    this._draggingElementId = null;
    this._draggingArea = null;
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
