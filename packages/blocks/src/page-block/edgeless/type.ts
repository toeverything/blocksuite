import { EdgelessBlock } from '../../_common/edgeless/mixin/edgeless-selectable.js';
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

export { EdgelessBlock };

export type EdgelessElement = EdgelessBlock | ElementModel;
