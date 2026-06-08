import type { IVec, SerializedXYWH } from '@blocksuite/global/gfx';
import {
  Bound,
  getPointsFromBoundWithRotation,
  linePolygonIntersects,
  pointInPolygon,
  polygonNearestPoint,
} from '@blocksuite/global/gfx';
import type { BaseElementProps } from '@blocksuite/std/gfx';
import { field, GfxPrimitiveElementModel } from '@blocksuite/std/gfx';

export type WardleyBackgroundProps = BaseElementProps & {
  /** When false (default) the resize handles are hidden — toggled from the toolbar. */
  resizeEnabled?: boolean;
  /** When true the four evolution zones get a light tint (style B). */
  banded?: boolean;
};

/**
 * A static "Wardley map background": an L-shaped axes frame (Evolution X /
 * Value Chain Y) with the four evolution phase dividers and labels, drawn on
 * the surface canvas. The user places regular edgeless elements on top of it.
 *
 * Extends {@link GfxPrimitiveElementModel} so it inherits selection, move,
 * copy/paste, duplicate, align and undo/redo for free.
 */
export class WardleyBackgroundElementModel extends GfxPrimitiveElementModel<WardleyBackgroundProps> {
  get type() {
    return 'wardley';
  }

  /**
   * The background is a passive canvas: connectors must not snap their
   * endpoints to it (a Wardley arrow should connect nodes, never the map).
   */
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

  @field(false)
  accessor banded: boolean = false;

  @field(false)
  accessor resizeEnabled: boolean = false;

  @field(0)
  accessor rotate: number = 0;

  @field()
  accessor xywh: SerializedXYWH = '[0,0,1600,900]';
}
