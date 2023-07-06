import { DEFAULT_ROUGHNESS } from '../../consts.js';
import type { RoughCanvas } from '../../rough/canvas.js';
import type { Bound } from '../../utils/bound.js';
import type { IVec } from '../../utils/vec.js';
import { type HitTestOptions, SurfaceElement } from '../surface-element.js';
import { ShapeMethodsMap } from './shapes/index.js';
import type { IShape } from './types.js';

export class ShapeElement extends SurfaceElement<IShape> {
  get shapeType() {
    const shapeType = this.yMap.get('shapeType') as IShape['shapeType'];
    return shapeType;
  }

  get radius() {
    const radius = this.yMap.get('radius') as IShape['radius'];
    return radius;
  }

  get filled() {
    const filled = this.yMap.get('filled') as IShape['filled'];
    return filled;
  }

  get fillColor() {
    const fillColor = this.yMap.get('fillColor') as IShape['fillColor'];
    return fillColor;
  }

  get strokeWidth() {
    const strokeWidth = this.yMap.get('strokeWidth') as IShape['strokeWidth'];
    return strokeWidth;
  }

  get strokeColor() {
    const strokeColor = this.yMap.get('strokeColor') as IShape['strokeColor'];
    return strokeColor;
  }

  get strokeStyle() {
    const strokeStyle = this.yMap.get('strokeStyle') as IShape['strokeStyle'];
    return strokeStyle;
  }

  get roughness() {
    const roughness =
      (this.yMap.get('roughness') as IShape['roughness']) ?? DEFAULT_ROUGHNESS;
    return roughness;
  }

  get realStrokeColor() {
    return this.computedValue(this.strokeColor);
  }

  get realFillColor() {
    return this.computedValue(this.fillColor);
  }

  override hitTest(x: number, y: number, options?: HitTestOptions) {
    const { hitTest } = ShapeMethodsMap[this.shapeType];
    return hitTest.apply(this, [x, y, options]);
  }

  override containedByBounds(bounds: Bound) {
    return ShapeMethodsMap[this.shapeType].containedByBounds(bounds, this);
  }

  override intersectWithLine(start: IVec, end: IVec) {
    return ShapeMethodsMap[this.shapeType].intersectWithLine(start, end, this);
  }

  override getNearestPoint(point: IVec): IVec {
    return ShapeMethodsMap[this.shapeType].getNearestPoint(point, this);
  }

  override render(
    ctx: CanvasRenderingContext2D,
    matrix: DOMMatrix,
    rc: RoughCanvas
  ) {
    const { render } = ShapeMethodsMap[this.shapeType];
    render(ctx, matrix, rc, this);
  }
}
