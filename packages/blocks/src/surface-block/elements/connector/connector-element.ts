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
  ConnectorEndpoint,
  ConnectorEndpointStyle,
  ConnectorMode,
  DEFAULT_FRONT_END_POINT_STYLE,
  DEFAULT_REAR_END_POINT_STYLE,
  type IConnector,
} from './types.js';
import {
  type ArrowOptions,
  renderArrow,
  renderCircle,
  renderDiamond,
  renderTriangle,
} from './utils.js';

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

  get frontEndpointStyle() {
    return (
      (this.yMap.get(
        'frontEndpointStyle'
      ) as IConnector['frontEndpointStyle']) ?? DEFAULT_FRONT_END_POINT_STYLE
    );
  }

  get rearEndpointStyle() {
    return (
      (this.yMap.get('rearEndpointStyle') as IConnector['rearEndpointStyle']) ??
      DEFAULT_REAR_END_POINT_STYLE
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
    const {
      absolutePath: points,
      mode,
      frontEndpointStyle: frontEndpointStyle,
      rearEndpointStyle: rearEndpointStyle,
    } = this;

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

    this._renderEndpoint(
      points,
      ctx,
      rc,
      ConnectorEndpoint.Front,
      frontEndpointStyle
    );

    this._renderEndpoint(
      points,
      ctx,
      rc,
      ConnectorEndpoint.Rear,
      rearEndpointStyle
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

  private _getArrowOptions(end: ConnectorEndpoint): ArrowOptions {
    const { stroke } = this;
    const realStrokeColor = this.computedValue(stroke);
    return {
      end,
      seed: this.seed,
      mode: this.mode,
      rough: this.rough,
      roughness: this.roughness,
      strokeColor: realStrokeColor,
      strokeWidth: this.strokeWidth,
      fillColor: realStrokeColor,
      fillStyle: 'solid',
      bezierParameters: this.bezierParameters,
    };
  }

  private _renderEndpoint(
    location: PointLocation[],
    ctx: CanvasRenderingContext2D,
    rc: RoughCanvas,
    end: ConnectorEndpoint,
    style: ConnectorEndpointStyle
  ) {
    const arrowOptions = this._getArrowOptions(end);
    switch (style) {
      case ConnectorEndpointStyle.Arrow:
        renderArrow(location, ctx, rc, arrowOptions);
        break;
      case ConnectorEndpointStyle.Triangle:
        renderTriangle(location, ctx, rc, arrowOptions);
        break;
      case ConnectorEndpointStyle.Circle:
        renderCircle(location, ctx, rc, arrowOptions);
        break;
      case ConnectorEndpointStyle.Diamond:
        renderDiamond(location, ctx, rc, arrowOptions);
        break;
    }
  }

  override getRelativePointLocation(point: IVec): PointLocation {
    return new PointLocation(
      Bound.deserialize(this.xywh).getRelativePoint(point)
    );
  }
}
