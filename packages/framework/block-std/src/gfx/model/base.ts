import type {
  Bound,
  IBound,
  IVec,
  PointLocation,
  SerializedXYWH,
  XYWH,
} from '@blocksuite/global/utils';

import type { EditorHost } from '../../view/element/lit-host.js';

/**
 * The methods that a graphic element should implement.
 * It is already included in the `GfxCompatibleInterface` interface.
 */
export interface GfxElementGeometry {
  containsBound(bound: Bound): boolean;
  getNearestPoint(point: IVec): IVec;
  getLineIntersections(start: IVec, end: IVec): PointLocation[] | null;
  getRelativePointLocation(point: IVec): PointLocation;
  includesPoint(
    x: number,
    y: number,
    options: PointTestOptions,
    host: EditorHost
  ): boolean;
  intersectsBound(bound: Bound): boolean;
}

/**
 * All the model that can be rendered in graphics mode should implement this interface.
 */
export interface GfxCompatibleInterface extends IBound, GfxElementGeometry {
  xywh: SerializedXYWH;
  index: string;

  readonly deserializedXYWH: XYWH;

  readonly elementBound: Bound;
}

/**
 * The options for the hit testing of a point.
 */
export interface PointTestOptions {
  /**
   * The threshold of the hit test. The unit is pixel.
   */
  hitThreshold?: number;

  /**
   * The padding of the response area for each element when do the hit testing. The unit is pixel.
   * The first value is the padding for the x-axis, and the second value is the padding for the y-axis.
   */
  responsePadding?: [number, number];

  /**
   * If true, the transparent area of the element will be ignored during the point inclusion test.
   * Otherwise, the transparent area will be considered as filled area.
   *
   * Default is true.
   */
  ignoreTransparent?: boolean;

  /**
   * The zoom level of current view when do the hit testing.
   */
  zoom?: number;
}
