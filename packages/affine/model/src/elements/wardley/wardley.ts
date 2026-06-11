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

/**
 * Background flavour. `classic` is the plain Wardley frame; the others overlay a
 * curve-driven colour gradient inscribed in the same frame (Slice C).
 */
export type WardleyBgVariant =
  | 'classic'
  | 'opportunity'
  | 'benefit'
  | 'evolution-gradient';

export type WardleyBackgroundProps = BaseElementProps & {
  /** When false (default) the resize handles are hidden — toggled from the toolbar. */
  resizeEnabled?: boolean;
  /** When true the four evolution zones get a light tint (style B). */
  banded?: boolean;
  /** Gradient variant inscribed in the frame. */
  variant?: WardleyBgVariant;
  /** When false, the variant gradient is hidden (plain white background). */
  showGradient?: boolean;

  // ── Editable labels (double-click on the canvas to edit) ──────────────
  xAxisTitle?: string;
  yAxisTitle?: string;
  evolutionStart?: string;
  evolutionEnd?: string;
  visibilityHigh?: string;
  visibilityLow?: string;
  phase0?: string;
  phase1?: string;
  phase2?: string;
  phase3?: string;

  // ── Per-part visibility (toggled from the toolbar) ────────────────────
  showXAxis?: boolean;
  showYAxis?: boolean;
  showColumnDividers?: boolean;
  showColumnLabels?: boolean;
  showCornerLabels?: boolean;
  showVisibilityLabels?: boolean;
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

  @field('classic' as WardleyBgVariant)
  accessor variant: WardleyBgVariant = 'classic';

  @field(true)
  accessor showGradient: boolean = true;

  @field(false)
  accessor resizeEnabled: boolean = false;

  // ── Editable label texts (defaults mirror the original hard-coded ones) ─
  @field('Evolution')
  accessor xAxisTitle: string = 'Evolution';

  @field('Value Chain')
  accessor yAxisTitle: string = 'Value Chain';

  @field('Uncharted')
  accessor evolutionStart: string = 'Uncharted';

  @field('Industrialized')
  accessor evolutionEnd: string = 'Industrialized';

  @field('Visible')
  accessor visibilityHigh: string = 'Visible';

  @field('Invisible')
  accessor visibilityLow: string = 'Invisible';

  @field('Genesis')
  accessor phase0: string = 'Genesis';

  @field('Custom-Built')
  accessor phase1: string = 'Custom-Built';

  @field('Product (+Rental)')
  accessor phase2: string = 'Product (+Rental)';

  @field('Commodity (+Utility)')
  accessor phase3: string = 'Commodity (+Utility)';

  // ── Per-part visibility toggles ───────────────────────────────────────
  @field(true)
  accessor showXAxis: boolean = true;

  @field(true)
  accessor showYAxis: boolean = true;

  @field(true)
  accessor showColumnDividers: boolean = true;

  @field(true)
  accessor showColumnLabels: boolean = true;

  @field(true)
  accessor showCornerLabels: boolean = true;

  @field(true)
  accessor showVisibilityLabels: boolean = true;

  @field(0)
  accessor rotate: number = 0;

  @field()
  accessor xywh: SerializedXYWH = '[0,0,1600,900]';
}
