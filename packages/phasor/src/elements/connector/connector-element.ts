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
    const {
      seed,
      stroke,
      strokeStyle,
      strokeWidth,
      roughness,
      absolutePath: points,
    } = this;
    const [x, y] = this.deserializeXYWH();

    ctx.setTransform(matrix.translateSelf(-x, -y));

    const realStrokeColor = this.computedValue(stroke);

    const options = {
      seed,
      roughness,
      strokeLineDash: strokeStyle === StrokeStyle.Dashed ? [12, 12] : undefined,
      stroke: realStrokeColor,
      strokeWidth,
    };

    rc.linearPath(points.map(p => p) as [number, number][], options);

    const last = points[points.length - 1];
    const secondToLast = points[points.length - 2];

    if (last && secondToLast) {
      const { sides, end } = getArrowPoints(secondToLast, last, 15);
      rc.linearPath(
        [
          [sides[0][0], sides[0][1]],
          [end[0], end[1]],
          [sides[1][0], sides[1][1]],
        ],
        options
      );
    }
  }

  override getRelativePointLocation(point: IVec): PointLocation {
    return new PointLocation(
      Bound.deserialize(this.xywh).getRelativePoint(point)
    );
  }
}
