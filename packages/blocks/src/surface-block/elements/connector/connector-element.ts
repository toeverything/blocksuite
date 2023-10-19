import { DEFAULT_ROUGHNESS, StrokeStyle } from '../../consts.js';
import type { RoughCanvas } from '../../rough/canvas.js';
import { Bound } from '../../utils/bound.js';
import {
  type BezierCurveParameters,
  getBezierNearestPoint,
} from '../../utils/curve.js';
import {
  linePolylineIntersects,
  polyLineNearestPoint,
} from '../../utils/math-utils.js';
import { PointLocation } from '../../utils/point-location.js';
import { type IVec, Vec } from '../../utils/vec.js';
import type { SerializedXYWH } from '../../utils/xywh.js';
import type { HitTestOptions } from '../edgeless-element.js';
import { SurfaceElement } from '../surface-element.js';
import {
  ConnectorEnd,
  ConnectorEndPointStyle,
  ConnectorMode,
  DEFAULT_ARROW_SIZE,
  DEFAULT_END_POINT_STYLE,
  DEFAULT_START_POINT_STYLE,
  type IConnector,
} from './types.js';
import { getArrowPoints, getPointWithTangent } from './utils.js';

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

  get startPointStyle() {
    return (
      (this.yMap.get('startPointStyle') as IConnector['startPointStyle']) ??
      DEFAULT_START_POINT_STYLE
    );
  }

  get endPointStyle() {
    return (
      (this.yMap.get('endPointStyle') as IConnector['endPointStyle']) ??
      DEFAULT_END_POINT_STYLE
    );
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
    const { absolutePath: points, mode, startPointStyle, endPointStyle } = this;

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

    // render start points
    this._renderEndPoints(
      points,
      ctx,
      rc,
      mode,
      ConnectorEnd.Start,
      startPointStyle
    );
    // render end points
    this._renderEndPoints(
      points,
      ctx,
      rc,
      mode,
      ConnectorEnd.End,
      endPointStyle
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

  private _getArrowPoints(
    points: PointLocation[],
    mode: ConnectorMode,
    end: ConnectorEnd,
    angleRatio = 0.25
  ) {
    const anchorPoint = getPointWithTangent(
      points,
      mode,
      end,
      this.bezierParameters
    );

    const { points: arrowPoints } = getArrowPoints(
      anchorPoint,
      DEFAULT_ARROW_SIZE,
      end,
      angleRatio
    );

    return arrowPoints;
  }

  private _renderArrow(
    points: PointLocation[],
    ctx: CanvasRenderingContext2D,
    rc: RoughCanvas,
    mode: ConnectorMode,
    end: ConnectorEnd
  ) {
    const arrowPoints = this._getArrowPoints(points, mode, end);

    this._renderPoints(
      ctx,
      rc,
      [
        PointLocation.fromVec(arrowPoints[0]),
        PointLocation.fromVec(arrowPoints[1]),
        PointLocation.fromVec(arrowPoints[2]),
      ],
      false,
      false
    );
  }

  private _renderTriangle(
    points: PointLocation[],
    ctx: CanvasRenderingContext2D,
    rc: RoughCanvas,
    mode: ConnectorMode,
    end: ConnectorEnd
  ) {
    const trianglePoints = this._getArrowPoints(points, mode, end, 0.1);

    const { stroke, strokeWidth } = this;
    const realStrokeColor = this.computedValue(stroke);
    ctx.fillStyle = realStrokeColor;
    ctx.strokeStyle = realStrokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(trianglePoints[0][0], trianglePoints[0][1]);
    ctx.lineTo(trianglePoints[1][0], trianglePoints[1][1]);
    ctx.lineTo(trianglePoints[2][0], trianglePoints[2][1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private _renderCircle(
    points: PointLocation[],
    ctx: CanvasRenderingContext2D,
    rc: RoughCanvas,
    mode: ConnectorMode,
    end: ConnectorEnd
  ) {
    const radius = DEFAULT_ARROW_SIZE / 2;
    const anchorPoint = getPointWithTangent(
      points,
      mode,
      end,
      this.bezierParameters
    );
    let cx = anchorPoint[0];
    let cy = anchorPoint[1];
    if (end === 'End') {
      // need to calculate the center point according to the tangent
      cx -= anchorPoint.tangent[0] * radius;
      cy -= anchorPoint.tangent[1] * radius;
    } else {
      cx += anchorPoint.tangent[0] * radius;
      cy += anchorPoint.tangent[1] * radius;
    }
    const { stroke, strokeWidth } = this;
    const realStrokeColor = this.computedValue(stroke);
    ctx.fillStyle = realStrokeColor;
    ctx.strokeStyle = realStrokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius, radius, 0, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private _renderDiamond(
    points: PointLocation[],
    ctx: CanvasRenderingContext2D,
    rc: RoughCanvas,
    mode: ConnectorMode,
    end: 'Start' | 'End'
  ) {
    if (end === 'End') {
      console.log('render end diamond');
    } else {
      console.log('render start diamond');
    }
  }

  private _renderEndPoints(
    points: PointLocation[],
    ctx: CanvasRenderingContext2D,
    rc: RoughCanvas,
    mode: ConnectorMode,
    end: ConnectorEnd,
    style: ConnectorEndPointStyle
  ) {
    switch (style) {
      case ConnectorEndPointStyle.Arrow:
        this._renderArrow(points, ctx, rc, mode, end);
        break;
      case ConnectorEndPointStyle.Triangle:
        this._renderTriangle(points, ctx, rc, mode, end);
        break;
      case ConnectorEndPointStyle.Circle:
        this._renderCircle(points, ctx, rc, mode, end);
        break;
      case ConnectorEndPointStyle.Diamond:
        this._renderDiamond(points, ctx, rc, mode, end);
        break;
    }
  }

  override getRelativePointLocation(point: IVec): PointLocation {
    return new PointLocation(
      Bound.deserialize(this.xywh).getRelativePoint(point)
    );
  }
}
