import type { ShapeElementModel, ShapeName } from '@blocksuite/affine-model';
import type { PointerEventState } from '@blocksuite/block-std';
import type { IVec } from '@blocksuite/global/utils';

import { CanvasElementType } from '@blocksuite/affine-block-surface';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
  getShapeType,
  ShapeType,
} from '@blocksuite/affine-model';
import {
  EditPropsStore,
  TelemetryProvider,
} from '@blocksuite/affine-shared/services';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { Bound, noop } from '@blocksuite/global/utils';

import type { SelectionArea } from '../services/tools-manager.js';
import type { EdgelessTool } from '../types.js';

import { hasClassNameInList } from '../../../_common/utils/index.js';
import {
  EXCLUDING_MOUSE_OUT_CLASS_LIST,
  SHAPE_OVERLAY_HEIGHT,
  SHAPE_OVERLAY_OPTIONS,
  SHAPE_OVERLAY_WIDTH,
} from '../utils/consts.js';
import { ShapeOverlay } from '../utils/tool-overlay.js';
import { EdgelessToolController } from './edgeless-tool.js';

export type ShapeTool = {
  type: 'shape';
  shapeName: ShapeName;
};

export class ShapeToolController extends EdgelessToolController<ShapeTool> {
  private _disableOverlay = false;

  private _draggingElement: ShapeElementModel | null = null;

  private _draggingElementId: string | null = null;

  private _moveWithSpaceShapePosTemp: SelectionArea | null = null;

  // For moving selection with space with mouse
  private _moveWithSpaceStartPos: IVec = [0, 0];

  // shape overlay
  private _shapeOverlay: ShapeOverlay | null = null;

  protected override _draggingArea: SelectionArea | null = null;

  readonly tool: ShapeTool = {
    type: 'shape',
    shapeName: ShapeType.Rect,
  };

  private _addNewShape(
    e: PointerEventState,
    width: number,
    height: number
  ): string {
    const { viewport } = this._service;
    const { shapeName } = this.tool;
    const attributes =
      this._edgeless.std.get(EditPropsStore).lastProps$.value[
        `shape:${shapeName}`
      ];

    if (shapeName === 'roundedRect') {
      width += 40;
    }
    // create a shape block when drag start
    const [modelX, modelY] = viewport.toModelCoord(e.point.x, e.point.y);
    const bound = new Bound(modelX, modelY, width, height);

    const id = this._service.addElement(CanvasElementType.SHAPE, {
      shapeType: getShapeType(shapeName),
      xywh: bound.serialize(),
      radius: attributes.radius,
    });

    this._service.std
      .getOptional(TelemetryProvider)
      ?.track('CanvasElementAdded', {
        control: 'canvas:draw',
        page: 'whiteboard editor',
        module: 'toolbar',
        segment: 'toolbar',
        type: CanvasElementType.SHAPE,
        other: {
          shapeName,
        },
      });

    return id;
  }

  private _hideOverlay() {
    if (!this._shapeOverlay) return;

    this._shapeOverlay.globalAlpha = 0;
    this._edgeless.surface.refresh();
  }

  private _move() {
    const {
      _draggingArea,
      _moveWithSpaceStartPos,
      _moveWithSpaceShapePosTemp,
    } = this;
    if (!_draggingArea) return;
    if (!_moveWithSpaceShapePosTemp) return;

    const { x: moveCurX, y: moveCurY } = _draggingArea.end;

    const dx = moveCurX - _moveWithSpaceStartPos[0];
    const dy = moveCurY - _moveWithSpaceStartPos[1];

    const { start, end } = _moveWithSpaceShapePosTemp;
    _draggingArea.start.x = start.x + dx;
    _draggingArea.start.y = start.y + dy;
    _draggingArea.end.x = end.x + dx;
    _draggingArea.end.y = end.y + dy;
  }

  private _resize(shift = false) {
    const { _draggingElementId: id, _draggingArea } = this;
    if (!id) return;
    if (!_draggingArea) return;

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

  afterModeSwitch(newTool: EdgelessTool) {
    if (newTool.type !== 'shape') return;
    this.createOverlay();
  }

  beforeModeSwitch() {
    this.clearOverlay();
  }

  clearOverlay() {
    if (!this._shapeOverlay) return;

    this._shapeOverlay.dispose();
    this._edgeless.surface.renderer.removeOverlay(this._shapeOverlay);
    this._shapeOverlay = null;
    this._edgeless.surface.refresh();
  }

  createOverlay() {
    this.clearOverlay();
    if (this._disableOverlay) return;
    const options = SHAPE_OVERLAY_OPTIONS;
    const { shapeName } = this.tool;
    const attributes =
      this._edgeless.std.get(EditPropsStore).lastProps$.value[
        `shape:${shapeName}`
      ];
    options.stroke = ThemeObserver.getColorValue(
      attributes.strokeColor,
      DEFAULT_SHAPE_STROKE_COLOR,
      true
    );
    options.fill = ThemeObserver.getColorValue(
      attributes.fillColor,
      DEFAULT_SHAPE_FILL_COLOR,
      true
    );

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
    this._shapeOverlay = new ShapeOverlay(this._edgeless, shapeName, options, {
      shapeStyle: attributes.shapeStyle,
      fillColor: attributes.fillColor,
      strokeColor: attributes.strokeColor,
    });
    this._edgeless.surface.renderer.addOverlay(this._shapeOverlay);
  }

  onContainerClick(e: PointerEventState): void {
    this.clearOverlay();
    if (this._disableOverlay) return;

    this._doc.captureSync();

    const id = this._addNewShape(e, SHAPE_OVERLAY_WIDTH, SHAPE_OVERLAY_HEIGHT);

    const element = this._service.getElementById(id);
    if (!element) return;

    this._edgeless.tools.switchToDefaultMode({
      elements: [element.id],
      editing: false,
    });
  }

  onContainerContextMenu(): void {
    noop();
  }

  onContainerDblClick(): void {
    noop();
  }

  onContainerDragEnd() {
    if (this._disableOverlay) return;
    if (this._draggingElement) {
      const draggingElement = this._draggingElement;

      draggingElement.pop('xywh');
    }

    const id = this._draggingElementId;
    if (!id) return;

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

    this._doc.captureSync();

    const element = this._service.getElementById(id);
    if (!element) return;

    this._edgeless.tools.switchToDefaultMode({
      elements: [element.id],
      editing: false,
    });
  }

  onContainerDragMove(e: PointerEventState) {
    if (this._disableOverlay) return;
    if (!this._draggingElementId) return;
    if (!this._draggingArea) return;

    this._draggingArea.end = new DOMPoint(e.x, e.y);

    if (this._edgeless.tools.spaceBar) {
      this._move();
    }

    this._resize(e.keys.shift || this._edgeless.tools.shiftKey);
  }

  onContainerDragStart(e: PointerEventState) {
    if (this._disableOverlay) return;
    this.clearOverlay();

    this._doc.captureSync();

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

  onContainerMouseMove(e: PointerEventState) {
    if (!this._shapeOverlay) return;
    // shape options, like stroke color, fill color, etc.
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

  onContainerPointerDown(): void {
    noop();
  }

  onContainerTripleClick() {
    noop();
  }

  onPressShiftKey(pressed: boolean) {
    const id = this._draggingElementId;
    if (!id) return;
    this._resize(pressed);
  }

  onPressSpaceBar(pressed: boolean): void {
    const { tools } = this._edgeless;
    if (tools.dragging && pressed) {
      if (!this._draggingArea) return;

      const x = this._draggingArea.end.x;
      const y = this._draggingArea.end.y;
      this._moveWithSpaceStartPos = [x, y];

      // Keep a temp version of the _draggingArea
      const {
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
      } = this._draggingArea;

      this._moveWithSpaceShapePosTemp = {
        start: new DOMPoint(startX, startY),
        end: new DOMPoint(endX, endY),
      };
    }
  }

  setDisableOverlay(disable: boolean) {
    this._disableOverlay = disable;
  }
}

declare global {
  namespace BlockSuite {
    interface EdgelessToolMap {
      shape: ShapeToolController;
    }
  }
}
