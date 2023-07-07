import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import type { Options } from '@blocksuite/phasor';
import type { RoughCanvas } from '@blocksuite/phasor';
import { Bound, Overlay, StrokeStyle } from '@blocksuite/phasor';

import type { EdgelessTool, ShapeTool } from '../../../__internal__/index.js';
import { noop } from '../../../__internal__/index.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
} from '../components/component-toolbar/change-shape-button.js';
import { isTransparent } from '../components/panel/color-panel.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import {
  SHAPE_OVERLAY_HEIGHT,
  SHAPE_OVERLAY_OFFSET_X,
  SHAPE_OVERLAY_OFFSET_Y,
  SHAPE_OVERLAY_OPTIONS,
  SHAPE_OVERLAY_WIDTH,
} from '../utils/consts.js';
import type { SelectionArea } from '../utils/selection-manager.js';
import { EdgelessToolController } from './index.js';

abstract class Shape {
  x: number;
  y: number;
  globalAlpha: number;
  type: string;
  options: Options;

  constructor(
    x: number,
    y: number,
    globalAlpha: number,
    type: string,
    options: Options
  ) {
    this.x = x;
    this.y = y;
    this.globalAlpha = globalAlpha;
    this.type = type;
    this.options = options;
  }

  abstract draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void;
}

class RectShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    rc.rectangle(
      this.x + SHAPE_OVERLAY_OFFSET_X,
      this.y + SHAPE_OVERLAY_OFFSET_Y,
      SHAPE_OVERLAY_WIDTH,
      SHAPE_OVERLAY_HEIGHT,
      this.options
    );
  }
}

class TriangleShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    rc.polygon(
      [
        [this.x + SHAPE_OVERLAY_WIDTH / 2, this.y],
        [this.x, this.y + SHAPE_OVERLAY_HEIGHT],
        [this.x + SHAPE_OVERLAY_WIDTH, this.y + SHAPE_OVERLAY_HEIGHT],
      ],
      this.options
    );
  }
}

class DiamondShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    rc.polygon(
      [
        [this.x + SHAPE_OVERLAY_WIDTH / 2, this.y],
        [this.x + SHAPE_OVERLAY_WIDTH, this.y + SHAPE_OVERLAY_HEIGHT / 2],
        [this.x + SHAPE_OVERLAY_WIDTH / 2, this.y + SHAPE_OVERLAY_HEIGHT],
        [this.x, this.y + SHAPE_OVERLAY_HEIGHT / 2],
      ],
      this.options
    );
  }
}

class EllipseShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    rc.ellipse(
      this.x + SHAPE_OVERLAY_WIDTH / 2,
      this.y + SHAPE_OVERLAY_HEIGHT / 2,
      SHAPE_OVERLAY_WIDTH,
      SHAPE_OVERLAY_HEIGHT,
      this.options
    );
  }
}

class RoundedRectShape extends Shape {
  draw(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    const radius = 0.1;
    const r = Math.min(
      SHAPE_OVERLAY_WIDTH * radius,
      SHAPE_OVERLAY_HEIGHT * radius
    );
    const x0 = this.x + r;
    const x1 = this.x + SHAPE_OVERLAY_WIDTH + 40 - r;
    const y0 = this.y + r;
    const y1 = this.y + SHAPE_OVERLAY_HEIGHT - r;
    const path = `
        M${x0},${this.y} L${x1},${this.y} 
        A${r},${r} 0 0 1 ${x1},${y0} 
        L${x1},${y1} 
        A${r},${r} 0 0 1 ${x1 - r},${y1} 
        L${x0 + r},${y1} 
        A${r},${r} 0 0 1 ${x0},${y1 - r} 
        L${x0},${y0} 
        A${r},${r} 0 0 1 ${x0 + r},${this.y}
      `;

    rc.path(path, this.options);
  }
}

class ShapeFactory {
  static createShape(
    x: number,
    y: number,
    globalAlpha: number,
    type: string,
    options: Options
  ): Shape {
    switch (type) {
      case 'rect':
        return new RectShape(x, y, globalAlpha, type, options);
      case 'triangle':
        return new TriangleShape(x, y, globalAlpha, type, options);
      case 'diamond':
        return new DiamondShape(x, y, globalAlpha, type, options);
      case 'ellipse':
        return new EllipseShape(x, y, globalAlpha, type, options);
      case 'roundedRect':
        return new RoundedRectShape(x, y, globalAlpha, type, options);
      default:
        throw new Error(`Unknown shape type: ${type}`);
    }
  }
}

class ShapeOverlay extends Overlay {
  private _shape: Shape;
  private _x: number;
  private _y: number;
  private _globalAlpha: number;
  private _options: Options;
  private _edgeless: EdgelessPageBlockComponent;
  private _disposables!: DisposableGroup;
  private _lastViewportX: number;
  private _lastViewportY: number;

  constructor(edgeless: EdgelessPageBlockComponent) {
    super();
    this._x = 0;
    this._y = 0;
    this._globalAlpha = 0;
    this._options = SHAPE_OVERLAY_OPTIONS;
    this._shape = ShapeFactory.createShape(
      this.x,
      this.y,
      this.globalAlpha,
      'rect',
      this._options
    );
    this._edgeless = edgeless;
    this._disposables = new DisposableGroup();
    this._lastViewportX = edgeless.surface.viewport.viewportX;
    this._lastViewportY = edgeless.surface.viewport.viewportY;
    this._disposables.add(
      this._edgeless.slots.viewportUpdated.on(() => {
        // TODO: consoder zoom in zoom out
        // get current viewport position
        const currentViewportX = this._edgeless.surface.viewport.viewportX;
        const currentViewportY = this._edgeless.surface.viewport.viewportY;
        // calculate position delta
        const deltaX = currentViewportX - this._lastViewportX;
        const deltaY = currentViewportY - this._lastViewportY;
        // update overlay current position
        this.x += deltaX;
        this.y += deltaY;
        // update last viewport position
        this._lastViewportX = currentViewportX;
        this._lastViewportY = currentViewportY;
        // refresh to show new overlay
        this._edgeless.surface.refresh();
      })
    );
    this._disposables.add(
      this._edgeless.slots.edgelessToolUpdated.on(edgelessTool => {
        // when change note child type, update overlay text
        this._shape.type = edgelessTool.type;
      })
    );
  }

  get x(): number {
    return this._x;
  }

  set x(value: number) {
    this._x = value;
    this._shape.x = value;
  }

  get y(): number {
    return this._y;
  }

  set y(value: number) {
    this._y = value;
    this._shape.y = value;
  }

  get globalAlpha(): number {
    return this._globalAlpha;
  }

  set globalAlpha(value: number) {
    this._globalAlpha = value;
    this._shape.globalAlpha = value;
  }

  get options(): Options {
    return this._options;
  }

  set options(value: Options) {
    this._options = value;
    this._shape.options = value;
  }

  setShape(type: string, options: Options): void {
    this._shape = ShapeFactory.createShape(
      this._x,
      this._y,
      this._globalAlpha,
      type,
      options
    );
  }

  override render(ctx: CanvasRenderingContext2D, rc: RoughCanvas): void {
    ctx.globalAlpha = this._shape.globalAlpha;
    this._shape.draw(ctx, rc);
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

  private _addNewShape(
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

    // RoundedRect shape should different with normal rect
    let shapeWidth = SHAPE_OVERLAY_WIDTH;
    if (this.tool.shape === 'roundedRect') shapeWidth += 40;

    const id = this._addNewShape(e, shapeWidth, SHAPE_OVERLAY_HEIGHT);

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

    const id = this._addNewShape(e, 0, 0);

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
    // shpae options, like stroke color, fill color, etc.
    const options = {
      ...SHAPE_OVERLAY_OPTIONS,
      stroke: this.tool.strokeColor,
    };
    this._shapeOverlay.setShape(this.tool.shape, options);
    if (this._shapeOverlay.globalAlpha === 0)
      this._shapeOverlay.globalAlpha = 1;
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
    this._shapeOverlay = new ShapeOverlay(this._edgeless);
    // shpae options, like stroke color, fill color, etc.
    const options = {
      ...SHAPE_OVERLAY_OPTIONS,
      stroke: this.tool.strokeColor,
    };
    this._shapeOverlay.setShape(this.tool.shape, options);
    this._edgeless.surface.viewport.addOverlay(this._shapeOverlay);
  }
}
