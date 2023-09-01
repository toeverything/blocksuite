import { DEFAULT_ROUGHNESS, StrokeStyle } from '../../consts.js';
import type { RoughCanvas } from '../../rough/canvas.js';
import { Bound } from '../../utils/bound.js';
import {
  type BezierCurveParameters,
  getBezierNearestPoint,
  getBezierTangent,
} from '../../utils/curve.js';
import {
  linePolylineIntersects,
  polyLineNearestPoint,
} from '../../utils/math-utils.js';
import { PointLocation } from '../../utils/point-location.js';
import { type IVec, Vec } from '../../utils/vec.js';
import type { SerializedXYWH } from '../../utils/xywh.js';
import { type HitTestOptions, SurfaceElement } from '../surface-element.js';
import { ConnectorMode, type IConnector } from './types.js';
import { getArrowPoints } from './utils.js';

export class ConnectorElement extends SurfaceElement<IConnector> {
  private _path: PointLocation[] = [];
  private _xywh: SerializedXYWH = `[0, 0, 0, 0]`;
  protected override _connectable = false;

  // relative to it's xywh
  get path() {
    return this._path;
  }

  set path(p: PointLocation[]) {
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
    return this.path.map(p => p.clone().setVec([p[0] + x, p[1] + y]));
  }

  override hitTest(
    x: number,
    y: number,
    options?: HitTestOptions | undefined
  ): boolean {
    const point =
      this.mode === ConnectorMode.Curve
        ? getBezierNearestPoint(this.bezierParameters, [x, y])
        : polyLineNearestPoint(this.absolutePath, [x, y]);
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

  get bezierParameters(): BezierCurveParameters {
    const { absolutePath: p } = this;
    return [p[0], p[0].absOut, p[1].absIn, p[1]];
  }

  override render(
    ctx: CanvasRenderingContext2D,
    matrix: DOMMatrix,
    rc: RoughCanvas
  ) {
    const { absolutePath: points, mode } = this;

    // points might not be build yet in some senarios
    // eg. undo/redo, copy/paste
    if (!points.length || points.length < 2) {
      console.warn('connector points not ready yet, there is something wrong.');
      return;
    }

    const [x, y] = this.deserializeXYWH();

    ctx.setTransform(matrix.translateSelf(-x, -y));

    this._renderPoints(
      ctx,
      rc,
      points,
      this.strokeStyle === StrokeStyle.Dashed,
      mode === ConnectorMode.Curve
    );

    const last = points[points.length - 1];
    const secondToLast = points[points.length - 2];
    const clone = last.clone();
    if (mode !== ConnectorMode.Curve) {
      clone.tangent = Vec.tangent(last, secondToLast);
    } else {
      clone.tangent = getBezierTangent(this.bezierParameters, 1) ?? [];
    }
    const { sides } = getArrowPoints(clone, 15);
    this._renderPoints(
      ctx,
      rc,
      [PointLocation.fromVec(sides[0]), last, PointLocation.fromVec(sides[1])],
      false,
      false
    );
  }

  private _renderPoints(
    ctx: CanvasRenderingContext2D,
    rc: RoughCanvas,
    points: PointLocation[],
    dash: boolean,
    curve: boolean
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
      if (curve) {
        const b = this.bezierParameters;
        rc.path(
          `M${b[0][0]},${b[0][1]} C${b[1][0]},${b[1][1]} ${b[2][0]},${b[2][1]}  ${b[3][0]},${b[3][1]} `,
          options
        );
      } else {
        rc.linearPath(points as unknown as [number, number][], options);
      }
    } else {
      ctx.save();
      ctx.strokeStyle = realStrokeColor;
      ctx.lineWidth = this.strokeWidth;
      dash && ctx.setLineDash([12, 12]);
      ctx.beginPath();
      if (curve) {
        points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point[0], point[1]);
          } else {
            const last = points[index - 1];
            ctx.bezierCurveTo(
              last.absOut[0],
              last.absOut[1],
              point.absIn[0],
              point.absIn[1],
              point[0],
              point[1]
            );
          }
        });
      } else {
        points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point[0], point[1]);
          } else {
            ctx.lineTo(point[0], point[1]);
          }
        });
      }
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
