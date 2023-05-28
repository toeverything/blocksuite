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

    this._draggingArea.end = new DOMPoint(e.x, e.y);

    this._resize(e.keys.shift || this._edgeless.selection.shift);
  }

  onContainerDragEnd(e: PointerEventState) {
    const id = this._draggingElementId;
    assertExists(id);

    this._draggingElementId = null;
    this._draggingArea = null;

    this._page.captureSync();

    const element = this._surface.pickById(id);
    assertExists(element);
    this._edgeless.selection.switchToDefaultMode({
      selected: [element],
      active: false,
    });
  }

  onShift(pressed: boolean) {
    const id = this._draggingElementId;
    if (!id) return;

    this._resize(pressed);
  }

  private _resize(shift = false) {
    const { _draggingElementId: id, _draggingArea, _edgeless } = this;
    assertExists(id);
    assertExists(_draggingArea);

    const { slots, surface } = _edgeless;
    const { viewport } = surface;
    const { zoom } = viewport;
    const {
      start: { x: startX, y: startY },
      end,
    } = _draggingArea;
    let { x: endX, y: endY } = end;

    if (shift) {
      const w = Math.abs(endX - startX);
      const h = Math.abs(endY - startY);
      const m = Math.max(w, h);
      endX = startX + (endX > startX ? m : -m);
      endY = startY + (endY > startY ? m : -m);
    }

    const [x, y] = viewport.toModelCoord(
      Math.min(startX, endX),
      Math.min(startY, endY)
    );
    const w = Math.abs(startX - endX) / zoom;
    const h = Math.abs(startY - endY) / zoom;

    const bound = new Bound(x, y, w, h);
    surface.setElementBound(id, bound);
    slots.surfaceUpdated.emit();
  }

  onContainerMouseMove(e: PointerEventState) {
    noop();
  }

  onContainerMouseOut(e: PointerEventState) {
    noop();
  }
}
