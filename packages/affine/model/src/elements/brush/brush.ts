import type {
  BaseElementProps,
  PointTestOptions,
} from '@blocksuite/block-std/gfx';

import {
  GfxPrimitiveElementModel,
  convert,
  derive,
  watch,
  yfield,
} from '@blocksuite/block-std/gfx';
import {
  Bound,
  type IVec,
  type IVec3,
  PointLocation,
  type SerializedXYWH,
  Vec,
  getBoundFromPoints,
  getPointsFromBoundsWithRotation,
  getQuadBoundsWithRotation,
  getSolidStrokePoints,
  getSvgPathFromStroke,
  inflateBound,
  isPointOnlines,
  lineIntersects,
  polyLineNearestPoint,
  transformPointsToNewBound,
} from '@blocksuite/global/utils';

import type { Color } from '../../consts/index.js';

export type BrushProps = BaseElementProps & {
  /**
   * [[x0,y0,pressure0?],[x1,y1,pressure1?]...]
   * pressure is optional and exsits when pressure sensitivity is supported, otherwise not.
   */
  points: number[][];
  color: Color;
  lineWidth: number;
};

export class BrushElementModel extends GfxPrimitiveElementModel<BrushProps> {
  static override propsToY(props: BrushProps) {
    return props;
  }

  override containsBound(bounds: Bound) {
    const points = getPointsFromBoundsWithRotation(this);
    return points.some(point => bounds.containsPoint(point));
  }

  override getLineIntersections(start: IVec, end: IVec) {
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

  override getNearestPoint(point: IVec): IVec {
    const { x, y } = this;

    return polyLineNearestPoint(
      this.points.map(p => Vec.add(p, [x, y])),
      point
    ) as IVec;
  }

  override getRelativePointLocation(position: IVec): PointLocation {
    const point = Bound.deserialize(this.xywh).getRelativePoint(position);
    return new PointLocation(point);
  }

  override includesPoint(
    px: number,
    py: number,
    options?: PointTestOptions
  ): boolean {
    const hit = isPointOnlines(
      Bound.deserialize(this.xywh),
      this.points as [number, number][],
      this.rotate,
      [px, py],
      (options?.expand ?? 10) / Math.min(options?.zoom ?? 1, 1)
    );
    return hit;
  }

  /**
   * The SVG path commands for the brush.
   */
  get commands() {
    if (!this._local.has('commands')) {
      const stroke = getSolidStrokePoints(this.points, this.lineWidth);
      const commands = getSvgPathFromStroke(stroke);

      this._local.set('commands', commands);
    }

    return this._local.get('commands') as string;
  }

  override get connectable() {
    return false;
  }

  override get type() {
    return 'brush';
  }

  @yfield()
  accessor color: Color = '#000000';

  @watch((_, instance) => {
    instance['_local'].delete('commands');
  })
  @derive((lineWidth: number, instance: Instance) => {
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
      points: transformed.points.map((p, i) => [
        p.x,
        p.y,
        ...(points[i][2] !== undefined ? [points[i][2]] : []),
      ]),
      xywh: transformed.bound.serialize(),
    };
  })
  @yfield()
  accessor lineWidth: number = 4;

  @watch((_, instance) => {
    instance['_local'].delete('commands');
  })
  @derive((points: IVec[], instance: Instance) => {
    const lineWidth = instance.lineWidth;
    const bound = getBoundFromPoints(points);
    const boundWidthLineWidth = inflateBound(bound, lineWidth);

    return {
      xywh: boundWidthLineWidth.serialize(),
    };
  })
  @convert((points: (IVec | IVec3)[], instance) => {
    const lineWidth = instance.lineWidth;
    const bound = getBoundFromPoints(points as IVec[]);
    const boundWidthLineWidth = inflateBound(bound, lineWidth);
    const relativePoints = points.map(([x, y, pressure]) => [
      x - boundWidthLineWidth.x,
      y - boundWidthLineWidth.y,
      ...(pressure !== undefined ? [pressure] : []),
    ]);

    return relativePoints;
  })
  @yfield()
  accessor points: (IVec | IVec3)[] = [];

  @yfield(0)
  accessor rotate: number = 0;

  @derive((xywh: SerializedXYWH, instance: Instance) => {
    const bound = Bound.deserialize(xywh);
    if (bound.w === instance.w && bound.h === instance.h) return {};

    const { lineWidth } = instance;

    const transformed = transformPointsToNewBound(
      instance.points.map(([x, y]) => ({ x, y })),
      instance,
      lineWidth / 2,
      bound,
      lineWidth / 2
    );

    return {
      points: transformed.points.map((p, i) => [
        p.x,
        p.y,
        ...(instance.points[i][2] !== undefined ? [instance.points[i][2]] : []),
      ]),
    };
  })
  @yfield()
  accessor xywh: SerializedXYWH = '[0,0,0,0]';
}

type Instance = GfxPrimitiveElementModel<BrushProps> & BrushProps;

declare global {
  namespace BlockSuite {
    interface SurfaceElementModelMap {
      brush: BrushElementModel;
    }
  }
}
