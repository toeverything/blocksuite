import type { IVec, SerializedXYWH } from '@labre/global/gfx';
import {
  Bound,
  getPointsFromBoundWithRotation,
  linePolygonIntersects,
  pointInPolygon,
  polygonNearestPoint,
} from '@labre/global/gfx';
import type { BaseElementProps } from '@labre/std/gfx';
import { field, GfxPrimitiveElementModel } from '@labre/std/gfx';

export type BpmnPoolProps = BaseElementProps & {
  /** The participant name shown in the left band — edited inline on dblclick. */
  name?: string;
  /** When false the resize handles are hidden — toggled from the toolbar. */
  resizeEnabled?: boolean;
};

/**
 * A BPMN "pool": a participant container drawn as a rounded-rect frame with a
 * vertical name band on the left. It is a background element (like the wardley
 * / cynefin backgrounds): the user drops flow-object nodes on top of it. Lanes
 * are deliberately out of scope for v1.
 *
 * Mirrors the other framework background elements.
 */
export class BpmnPoolElementModel extends GfxPrimitiveElementModel<BpmnPoolProps> {
  get type() {
    return 'bpmnPool';
  }

  override get connectable() {
    return false;
  }

  override containsBound(bounds: Bound): boolean {
    const points = getPointsFromBoundWithRotation(this);
    return points.some(point => bounds.containsPoint(point));
  }

  override getLineIntersections(start: IVec, end: IVec) {
    const points = getPointsFromBoundWithRotation(this);
    return linePolygonIntersects(start, end, points);
  }

  override getNearestPoint(point: IVec): IVec {
    return polygonNearestPoint(Bound.deserialize(this.xywh).points, point) as IVec;
  }

  override includesPoint(x: number, y: number): boolean {
    const points = getPointsFromBoundWithRotation(this);
    return pointInPolygon([x, y], points);
  }

  @field('Pool')
  accessor name: string = 'Pool';

  @field(true)
  accessor resizeEnabled: boolean = true;

  @field(0)
  accessor rotate: number = 0;

  @field()
  accessor xywh: SerializedXYWH = '[0,0,560,200]';
}
