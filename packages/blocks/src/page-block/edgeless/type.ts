import type { EdgelessBlock as EdgelessBlockModel } from '../../_common/edgeless/mixin/edgeless-selectable.js';
import type { ElementModel } from '../../surface-block/element-model/base.js';
import type { GroupElementModel } from '../../surface-block/element-model/group.js';
import type { Bound } from '../../surface-block/utils/bound.js';
import type { PointLocation } from '../../surface-block/utils/point-location.js';
import type { IVec } from '../../surface-block/utils/vec.js';
import type { SerializedXYWH } from '../../surface-block/utils/xywh.js';

export interface HitTestOptions {
  expand?: number;
  ignoreTransparent?: boolean;
  /**
   * we will select a shape without fill color by selecting its content area if
   * we set `pierce` to false, shape element used this options in `hitTest` method
   */
  pierce?: boolean;
  all?: boolean;
  zoom?: number;
}

export interface IEdgelessElement {
  id: string;
  xywh: SerializedXYWH;
  rotate: number;
  connectable: boolean;
  index: string;
  elementBound: Bound;
  group: GroupElementModel | null;
  groups: GroupElementModel[];
  containedByBounds(bounds: Bound): boolean;
  getNearestPoint(point: IVec): IVec;
  intersectWithLine(start: IVec, end: IVec): PointLocation[] | null;
  getRelativePointLocation(point: IVec): PointLocation;
  hitTest(x: number, y: number, options: HitTestOptions): boolean;
  boxSelect(bound: Bound): boolean;
}
export interface EdgelessBlock extends EdgelessBlockModel {}

export type EdgelessElement = EdgelessBlock | ElementModel;
