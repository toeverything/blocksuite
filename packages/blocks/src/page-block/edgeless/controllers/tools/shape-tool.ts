import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, noop } from '@blocksuite/global/utils';

import type {
  EdgelessTool,
  ShapeTool,
} from '../../../../_common/utils/index.js';
import { hasClassNameInList } from '../../../../_common/utils/index.js';
import type { ShapeElementModel } from '../../../../surface-block/index.js';
import { Bound, CanvasElementType } from '../../../../surface-block/index.js';
import type { SelectionArea } from '../../services/tools-manager.js';
import {
  EXCLUDING_MOUSE_OUT_CLASS_LIST,
  SHAPE_OVERLAY_HEIGHT,
  SHAPE_OVERLAY_OPTIONS,
  SHAPE_OVERLAY_WIDTH,
} from '../../utils/consts.js';
import { ShapeOverlay } from '../../utils/tool-overlay.js';
import { EdgelessToolController } from './index.js';

export class ShapeToolController extends EdgelessToolController<ShapeTool> {
  readonly tool = <ShapeTool>{
    type: 'shape',
    shapeType: 'rect',
  };

  private _draggingElement: ShapeElementModel | null = null;
  private _draggingElementId: string | null = null;

  // shape overlay
  private _shapeOverlay: ShapeOverlay | null = null;

  protected override _draggingArea: SelectionArea | null = null;

  private _addNewShape(
    e: PointerEventState,
    width: number,
    height: number
  ): string {
    const { viewport } = this._service;
    const attributes = this._edgeless.service.editSession.getLastProps('shape');
    const { shapeType } = this.tool;
    if (shapeType === 'rect' && attributes.radius > 0) {
      width += 40;
    }
    // create a shape block when drag start
    const [modelX, modelY] = viewport.toModelCoord(e.point.x, e.point.y);
    const bound = new Bound(modelX, modelY, width, height);

    const id = this._service.addElement(CanvasElementType.SHAPE, {
      shapeType: shapeType,
      xywh: bound.serialize(),
      radius: attributes.radius,
    });

    return id;
  }

  onContainerClick(e: PointerEventState): void {
    this.clearOverlay();

    this._page.captureSync();

    const id = this._addNewShape(e, SHAPE_OVERLAY_WIDTH, SHAPE_OVERLAY_HEIGHT);

    const element = this._service.getElementById(id);
    assertExists(element);

    this._edgeless.tools.switchToDefaultMode({
      elements: [element.id],
      editing: false,
    });
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
    this.clearOverlay();

    this._page.captureSync();

    const id = this._addNewShape(e, 0, 0);

    this._draggingElementId = id;
    this._draggingElement = this._service.getElementById(
      id
    ) as ShapeElementModel;
    this._draggingElement.stash('xywh');
    this._draggingArea = {
      start: new DOMPoint(e.x, e.y),
      end: new DOMPoint(e.x, e.y),
    };
  }

  onContainerDragMove(e: PointerEventState) {
    assertExists(this._draggingElementId);
    assertExists(this._draggingArea);

    this._draggingArea.end = new DOMPoint(e.x, e.y);

    this._resize(e.keys.shift || this._edgeless.tools.shiftKey);
  }

  onContainerDragEnd() {
    if (this._draggingElement) {
      const draggingElement = this._draggingElement;

      this._page.transact(() => {
        draggingElement.pop('xywh');
      });
    }

    const id = this._draggingElementId;
    assertExists(id);

    if (this._draggingArea) {
      const width = Math.abs(
        this._draggingArea?.end.x - this._draggingArea?.start.x
      );
      const height = Math.abs(
        this._draggingArea?.end.y - this._draggingArea?.start.y
      );
      if (width < 20 && height < 20) {
        this._service.removeElement(id);
        return;
      }
    }

    this._draggingElement = null;
    this._draggingElementId = null;
    this._draggingArea = null;

    this._page.captureSync();

    const element = this._service.getElementById(id);
    assertExists(element);
    this._edgeless.tools.switchToDefaultMode({
      elements: [element.id],
      editing: false,
    });
  }

  onPressShiftKey(pressed: boolean) {
    const id = this._draggingElementId;
    if (!id) return;

    this._resize(pressed);
  }

  private _resize(shift = false) {
    const { _draggingElementId: id, _draggingArea } = this;
    assertExists(id);
    assertExists(_draggingArea);

    const { viewport } = this._service;
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

    this._service.updateElement(id, {
      xywh: bound.serialize(),
    });
  }

  private _updateOverlayPosition(x: number, y: number) {
    if (!this._shapeOverlay) return;
    this._shapeOverlay.x = x;
    this._shapeOverlay.y = y;
    this._edgeless.surface.refresh();
  }

  clearOverlay() {
    if (!this._shapeOverlay) return;

    this._shapeOverlay.dispose();
    this._edgeless.surface.renderer.removeOverlay(this._shapeOverlay);
    this._shapeOverlay = null;
    this._edgeless.surface.refresh();
  }

  private _hideOverlay() {
    if (!this._shapeOverlay) return;

    this._shapeOverlay.globalAlpha = 0;
    this._edgeless.surface.refresh();
  }

  onContainerMouseMove(e: PointerEventState) {
    if (!this._shapeOverlay) return;
    // shpae options, like stroke color, fill color, etc.
    if (this._shapeOverlay.globalAlpha === 0)
      this._shapeOverlay.globalAlpha = 1;
    const [x, y] = this._service.viewport.toModelCoord(e.x, e.y);
    this._updateOverlayPosition(x, y);
  }

  onContainerMouseOut(e: PointerEventState) {
    if (
      e.raw.relatedTarget &&
      hasClassNameInList(
        e.raw.relatedTarget as Element,
        EXCLUDING_MOUSE_OUT_CLASS_LIST
      )
    )
      return;
    this._hideOverlay();
  }

  beforeModeSwitch() {
    this.clearOverlay();
  }

  afterModeSwitch(newTool: EdgelessTool) {
    if (newTool.type !== 'shape') return;
    this.createOverlay();
  }

  createOverlay() {
    this.clearOverlay();
    const options = SHAPE_OVERLAY_OPTIONS;
    const attributes = this._edgeless.service.editSession.getLastProps('shape');
    options.stroke = attributes.strokeColor;
    options.fill = attributes.fillColor;

    switch (attributes.strokeStyle!) {
      case 'dash':
        options.strokeLineDash = [12, 12];
        break;
      case 'none':
        options.strokeLineDash = [];
        options.stroke = 'transparent';
        break;
      default:
        options.strokeLineDash = [];
    }
    let shapeType: string = attributes.shapeType;
    if (attributes.radius > 0 && shapeType === 'rect') {
      shapeType = 'roundedRect';
    }
    this._shapeOverlay = new ShapeOverlay(this._edgeless, shapeType, options, {
      shapeStyle: attributes.shapeStyle,
      fillColor: options.fill,
      strokeColor: options.stroke,
    });
    this._edgeless.surface.renderer.addOverlay(this._shapeOverlay);
  }
}
