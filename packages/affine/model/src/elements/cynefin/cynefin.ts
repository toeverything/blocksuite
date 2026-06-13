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

export type CynefinProps = BaseElementProps & {
  /** When false the resize handles are hidden — toggled from the toolbar. */
  resizeEnabled?: boolean;
  /** When false the domain titles + the A/C marker letters and names are hidden. */
  showTitles?: boolean;
  /** When false the explanatory text (subheadings, decisions, annotations, notes) is hidden. */
  showDescriptions?: boolean;
  /** When false the teal "iterate" liminal curve is hidden. */
  showLiminalLine?: boolean;
};

/**
 * A static "Liminal Cynefin" framework diagram: the hand-drawn five-domain
 * boundary (Complex / Complicated / Chaotic / Clear + central Confusion), the
 * hatched cliff between Chaotic and Clear, and the dashed Complicated↔Clear
 * boundary — reproduced from the official SVG paths. The user places regular
 * edgeless elements on top of it.
 *
 * Mirrors the Wardley / EDGY backgrounds: extends {@link GfxPrimitiveElementModel}
 * so it inherits selection, move, copy/paste, duplicate, align and undo/redo.
 */
export class CynefinElementModel extends GfxPrimitiveElementModel<CynefinProps> {
  get type() {
    return 'cynefin';
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

  @field(true)
  accessor resizeEnabled: boolean = true;

  @field(true)
  accessor showTitles: boolean = true;

  @field(true)
  accessor showDescriptions: boolean = true;

  @field(true)
  accessor showLiminalLine: boolean = true;

  @field(0)
  accessor rotate: number = 0;

  @field()
  accessor xywh: SerializedXYWH = '[0,0,1080,777]';
}
