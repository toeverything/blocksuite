import { DEFAULT_ROUGHNESS, StrokeStyle } from '../../consts.js';
import type { RoughCanvas } from '../../rough/canvas.js';
import { Bound } from '../../utils/bound.js';
import {
  linePolylineIntersects,
  polyLineNearestPoint,
} from '../../utils/math-utils.js';
import { PointLocation } from '../../utils/point-location.js';
import { type IVec, Vec } from '../../utils/vec.js';
import type { SerializedXYWH } from '../../utils/xywh.js';
import { type HitTestOptions, SurfaceElement } from '../surface-element.js';
import type { IConnector } from './types.js';
import { getArrowPoints } from './utils.js';

export class ConnectorElement extends SurfaceElement<IConnector> {
  private _path: IVec[] = [];
  private _xywh: SerializedXYWH = `[0, 0, 0, 0]`;
  protected override _connectable = false;

  // relative to it's xywh
  get path() {
    return this._path;
  }

  set path(p: IVec[]) {
    this._path = p;
  }

  override get xywh() {
    return this._xywh;
  }

  override set xywh(xywh: SerializedXYWH) {
    this._xywh = xywh;
    this.renderer?.removeElement(this);
    this.renderer?.addElement(this);
  }

  get mode() {
    return this.yMap.get('mode') as IConnector['mode'];
  }

  get strokeWidth() {
    return this.yMap.get('strokeWidth') as IConnector['strokeWidth'];
  }

  get stroke() {
    return this.yMap.get('stroke') as IConnector['stroke'];
  }

  get strokeStyle() {
    return this.yMap.get('strokeStyle') as IConnector['strokeStyle'];
  }

  get roughness() {
    return (
      (this.yMap.get('roughness') as IConnector['roughness']) ??
      DEFAULT_ROUGHNESS
    );
  }

  get rough() {
    return (this.yMap.get('rough') as IConnector['rough']) ?? false;
  }

  get target() {
    return this.yMap.get('target') as IConnector['target'];
  }

  get source() {
    return this.yMap.get('source') as IConnector['source'];
  }

  get controllers() {
    return this.yMap.get('controllers') as IConnector['controllers'];
  }

  get absolutePath() {
    const { x, y } = this;
    return this.path.map(p => [p[0] + x, p[1] + y]);
  }

  override hitTest(
    x: number,
    y: number,
    options?: HitTestOptions | undefined
  ): boolean {
    const point = polyLineNearestPoint(this.absolutePath, [x, y]);
    return (
      Vec.dist(point, [x, y]) < (options?.expand ? this.strokeWidth / 2 : 0) + 8
    );
  }

  override containedByBounds(bounds: Bound) {
    return this.absolutePath.some(point => bounds.containsPoint(point));
  }

  override getNearestPoint(point: IVec): IVec {
    return polyLineNearestPoint(this.absolutePath, point);
  }

  override intersectWithLine(start: IVec, end: IVec) {
    return linePolylineIntersects(start, end, this.absolutePath);
  }

  override render(
    ctx: CanvasRenderingContext2D,
    matrix: DOMMatrix,
    rc: RoughCanvas
  ) {
    const { absolutePath: points } = this;
    const [x, y] = this.deserializeXYWH();

    ctx.setTransform(matrix.translateSelf(-x, -y));

    this._renderPoints(
      ctx,
      rc,
      points,
      this.strokeStyle === StrokeStyle.Dashed
    );

    // points might not be build yet in some senarios
    // eg. undo/redo, copy/paste
    if (!points.length) return;

    const last = points[points.length - 1];
    const secondToLast = points[points.length - 2];
    const { sides, end } = getArrowPoints(secondToLast, last, 15);
    this._renderPoints(ctx, rc, [sides[0], end, sides[1]], false);
  }

  private _renderPoints(
    ctx: CanvasRenderingContext2D,
    rc: RoughCanvas,
    points: IVec[],
    dash: boolean
  ) {
    const { seed, stroke, strokeWidth, roughness, rough } = this;
    const realStrokeColor = this.computedValue(stroke);
    if (rough) {
      const options = {
        seed,
        roughness,
        strokeLineDash: dash ? [12, 12] : undefined,
        stroke: realStrokeColor,
        strokeWidth,
      };
      rc.linearPath(points as [number, number][], options);
    } else {
      ctx.save();
      ctx.strokeStyle = realStrokeColor;
      ctx.lineWidth = this.strokeWidth;
      dash && ctx.setLineDash([12, 12]);
      ctx.beginPath();
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point[0], point[1]);
        } else {
          ctx.lineTo(point[0], point[1]);
        }
      });
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
    }
  }

  override getRelativePointLocation(point: IVec): PointLocation {
    return new PointLocation(
      Bound.deserialize(this.xywh).getRelativePoint(point)
    );
  }
}
