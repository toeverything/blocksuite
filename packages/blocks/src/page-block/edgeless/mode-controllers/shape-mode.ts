import { assertExists } from '@blocksuite/global/utils';
import type { PointerEventState } from '@blocksuite/lit';
import { Bound, StrokeStyle } from '@blocksuite/phasor';

import type { ShapeMouseMode } from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import { isTransparent } from '../components/color-panel.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
} from '../components/component-toolbar/change-shape-button.js';
import type { SelectionArea } from '../selection-manager.js';
import { MouseModeController } from './index.js';

export class ShapeModeController extends MouseModeController<ShapeMouseMode> {
  readonly mouseMode = <ShapeMouseMode>{
    type: 'shape',
    shape: 'rect',
    fillColor: DEFAULT_SHAPE_FILL_COLOR,
    strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
  };

  private _draggingElementId: string | null = null;

  protected override _draggingArea: SelectionArea | null = null;

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
    const bound = new Bound(modelX, modelY, 0, 0);
    const { shape, fillColor, strokeColor } = this.mouseMode;

    const shapeType = shape === 'roundedRect' ? 'rect' : shape;

    const id = this._surface.addElement('shape', {
      shapeType,
      xywh: bound.serialize(),
      strokeColor,
      fillColor,
      filled: !isTransparent(fillColor),
      radius: shape === 'roundedRect' ? 0.1 : 0,
      strokeWidth: 4,
      strokeStyle: StrokeStyle.Solid,
    });

    this._draggingElementId = id;

    this._draggingArea = {
      start: new DOMPoint(e.x, e.y),
      end: new DOMPoint(e.x, e.y),
    };
    this._edgeless.slots.surfaceUpdated.emit();
  }

  onContainerDragMove(e: PointerEventState) {
    if (!this._page.awarenessStore.getFlag('enable_surface')) return;

    assertExists(this._draggingElementId);
    assertExists(this._draggingArea);

    const { viewport } = this._edgeless.surface;

    let endX = e.x;
    let endY = e.y;
    if (e.keys.shift) {
      const { x: startX, y: startY } = this._draggingArea.start;
      const w = Math.abs(endX - startX) / viewport.zoom;
      const h = Math.abs(endY - startY) / viewport.zoom;
      const maxLength = Math.max(w, h);
      endX = endX > startX ? startX + maxLength : startX - maxLength;
      endY = endY > startY ? startY + maxLength : startY - maxLength;
    }
    this._draggingArea.end = new DOMPoint(endX, endY);

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

  onContainerDragEnd(e: PointerEventState) {
    this._draggingElementId = null;
    this._draggingArea = null;
    this._page.captureSync();
    this._edgeless.slots.surfaceUpdated.emit();
  }

  onContainerMouseMove(e: PointerEventState) {
    noop();
  }

  onContainerMouseOut(e: PointerEventState) {
    noop();
  }

  clearSelection() {
    noop();
  }
}
