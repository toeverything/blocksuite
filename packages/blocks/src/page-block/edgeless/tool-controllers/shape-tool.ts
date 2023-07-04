import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { Bound, Overlay, StrokeStyle } from '@blocksuite/phasor';

import type { EdgelessTool, ShapeTool } from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
} from '../components/component-toolbar/change-shape-button.js';
import { isTransparent } from '../components/panel/color-panel.js';
import type { SelectionArea } from '../utils/selection-manager.js';
import { EdgelessToolController } from './index.js';

const DEFAULT_SHAPE_WIDTH = 120;
const DEFAULT_SHAPE_HEIGHT = 120;
abstract class Shape {
  x: number;
  y: number;
  globalAlpha: number;
  type: string;

  constructor(x: number, y: number, globalAlpha: number, type: string) {
    this.x = x;
    this.y = y;
    this.globalAlpha = globalAlpha;
    this.type = type;
  }

  abstract draw(ctx: CanvasRenderingContext2D): void;
}

class RectShape extends Shape {
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.strokeRect(this.x, this.y, DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT);
  }
}

class TriangleShape extends Shape {
  draw(ctx: CanvasRenderingContext2D): void {
    const height = (Math.sqrt(3) / 2) * DEFAULT_SHAPE_WIDTH; // height of equilateral triangle with side length 100
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - height / 2); // top vertex
    ctx.lineTo(this.x - DEFAULT_SHAPE_WIDTH / 2, this.y + height / 2); // bottom-left vertex
    ctx.lineTo(this.x + DEFAULT_SHAPE_WIDTH / 2, this.y + height / 2); // bottom-right vertex
    ctx.closePath();
    ctx.stroke();
  }
}

class DiamondShape extends Shape {
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - DEFAULT_SHAPE_WIDTH / 2); // top vertex
    ctx.lineTo(this.x - DEFAULT_SHAPE_WIDTH / 2, this.y); // left vertex
    ctx.lineTo(this.x, this.y + DEFAULT_SHAPE_WIDTH / 2); // bottom vertex
    ctx.lineTo(this.x + DEFAULT_SHAPE_WIDTH / 2, this.y); // right vertex
    ctx.closePath();
    ctx.stroke();
  }
}

class CircleShape extends Shape {
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 50, 0, Math.PI * 2);
    ctx.stroke();
  }
}

class RoundedRectShape extends Shape {
  draw(ctx: CanvasRenderingContext2D): void {
    const cornerRadius = 10;
    ctx.beginPath();
    ctx.moveTo(this.x + cornerRadius, this.y);
    ctx.lineTo(this.x + DEFAULT_SHAPE_WIDTH - cornerRadius, this.y);
    ctx.quadraticCurveTo(
      this.x + DEFAULT_SHAPE_WIDTH,
      this.y,
      this.x + DEFAULT_SHAPE_WIDTH,
      this.y + cornerRadius
    );
    ctx.lineTo(
      this.x + DEFAULT_SHAPE_WIDTH,
      this.y + DEFAULT_SHAPE_WIDTH - cornerRadius
    );
    ctx.quadraticCurveTo(
      this.x + DEFAULT_SHAPE_WIDTH,
      this.y + DEFAULT_SHAPE_WIDTH,
      this.x + DEFAULT_SHAPE_WIDTH - cornerRadius,
      this.y + DEFAULT_SHAPE_WIDTH
    );
    ctx.lineTo(this.x + cornerRadius, this.y + DEFAULT_SHAPE_WIDTH);
    ctx.quadraticCurveTo(
      this.x,
      this.y + DEFAULT_SHAPE_WIDTH,
      this.x,
      this.y + DEFAULT_SHAPE_WIDTH - cornerRadius
    );
    ctx.lineTo(this.x, this.y + cornerRadius);
    ctx.quadraticCurveTo(this.x, this.y, this.x + cornerRadius, this.y);
    ctx.closePath();
    ctx.stroke();
  }
}

class ShapeFactory {
  static createShape(
    x: number,
    y: number,
    globalAlpha: number,
    type: string
  ): Shape {
    switch (type) {
      case 'rect':
        return new RectShape(x, y, globalAlpha, type);
      case 'triangle':
        return new TriangleShape(x, y, globalAlpha, type);
      case 'diamond':
        return new DiamondShape(x, y, globalAlpha, type);
      case 'ellipse':
        return new CircleShape(x, y, globalAlpha, type);
      case 'roundedRect':
        return new RoundedRectShape(x, y, globalAlpha, type);
      default:
        throw new Error(`Unknown shape type: ${type}`);
    }
  }
}

class ShapeOverlay extends Overlay {
  private shape: Shape;
  private _x: number;
  private _y: number;
  private _globalAlpha: number;

  constructor(x = 0, y = 0, globalAlpha = 0, type = 'rect') {
    super();
    this.shape = ShapeFactory.createShape(x, y, globalAlpha, type);
    this._x = x;
    this._y = y;
    this._globalAlpha = globalAlpha;
  }

  get x(): number {
    return this._x;
  }

  set x(value: number) {
    this._x = value;
    this.shape.x = value;
  }

  get y(): number {
    return this._y;
  }

  set y(value: number) {
    this._y = value;
    this.shape.y = value;
  }

  get globalAlpha(): number {
    return this._globalAlpha;
  }

  set globalAlpha(value: number) {
    this._globalAlpha = value;
    this.shape.globalAlpha = value;
  }

  setShape(type: string): void {
    this.shape = ShapeFactory.createShape(
      this._x,
      this._y,
      this._globalAlpha,
      type
    );
  }

  override render(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = this.shape.globalAlpha;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'black';
    this.shape.draw(ctx);
  }
}

export class ShapeToolController extends EdgelessToolController<ShapeTool> {
  readonly tool = <ShapeTool>{
    type: 'shape',
    shape: 'rect',
    fillColor: DEFAULT_SHAPE_FILL_COLOR,
    strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
  };

  private _draggingElementId: string | null = null;

  // shape overlay
  private _shapeOverlay: ShapeOverlay | null = null;

  protected override _draggingArea: SelectionArea | null = null;

  private _addNewShapeToSurface(
    e: PointerEventState,
    width: number,
    height: number
  ): string {
    const { viewport } = this._edgeless.surface;

    // create a shape block when drag start
    const [modelX, modelY] = viewport.toModelCoord(e.point.x, e.point.y);
    const bound = new Bound(modelX, modelY, width, height);
    const { shape, fillColor, strokeColor } = this.tool;

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

    return id;
  }

  onContainerClick(e: PointerEventState): void {
    if (!this._page.awarenessStore.getFlag('enable_surface')) return;
    this._clearOverlay();

    this._page.captureSync();

    const id = this._addNewShapeToSurface(
      e,
      DEFAULT_SHAPE_WIDTH,
      DEFAULT_SHAPE_HEIGHT
    );

    const element = this._surface.pickById(id);
    assertExists(element);
    this._edgeless.slots.surfaceUpdated.emit();

    this._edgeless.selection.switchToDefaultMode({
      selected: [element],
      active: false,
    });
  }

  onContainerContextMenu(e: PointerEventState): void {
    noop();
  }

  onContainerPointerDown(e: PointerEventState): void {
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
    this._clearOverlay();

    this._page.captureSync();

    const id = this._addNewShapeToSurface(e, 0, 0);

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

    this._resize(e.keys.shift || this._edgeless.selection.shiftKey);
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

  onPressShiftKey(pressed: boolean) {
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

  private _updateOverlayPosition(x: number, y: number) {
    if (!this._shapeOverlay) return;
    this._shapeOverlay.x = x;
    this._shapeOverlay.y = y;
    this._edgeless.surface.refresh();
  }

  private _clearOverlay() {
    if (!this._shapeOverlay) return;

    this._edgeless.surface.viewport.removeOverlay(this._shapeOverlay);
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

    this._shapeOverlay.setShape(this.tool.shape);
    if (this._shapeOverlay.globalAlpha === 0)
      this._shapeOverlay.globalAlpha = 0.66;
    const [x, y] = this._surface.viewport.toModelCoord(e.x, e.y);
    this._updateOverlayPosition(x, y);
  }

  onContainerMouseOut(e: PointerEventState) {
    this._hideOverlay();
  }

  beforeModeSwitch() {
    this._clearOverlay();
  }

  afterModeSwitch(newTool: EdgelessTool) {
    if (newTool.type !== 'shape') return;
    this._shapeOverlay = new ShapeOverlay();
    this._edgeless.surface.viewport.addOverlay(this._shapeOverlay);
  }
}
