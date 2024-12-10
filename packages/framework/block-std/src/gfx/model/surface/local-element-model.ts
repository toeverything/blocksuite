import type { IVec, SerializedXYWH, XYWH } from '@blocksuite/global/utils';

import {
  Bound,
  deserializeXYWH,
  getPointsFromBoundWithRotation,
  linePolygonIntersects,
  PointLocation,
  polygonGetPointTangent,
  polygonNearestPoint,
  rotatePoints,
} from '@blocksuite/global/utils';
import { mutex } from 'lib0';

import type { PointerEventState } from '../../../event/index.js';
import type { EditorHost } from '../../../view/index.js';
import type { GfxCompatibleInterface, PointTestOptions } from '../base.js';
import type { GfxGroupModel } from '../model.js';
import type { SurfaceBlockModel } from './surface-model.js';

export abstract class GfxLocalElementModel implements GfxCompatibleInterface {
  private _mutex: mutex.mutex = mutex.createMutex();

  protected _local = new Map<string | symbol, unknown>();

  protected _surface: SurfaceBlockModel;

  /**
   * used to store the properties' cache key
   * when the properties required heavy computation
   */
  cache = new Map<string | symbol, unknown>();

  groupId: string = '';

  hidden: boolean = false;

  index: string = 'a0';

  onClick?: (e: PointerEventState) => void;

  onDblClick?: (e: PointerEventState) => void;

  onPointerDown?: (e: PointerEventState) => void;

  onPointerEnter?: (e: PointerEventState) => void;

  onPointerLeave?: (e: PointerEventState) => void;

  onPointerMove?: (e: PointerEventState) => void;

  onPointerUp?: (e: PointerEventState) => void;

  opacity: number = 1;

  rotate: number = 0;

  seed: number = Math.random();

  abstract readonly type: string;

  xywh: SerializedXYWH = '[0,0,0,0]';

  get deserializedXYWH() {
    if (!this._local.has('deserializedXYWH')) {
      const xywh = this.xywh;
      const deserialized = deserializeXYWH(xywh);

      this._local.set('deserializedXYWH', deserialized);
    }

    return this._local.get('deserializedXYWH') as XYWH;
  }

  get elementBound() {
    return new Bound(this.x, this.y, this.w, this.h);
  }

  get group() {
    return (
      this.groupId ? this._surface.getElementById(this.groupId) : null
    ) as GfxGroupModel | null;
  }

  get groups() {
    if (this.group) {
      const groups = this._surface.getGroups(this.group.id);
      groups.unshift(this.group);

      return groups;
    }

    return [];
  }

  get h() {
    return this.deserializedXYWH[3];
  }

  get surface() {
    return this._surface;
  }

  get w() {
    return this.deserializedXYWH[2];
  }

  get x() {
    return this.deserializedXYWH[0];
  }

  get y() {
    return this.deserializedXYWH[1];
  }

  constructor(surfaceModel: SurfaceBlockModel) {
    this._surface = surfaceModel;

    const p = new Proxy(this, {
      set: (target, prop, value) => {
        if (prop === 'xywh') {
          this._local.delete('deserializedXYWH');
        }

        // @ts-ignore
        const oldValue = target[prop as string];

        if (oldValue === value) {
          return true;
        }

        // @ts-ignore
        target[prop as string] = value;

        if (
          typeof prop === 'symbol' ||
          prop[0] === '_' ||
          typeof value === 'function' ||
          prop === 'textBound'
        ) {
          return true;
        }

        if (surfaceModel.localElementModels.has(p)) {
          this._mutex(() => {
            surfaceModel.localElementUpdated.emit({
              model: p,
              props: {
                [prop as string]: value,
              },
              oldValues: {
                [prop as string]: oldValue,
              },
            });
          });
        }

        return true;
      },
    });

    return p;
  }

  containsBound(bounds: Bound): boolean {
    return getPointsFromBoundWithRotation(this).some(point =>
      bounds.containsPoint(point)
    );
  }

  getLineIntersections(start: IVec, end: IVec) {
    const points = getPointsFromBoundWithRotation(this);
    return linePolygonIntersects(start, end, points);
  }

  getNearestPoint(point: IVec) {
    const points = getPointsFromBoundWithRotation(this);
    return polygonNearestPoint(points, point);
  }

  getRelativePointLocation(relativePoint: IVec) {
    const bound = Bound.deserialize(this.xywh);
    const point = bound.getRelativePoint(relativePoint);
    const rotatePoint = rotatePoints([point], bound.center, this.rotate)[0];
    const points = rotatePoints(bound.points, bound.center, this.rotate);
    const tangent = polygonGetPointTangent(points, rotatePoint);
    return new PointLocation(rotatePoint, tangent);
  }

  includesPoint(
    x: number,
    y: number,
    _: PointTestOptions,
    __: EditorHost
  ): boolean {
    return this.elementBound.isPointInBound([x, y]);
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
