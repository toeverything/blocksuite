import {
  type RoughCanvas,
  ToolOverlay,
} from '@labre/affine-block-surface';
import type { StrokeStyle } from '@labre/affine-model';
import type { GfxController } from '@labre/std/gfx';

/**
 * Radius of the vertex indicator circles drawn at each placed vertex.
 */
const VERTEX_INDICATOR_RADIUS = 4;

/**
 * Radius of the snap indicator shown when cursor is near the first vertex.
 */
const CLOSE_SNAP_INDICATOR_RADIUS = 8;

/**
 * Distance threshold to show the snap-close indicator (model coords).
 */
const CLOSE_SNAP_DISTANCE = 10;

/**
 * Overlay that renders the in-progress polygon while the user is placing
 * vertices with the PolygonTool. It draws:
 *
 * - Filled polygon preview (with partial transparency)
 * - Edges between placed vertices using the current stroke style
 * - A "rubber band" dashed line from the last vertex to the cursor
 * - Small circles at each vertex position
 * - A snap indicator when the cursor is near the first vertex
 */
export class PolygonDrawingOverlay extends ToolOverlay {
  /** Currently placed vertices in model coordinates. */
  vertices: [number, number][] = [];

  /** Current cursor position in model coordinates. */
  cursorPos: [number, number] | null = null;

  /** Whether a drawing session is in progress. */
  isDrawing = false;

  private _strokeColor: string;
  private _fillColor: string;
  private _strokeStyle: StrokeStyle;
  private _strokeWidth: number;

  constructor(
    gfx: GfxController,
    options: {
      strokeColor: string;
      fillColor: string;
      strokeStyle?: StrokeStyle;
      strokeWidth?: number;
    }
  ) {
    super(gfx);
    this._strokeColor = options.strokeColor;
    this._fillColor = options.fillColor;
    this._strokeStyle = options.strokeStyle ?? ('solid' as StrokeStyle);
    this._strokeWidth = options.strokeWidth ?? 4;
  }

  /**
   * Apply the line dash pattern matching the current stroke style.
   */
  private _applyStrokeDash(ctx: CanvasRenderingContext2D): void {
    switch (this._strokeStyle) {
      case 'dash':
        ctx.setLineDash([12, 12]);
        break;
      case 'none':
        ctx.setLineDash([]);
        break;
      default:
        // solid
        ctx.setLineDash([]);
        break;
    }
  }

  /**
   * Returns the effective stroke color, taking `none` stroke style into
   * account (renders as transparent).
   */
  private _effectiveStrokeColor(): string {
    return this._strokeStyle === 'none' ? 'transparent' : this._strokeColor;
  }

  override render(ctx: CanvasRenderingContext2D, _rc: RoughCanvas): void {
    const { vertices, cursorPos, isDrawing } = this;
    ctx.globalAlpha = this.globalAlpha;

    if (!isDrawing || vertices.length === 0) return;

    const effectiveStroke = this._effectiveStrokeColor();
    const strokeWidth = Math.max(this._strokeWidth, 1);

    // Build the preview path (placed vertices + cursor position)
    const allPoints: [number, number][] = [...vertices];
    if (cursorPos) {
      allPoints.push(cursorPos);
    }

    // Draw the filled polygon preview (semi-transparent)
    if (allPoints.length >= 3) {
      ctx.beginPath();
      ctx.moveTo(allPoints[0][0], allPoints[0][1]);
      for (let i = 1; i < allPoints.length; i++) {
        ctx.lineTo(allPoints[i][0], allPoints[i][1]);
      }
      ctx.closePath();
      ctx.fillStyle = this._fillColor;
      ctx.globalAlpha = this.globalAlpha * 0.15;
      ctx.fill();
      ctx.globalAlpha = this.globalAlpha;
    }

    // Draw edges between placed vertices using the current stroke style
    if (vertices.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(vertices[0][0], vertices[0][1]);
      for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i][0], vertices[i][1]);
      }
      ctx.strokeStyle = effectiveStroke;
      ctx.lineWidth = strokeWidth;
      this._applyStrokeDash(ctx);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw rubber band line from last vertex to cursor (always dashed for UX clarity)
    if (cursorPos && vertices.length >= 1) {
      const last = vertices[vertices.length - 1];
      ctx.beginPath();
      ctx.moveTo(last[0], last[1]);
      ctx.lineTo(cursorPos[0], cursorPos[1]);
      ctx.strokeStyle = this._strokeColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Also draw a dashed line from cursor back to first vertex (closing preview)
      if (vertices.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(cursorPos[0], cursorPos[1]);
        ctx.lineTo(vertices[0][0], vertices[0][1]);
        ctx.strokeStyle = this._strokeColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.globalAlpha = this.globalAlpha * 0.4;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = this.globalAlpha;
      }
    }

    // Draw vertex indicator circles
    for (let i = 0; i < vertices.length; i++) {
      const [vx, vy] = vertices[i];
      ctx.beginPath();
      ctx.arc(vx, vy, VERTEX_INDICATOR_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? this._strokeColor : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = this._strokeColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.stroke();
    }

    // Draw close-snap indicator when cursor is near the first vertex
    if (cursorPos && vertices.length >= 3) {
      const [fx, fy] = vertices[0];
      const dist = Math.sqrt(
        (cursorPos[0] - fx) ** 2 + (cursorPos[1] - fy) ** 2
      );
      // Scale thresholds by zoom so the indicator is consistent at all zoom levels
      const zoom = this.gfx.viewport.zoom;
      const snapDist = CLOSE_SNAP_DISTANCE / zoom;
      if (dist < snapDist) {
        const indicatorRadius = CLOSE_SNAP_INDICATOR_RADIUS / zoom;
        ctx.beginPath();
        ctx.arc(fx, fy, indicatorRadius, 0, Math.PI * 2);
        ctx.strokeStyle = this._strokeColor;
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([]);
        ctx.globalAlpha = this.globalAlpha * 0.6;
        ctx.stroke();
        ctx.globalAlpha = this.globalAlpha;
      }
    }
  }
}
