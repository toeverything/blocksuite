import type { HitTestOptions } from '../../page-block/edgeless/type.js';
import {
  Bound,
  getBoundFromPoints,
  inflateBound,
  transformPointsToNewBound,
} from '../utils/bound.js';
import {
  getPointsFromBoundsWithRotation,
  getQuadBoundsWithRotation,
  isPointOnlines,
  lineIntersects,
  polyLineNearestPoint,
} from '../utils/math-utils.js';
import { PointLocation } from '../utils/point-location.js';
import type { IVec2 } from '../utils/vec.js';
import { Vec } from '../utils/vec.js';
import { type SerializedXYWH } from '../utils/xywh.js';
import { type BaseProps, ElementModel } from './base.js';
import { convert, derive, yfield } from './decorators.js';

export type BrushProps = BaseProps & {
  /**
   * [[x0,y0],[x1,y1]...]
   */
  points: number[][];
  color: string;
  lineWidth: number;
};

export class BrushElementModel extends ElementModel<BrushProps> {
  static override propsToY(props: BrushProps) {
    return props;
  }

  @derive((props: number[][], instance: BrushElementModel) => {
    const lineWidth = instance.lineWidth;
    const bound = getBoundFromPoints(props);
    const boundWidthLineWidth = inflateBound(bound, lineWidth);

    return {
      xywh: boundWidthLineWidth.serialize(),
    };
  })
  @convert((points: number[][], instance: BrushElementModel) => {
    const lineWidth = instance.lineWidth;
    const bound = getBoundFromPoints(points);
    const boundWidthLineWidth = inflateBound(bound, lineWidth);
    const relativePoints = points.map(([x, y]) => [
      x - boundWidthLineWidth.x,
      y - boundWidthLineWidth.y,
    ]);

    return relativePoints;
  })
  @yfield()
  points: number[][] = [];

  @derive((xywh: SerializedXYWH, instance: BrushElementModel) => {
    const bound = Bound.deserialize(xywh);
    const { lineWidth } = instance;
    const transformed = transformPointsToNewBound(
      instance.points.map(([x, y]) => ({ x, y })),
      instance,
      lineWidth / 2,
      bound,
      lineWidth / 2
    );

    return {
      points: transformed.points.map(p => [p.x, p.y]),
    };
  })
  @yfield()
  xywh: SerializedXYWH = '[0,0,0,0]';

  @yfield()
  rotate: number = 0;

  @yfield()
  color: string = '#000000';

  @derive((lineWidth: number, instance: BrushElementModel) => {
    if (lineWidth === instance.lineWidth) return {};

    const bound = instance.elementBound;
    const points = instance.points;
    const transformed = transformPointsToNewBound(
      points.map(([x, y]) => ({ x, y })),
      bound,
      lineWidth / 2,
      inflateBound(bound, lineWidth - instance.lineWidth),
      lineWidth / 2
    );

    return {
      points: transformed.points.map(p => [p.x, p.y]),
      xywh: transformed.bound.serialize(),
    };
  })
  @yfield()
  lineWidth: number = 4;

  override get connectable() {
    return false;
  }

  override get type() {
    return 'brush';
  }

  override hitTest(px: number, py: number, options?: HitTestOptions): boolean {
    return isPointOnlines(
      this.elementBound,
      this.points as [number, number][],
      this.rotate,
      [px, py],
      (options?.expand ?? 10) / (options?.zoom ?? 1)
    );
  }

  override containedByBounds(bounds: Bound) {
    const points = getPointsFromBoundsWithRotation(this);
    return points.some(point => bounds.containsPoint(point));
  }

  override getNearestPoint(point: IVec2): IVec2 {
    const { x, y } = this;

    return polyLineNearestPoint(
      this.points.map(p => Vec.add(p, [x, y])),
      point
    ) as IVec2;
  }

  override intersectWithLine(start: IVec2, end: IVec2) {
    const tl = [this.x, this.y];
    const points = getPointsFromBoundsWithRotation(this, _ =>
      this.points.map(point => Vec.add(point, tl))
    );

    const box = Bound.fromDOMRect(getQuadBoundsWithRotation(this));

    if (box.w < 8 && box.h < 8) {
      return Vec.distanceToLineSegment(start, end, box.center) < 5 ? [] : null;
    }

    if (box.intersectLine(start, end, true)) {
      const len = points.length;
      for (let i = 1; i < len; i++) {
        const result = lineIntersects(start, end, points[i - 1], points[i]);
        if (result) {
          return [
            new PointLocation(
              result,
              Vec.normalize(Vec.sub(points[i], points[i - 1]))
            ),
          ];
        }
      }
    }
    return null;
  }

  override getRelativePointLocation(position: IVec2): PointLocation {
    const point = Bound.deserialize(this.xywh).getRelativePoint(position);
    return new PointLocation(point);
  }
}
