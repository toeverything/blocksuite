import type {
  SelectionEvent,
  ShapeMouseMode,
} from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { SelectionController } from './index.js';
import type { SelectionArea } from '../selection-manager.js';
import { assertExists } from '@blocksuite/global/utils';

export class ShapeSelectionController extends SelectionController<ShapeMouseMode> {
  readonly mouseMode = <ShapeMouseMode>{
    type: 'shape',
    color: 'black',
    shape: 'rectangle',
  };

  private _draggingShapeBlockId: string | null = null;

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
  onContainerDragStart(e: SelectionEvent): void {
    this._container.page.captureSync();
    // create a shape block when drag start
    const [modelX, modelY] = this._container.viewport.toModelCoord(e.x, e.y);
    this._draggingShapeBlockId = this._container.page.addBlock({
      flavour: 'affine:shape',
      xywh: JSON.stringify([modelX, modelY, 0, 0]),
      color: this.mouseMode.color,
      type: this.mouseMode.shape,
    });
    this._draggingArea = {
      start: new DOMPoint(e.x, e.y),
      end: new DOMPoint(e.x, e.y),
    };
    this._container.signals.shapeUpdated.emit();
  }

  onContainerDragMove(e: SelectionEvent): void {
    assertExists(this._draggingShapeBlockId);
    assertExists(this._draggingArea);
    this._draggingArea.end = new DOMPoint(e.x, e.y);
    const [x, y] = this._container.viewport.toModelCoord(
      Math.min(this._draggingArea.start.x, this._draggingArea.end.x),
      Math.min(this._draggingArea.start.y, this._draggingArea.end.y)
    );
    const w =
      Math.abs(this._draggingArea.start.x - this._draggingArea.end.x) /
      this._container.viewport.zoom;
    const h =
      Math.abs(this._draggingArea.start.y - this._draggingArea.end.y) /
      this._container.viewport.zoom;
    this._container.page.updateBlockById(this._draggingShapeBlockId, {
      xywh: JSON.stringify([x, y, w, h]),
    });
    this._container.signals.shapeUpdated.emit();
  }

  onContainerDragEnd(e: SelectionEvent): void {
    this._draggingShapeBlockId = null;
    this._draggingArea = null;
    this._container.page.captureSync();
    this._container.signals.shapeUpdated.emit();
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
