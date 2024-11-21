import type {
  Bound,
  IBound,
  IVec,
  PointLocation,
  SerializedXYWH,
  XYWH,
} from '@blocksuite/global/utils';

import type { EditorHost } from '../../view/element/lit-host.js';
import type { GfxGroupModel, GfxModel } from './model.js';

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

  readonly group: GfxGroupCompatibleInterface | null;

  readonly groups: GfxGroupCompatibleInterface[];

  readonly deserializedXYWH: XYWH;

  readonly elementBound: Bound;
}

/**
 * The symbol to mark a model as a container.
 */
export const gfxGroupCompatibleSymbol = Symbol('GfxGroupCompatible');

/**
 * Check if the element is a container element.
 */
export const isGfxGroupCompatibleModel = (
  elm: unknown
): elm is GfxGroupModel => {
  if (typeof elm !== 'object' || elm === null) return false;
  return (
    gfxGroupCompatibleSymbol in elm && elm[gfxGroupCompatibleSymbol] === true
  );
};

/**
 * GfxGroupCompatibleElement is a model that can contain other models.
 * It just like a group that in common graphic software.
 */
export interface GfxGroupCompatibleInterface extends GfxCompatibleInterface {
  [gfxGroupCompatibleSymbol]: true;

  /**
   * All child ids of this container.
   */
  childIds: string[];

  /**
   * All child element models of this container.
   * Note that the `childElements` may not contains all the children in `childIds`,
   * because some children may not be loaded.
   */
  childElements: GfxModel[];

  descendantElements: GfxModel[];

  addChild(element: GfxModel): void;
  removeChild(element: GfxModel): void;
  hasChild(element: GfxModel): boolean;

  hasDescendant(element: GfxModel): boolean;
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
