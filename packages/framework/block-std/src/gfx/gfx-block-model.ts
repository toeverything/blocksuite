import type {
  Constructor,
  IVec,
  SerializedXYWH,
} from '@blocksuite/global/utils';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import {
  Bound,
  getBoundsWithRotation,
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  PointLocation,
  polygonGetPointTangent,
  polygonNearestPoint,
  rotatePoints,
} from '@blocksuite/global/utils';
import { BlockModel } from '@blocksuite/store';

import type { EditorHost } from '../view/index.js';
import type {
  GfxCompatibleProps,
  GfxElementGeometry,
  GfxGroupLikeElementModel,
  GfxPrimitiveElementModel,
  PointTestOptions,
} from './surface/element-model.js';

import { SurfaceBlockModel } from './surface/surface-model.js';

export class GfxBlockElementModel<
    Props extends GfxCompatibleProps = GfxCompatibleProps,
  >
  extends BlockModel<Props>
  implements GfxElementGeometry
{
  private _externalXYWH: SerializedXYWH | undefined = undefined;

  connectable = true;

  rotate = 0;

  get elementBound() {
    const bound = Bound.deserialize(this.xywh);
    return Bound.from(getBoundsWithRotation({ ...bound, rotate: this.rotate }));
  }

  get externalBound(): Bound | null {
    return this._externalXYWH ? Bound.deserialize(this._externalXYWH) : null;
  }

  get externalXYWH(): SerializedXYWH | undefined {
    return this._externalXYWH;
  }

  set externalXYWH(xywh: SerializedXYWH | undefined) {
    this._externalXYWH = xywh;
  }

  get group(): GfxGroupLikeElementModel | null {
    const surface = this.doc
      .getBlocks()
      .find(block => block instanceof SurfaceBlockModel);

    if (!surface) return null;

    return (surface as SurfaceBlockModel).getGroup(this.id) ?? null;
  }

  get groups(): GfxGroupLikeElementModel[] {
    const surface = this.doc
      .getBlocks()
      .find(block => block instanceof SurfaceBlockModel);

    if (!surface) return [];

    return (surface as SurfaceBlockModel).getGroups(this.id);
  }

  containsBound(bounds: Bound): boolean {
    const bound = Bound.deserialize(this.xywh);
    const points = getPointsFromBoundsWithRotation({
      x: bound.x,
      y: bound.y,
      w: bound.w,
      h: bound.h,
      rotate: this.rotate,
    });
    return points.some(point => bounds.containsPoint(point));
  }

  getLineIntersections(start: IVec, end: IVec): PointLocation[] | null {
    const bound = Bound.deserialize(this.xywh);

    return linePolygonIntersects(
      start,
      end,
      rotatePoints(bound.points, bound.center, this.rotate ?? 0)
    );
  }

  getNearestPoint(point: IVec): IVec {
    const bound = Bound.deserialize(this.xywh);
    return polygonNearestPoint(
      rotatePoints(bound.points, bound.center, this.rotate ?? 0),
      point
    );
  }

  getRelativePointLocation(relativePoint: IVec): PointLocation {
    const bound = Bound.deserialize(this.xywh);
    const point = bound.getRelativePoint(relativePoint);
    const rotatePoint = rotatePoints(
      [point],
      bound.center,
      this.rotate ?? 0
    )[0];
    const points = rotatePoints(bound.points, bound.center, this.rotate ?? 0);
    const tangent = polygonGetPointTangent(points, rotatePoint);

    return new PointLocation(rotatePoint, tangent);
  }

  includesPoint(
    x: number,
    y: number,
    _: PointTestOptions,
    __: EditorHost
  ): boolean {
    const bound = Bound.deserialize(this.xywh);
    return bound.isPointInBound([x, y], 0);
  }

  intersectsBound(bound: Bound): boolean {
    return (
      this.containsBound(bound) ||
      bound.points.some((point, i, points) =>
        this.getLineIntersections(point, points[(i + 1) % points.length])
      )
    );
  }
}

export function GfxCompatible<
  Props extends GfxCompatibleProps,
  T extends Constructor<BlockModel<Props>> = Constructor<BlockModel<Props>>,
>(BlockModelSuperClass: T) {
  if (BlockModelSuperClass === BlockModel) {
    return GfxBlockElementModel as unknown as typeof GfxBlockElementModel<Props>;
  } else {
    let currentClass = BlockModelSuperClass;

    while (
      Object.getPrototypeOf(currentClass.prototype) !== BlockModel.prototype &&
      Object.getPrototypeOf(currentClass.prototype) !== null
    ) {
      currentClass = Object.getPrototypeOf(currentClass.prototype).constructor;
    }

    if (Object.getPrototypeOf(currentClass.prototype) === null) {
      throw new BlockSuiteError(
        ErrorCode.GfxBlockElementError,
        'The SuperClass is not a subclass of BlockModel'
      );
    }

    Object.setPrototypeOf(
      currentClass.prototype,
      GfxBlockElementModel.prototype
    );
  }

  return BlockModelSuperClass as unknown as typeof GfxBlockElementModel<Props>;
}

export type GfxModel = GfxBlockElementModel | GfxPrimitiveElementModel;
