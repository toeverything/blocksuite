import type {
  SelectionEvent,
  ShapeMouseMode,
} from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { SelectionController } from './index.js';
import type { SelectionArea } from '../selection-manager.js';
import { assertExists } from '@blocksuite/global/utils';
import { RectElement } from '@blocksuite/phasor';

// FIXME use nanoid
let i = 0;

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

  onContainerDragStart(e: SelectionEvent) {
    this._page.captureSync();

    // create a shape block when drag start
    const [modelX, modelY] = this._edgeless.viewport.toModelCoord(e.x, e.y);

    if (this._page.awareness.getFlag('enable_surface')) {
      const element1 = new RectElement(`${i++}`);
      element1.setBound(modelX, modelY, 100, 100);
      element1.color = 'red';
      this._surface.addElement(element1);
    }

    /*
    this._draggingShapeBlockId = this._page.addBlock({
      flavour: 'affine:shape',
      xywh: JSON.stringify([modelX, modelY, 0, 0]),
      color: this.mouseMode.color,
      type: this.mouseMode.shape,
    });
    this._draggingArea = {
      start: new DOMPoint(e.x, e.y),
      end: new DOMPoint(e.x, e.y),
    };
    this._edgeless.signals.shapeUpdated.emit();
    */
  }

  onContainerDragMove(e: SelectionEvent) {
    // FIXME
    if (this._page.awareness.getFlag('enable_surface')) return;

    assertExists(this._draggingShapeBlockId);
    assertExists(this._draggingArea);
    this._draggingArea.end = new DOMPoint(e.x, e.y);
    const [x, y] = this._edgeless.viewport.toModelCoord(
      Math.min(this._draggingArea.start.x, this._draggingArea.end.x),
      Math.min(this._draggingArea.start.y, this._draggingArea.end.y)
    );
    const w =
      Math.abs(this._draggingArea.start.x - this._draggingArea.end.x) /
      this._edgeless.viewport.zoom;
    const h =
      Math.abs(this._draggingArea.start.y - this._draggingArea.end.y) /
      this._edgeless.viewport.zoom;
    this._page.updateBlockById(this._draggingShapeBlockId, {
      xywh: JSON.stringify([x, y, w, h]),
    });
    this._edgeless.signals.shapeUpdated.emit();
  }

  onContainerDragEnd(e: SelectionEvent) {
    this._draggingShapeBlockId = null;
    this._draggingArea = null;
    this._page.captureSync();
    this._edgeless.signals.shapeUpdated.emit();
  }

  onContainerMouseMove(e: SelectionEvent) {
    noop();
  }

  onContainerMouseOut(e: SelectionEvent) {
    noop();
  }

  syncBlockSelectionRect() {
    noop();
  }
}
