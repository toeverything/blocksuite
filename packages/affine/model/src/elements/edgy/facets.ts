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

export type EdgyFacetsProps = BaseElementProps & {
  /** When false the resize handles are hidden — toggled from the toolbar. */
  resizeEnabled?: boolean;
  /** When false the three facet name labels are hidden. */
  showLabels?: boolean;

  // ── Editable labels (double-click on the canvas to edit) ──────────────
  identityLabel?: string;
  architectureLabel?: string;
  experienceLabel?: string;
};

/**
 * A static "EDGY Enterprise Design Facets" diagram: three overlapping circles
 * (Identity / Architecture / Experience) with their three pairwise
 * intersections (Organisation / Brand / Product), the white centre and the six
 * white pictograms, drawn on the surface canvas. The user places regular
 * edgeless elements (the EDGY base shapes) on top of it.
 *
 * Mirrors {@link WardleyBackgroundElementModel}: extends
 * {@link GfxPrimitiveElementModel} so it inherits selection, move, copy/paste,
 * duplicate, align and undo/redo for free.
 */
export class EdgyFacetsElementModel extends GfxPrimitiveElementModel<EdgyFacetsProps> {
  get type() {
    return 'edgy';
  }

  /**
   * The diagram is a passive canvas: connectors must not snap their endpoints
   * to it (an EDGY link should connect elements, never the facets diagram).
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

  @field(true)
  accessor resizeEnabled: boolean = true;

  @field(true)
  accessor showLabels: boolean = true;

  @field('Identity')
  accessor identityLabel: string = 'Identity';

  @field('Architecture')
  accessor architectureLabel: string = 'Architecture';

  @field('Experience')
  accessor experienceLabel: string = 'Experience';

  @field(0)
  accessor rotate: number = 0;

  @field()
  accessor xywh: SerializedXYWH = '[0,0,1020,600]';
}
