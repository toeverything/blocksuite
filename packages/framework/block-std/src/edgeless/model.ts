import type { Constructor } from '@blocksuite/global/utils';
import { BlockModel } from '@blocksuite/store';

import {
  getBoundsWithRotation,
  getPointsFromBoundsWithRotation,
  polygonGetPointTangent,
  polygonNearestPoint,
  rotatePoints,
} from '../utils/math.js';
import type { EditorHost } from '../view/index.js';
import { Bound } from './bound.js';
import { PointLocation } from './point-location.js';
import type { SerializedXYWH } from './types.js';
import type { IVec } from './vec.js';
import { Vec } from './vec.js';

export const EPSILON = 1e-12;
export const MACHINE_EPSILON = 1.12e-16;

export interface IHitTestOptions {
  expand?: number;

  /**
   * If true, the transparent area of the element will be ignored during hit test.
   * Otherwise, the transparent area will be considered as filled area.
   *
   * Default is true.
   */
  ignoreTransparent?: boolean;

  all?: boolean;
  zoom?: number;
}

export interface IEdgelessElement {
  id: string;
  xywh: SerializedXYWH;
  /**
   * In some cases, you need to draw something related to the element, but it does not belong to the element itself.
   * And it is also interactive, you can select element by clicking on it. E.g. the title of the group element.
   * In this case, we need to store this kind of external xywh in order to do hit test. This property should not be synced to the doc.
   * This property should be updated every time it gets rendered.
   */
  externalXYWH: SerializedXYWH | undefined;
  externalBound: Bound | null;
  rotate: number;
  connectable: boolean;
  index: string;

  /**
   * The bound of the element after rotation.
   * The bound without rotation should be created by `Bound.deserialize(this.xywh)`.
   */
  elementBound: Bound;
  containedByBounds(bounds: Bound): boolean;
  getNearestPoint(point: IVec): IVec;
  intersectWithLine(start: IVec, end: IVec): PointLocation[] | null;
  getRelativePointLocation(point: IVec): PointLocation;
  hitTest(
    x: number,
    y: number,
    options: IHitTestOptions,
    host: EditorHost
  ): boolean;
  boxSelect(bound: Bound): boolean;
}

export class EdgelessBlockModel<
    Props extends EdgelessSelectableProps = EdgelessSelectableProps,
  >
  extends BlockModel<Props>
  implements IEdgelessElement
{
  get externalXYWH(): SerializedXYWH | undefined {
    return this._externalXYWH;
  }

  set externalXYWH(xywh: SerializedXYWH | undefined) {
    this._externalXYWH = xywh;
  }

  get externalBound(): Bound | null {
    return this._externalXYWH ? Bound.deserialize(this._externalXYWH) : null;
  }

  get elementBound() {
    const bound = Bound.deserialize(this.xywh);
    return Bound.from(getBoundsWithRotation({ ...bound, rotate: this.rotate }));
  }

  private _externalXYWH: SerializedXYWH | undefined = undefined;

  connectable = true;

  rotate = 0;

  hitTest(x: number, y: number, _: IHitTestOptions, __: EditorHost): boolean {
    const bound = Bound.deserialize(this.xywh);
    return bound.isPointInBound([x, y], 0);
  }

  containedByBounds(bounds: Bound): boolean {
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

  getNearestPoint(point: IVec): IVec {
    const bound = Bound.deserialize(this.xywh);
    return polygonNearestPoint(
      rotatePoints(bound.points, bound.center, this.rotate ?? 0),
      point
    );
  }

  intersectWithLine(start: IVec, end: IVec): PointLocation[] | null {
    const bound = Bound.deserialize(this.xywh);

    return linePolygonIntersects(
      start,
      end,
      rotatePoints(bound.points, bound.center, this.rotate ?? 0)
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

  boxSelect(bound: Bound): boolean {
    return (
      this.containedByBounds(bound) ||
      bound.points.some((point, i, points) =>
        this.intersectWithLine(point, points[(i + 1) % points.length])
      )
    );
  }
}

export type EdgelessSelectableProps = {
  xywh: SerializedXYWH;
  index: string;
};

export function selectable<
  Props extends EdgelessSelectableProps,
  T extends Constructor<BlockModel<Props>> = Constructor<BlockModel<Props>>,
>(SuperClass: T) {
  if (SuperClass === BlockModel) {
    return EdgelessBlockModel as unknown as typeof EdgelessBlockModel<Props>;
  } else {
    let currentClass = SuperClass;

    while (
      Object.getPrototypeOf(currentClass.prototype) !== BlockModel.prototype &&
      Object.getPrototypeOf(currentClass.prototype) !== null
    ) {
      currentClass = Object.getPrototypeOf(currentClass.prototype).constructor;
    }

    if (Object.getPrototypeOf(currentClass.prototype) === null) {
      throw new Error('The SuperClass is not a subclass of BlockModel');
    }

    Object.setPrototypeOf(currentClass.prototype, EdgelessBlockModel.prototype);
  }

  return SuperClass as unknown as typeof EdgelessBlockModel<Props>;
}

export function clamp(n: number, min: number, max?: number): number {
  return Math.max(min, max !== undefined ? Math.min(n, max) : n);
}

export function almostEqual(a: number, b: number, epsilon = 0.0001) {
  return Math.abs(a - b) < epsilon;
}

export function lineIntersects(
  sp: IVec,
  ep: IVec,
  sp2: IVec,
  ep2: IVec,
  infinite = false
): IVec | null {
  const v1 = Vec.sub(ep, sp);
  const v2 = Vec.sub(ep2, sp2);
  const cross = Vec.cpr(v1, v2);
  // Avoid divisions by 0, and errors when getting too close to 0
  if (almostEqual(cross, 0, MACHINE_EPSILON)) return null;
  const d = Vec.sub(sp, sp2);
  let u1 = Vec.cpr(v2, d) / cross;
  const u2 = Vec.cpr(v1, d) / cross,
    // Check the ranges of the u parameters if the line is not
    // allowed to extend beyond the definition points, but
    // compare with EPSILON tolerance over the [0, 1] bounds.
    epsilon = /*#=*/ EPSILON,
    uMin = -epsilon,
    uMax = 1 + epsilon;

  if (infinite || (uMin < u1 && u1 < uMax && uMin < u2 && u2 < uMax)) {
    // Address the tolerance at the bounds by clipping to
    // the actual range.
    if (!infinite) {
      u1 = clamp(u1, 0, 1);
    }
    return Vec.lrp(sp, ep, u1);
  }

  return null;
}

export function linePolygonIntersects(
  sp: IVec,
  ep: IVec,
  points: IVec[]
): PointLocation[] | null {
  const result: PointLocation[] = [];
  const len = points.length;

  for (let i = 0; i < len; i++) {
    const p = points[i];
    const p2 = points[(i + 1) % len];
    const rst = lineIntersects(sp, ep, p, p2);
    if (rst) {
      const v = new PointLocation(rst);
      v.tangent = Vec.normalize(Vec.sub(p2, p));
      result.push(v);
    }
  }

  return result.length ? result : null;
}
