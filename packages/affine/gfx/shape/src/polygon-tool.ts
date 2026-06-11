import {
  CanvasElementType,
  DefaultTool,
  EXCLUDING_MOUSE_OUT_CLASS_LIST,
  type SurfaceBlockComponent,
} from '@labre/affine-block-surface';
import {
  DefaultTheme,
  ShapeType,
  type StrokeStyle,
} from '@labre/affine-model';
import {
  EditPropsStore,
  TelemetryProvider,
  ThemeProvider,
} from '@labre/affine-shared/services';
import { hasClassNameInList } from '@labre/affine-shared/utils';
import { Bound } from '@labre/global/gfx';
import type { PointerEventState } from '@labre/std';
import { BaseTool, type GfxController } from '@labre/std/gfx';

import { PolygonDrawingOverlay } from './overlay/polygon-drawing-overlay.js';

/**
 * Minimum distance (in model coords) between vertices to prevent
 * accidental double-placement.
 */
const MIN_VERTEX_DISTANCE = 5;

/**
 * Distance threshold (in model coords) to snap to the first vertex
 * and close the polygon.
 */
const CLOSE_SNAP_DISTANCE = 10;

export type PolygonToolOption = Record<string, unknown>;

/**
 * PolygonTool allows users to draw arbitrary polygons by clicking to place
 * vertices on the edgeless canvas. The polygon is finalised by either:
 * - Double-clicking (places the last vertex and finishes)
 * - Clicking near the first vertex (closes the polygon)
 * - Pressing Escape (cancels the current drawing)
 * - Pressing Enter (finishes the polygon if >= 3 vertices)
 *
 * During drawing, a live overlay previews the in-progress polygon including
 * a "rubber band" line from the last placed vertex to the current cursor.
 */
export class PolygonTool extends BaseTool<PolygonToolOption> {
  static override toolName: string = 'polygon';

  /** Placed vertices in model (canvas) coordinates. */
  private _vertices: [number, number][] = [];

  /** Current cursor position in model coordinates, for the rubber-band line. */
  private _cursorPos: [number, number] | null = null;

  /** Whether we are currently in a drawing session. */
  private _isDrawing = false;

  /** Overlay for rendering the in-progress polygon preview. */
  private _drawingOverlay: PolygonDrawingOverlay | null = null;

  private get _surfaceComponent() {
    return this.gfx.surfaceComponent as SurfaceBlockComponent | null;
  }

  constructor(gfx: GfxController) {
    super(gfx);
  }

  override activate() {
    this._reset();
    this._createOverlay();
  }

  override deactivate() {
    this._reset();
    this._removeOverlay();
  }

  override mounted() {
    // Listen for Escape and Enter keys during drawing
    const keydownHandler = (evt: KeyboardEvent) => {
      if (!this.active || !this._isDrawing) return;

      if (evt.key === 'Escape') {
        evt.preventDefault();
        this._cancelDrawing();
      } else if (evt.key === 'Enter') {
        evt.preventDefault();
        this._finishDrawing();
      }
    };

    document.addEventListener('keydown', keydownHandler);
    this.disposable.add(() => {
      document.removeEventListener('keydown', keydownHandler);
    });
  }

  /**
   * Each click places a new vertex. If the click is close to the first
   * vertex and we have >= 3 vertices, the polygon is closed and finalised.
   */
  override click(e: PointerEventState): void {
    const [mx, my] = this.gfx.viewport.toModelCoord(e.point.x, e.point.y);

    if (!this._isDrawing) {
      // Start a new polygon drawing session
      this._isDrawing = true;
      this._vertices = [[mx, my]];
      this._cursorPos = [mx, my];
      this._updateOverlay();
      return;
    }

    // Scale thresholds by zoom so they feel consistent at all zoom levels
    const zoom = this.gfx.viewport.zoom;
    const closeSnapDist = CLOSE_SNAP_DISTANCE / zoom;
    const minVertexDist = MIN_VERTEX_DISTANCE / zoom;

    // Check if clicking near the first vertex to close the polygon
    if (this._vertices.length >= 3) {
      const [fx, fy] = this._vertices[0];
      const dist = Math.sqrt((mx - fx) ** 2 + (my - fy) ** 2);
      if (dist < closeSnapDist) {
        this._finishDrawing();
        return;
      }
    }

    // Prevent placing vertices too close together
    if (this._vertices.length > 0) {
      const last = this._vertices[this._vertices.length - 1];
      const dist = Math.sqrt((mx - last[0]) ** 2 + (my - last[1]) ** 2);
      if (dist < minVertexDist) {
        return;
      }
    }

    // Place a new vertex
    this._vertices.push([mx, my]);
    this._updateOverlay();
  }

  /**
   * Double-click finishes the polygon, placing the final vertex
   * at the double-click position (if valid).
   */
  override doubleClick(e: PointerEventState): void {
    if (!this._isDrawing) return;

    const [mx, my] = this.gfx.viewport.toModelCoord(e.point.x, e.point.y);

    // Add the final vertex if it's not too close to the last one
    if (this._vertices.length > 0) {
      const last = this._vertices[this._vertices.length - 1];
      const dist = Math.sqrt((mx - last[0]) ** 2 + (my - last[1]) ** 2);
      const minVertexDist = MIN_VERTEX_DISTANCE / this.gfx.viewport.zoom;
      if (dist >= minVertexDist) {
        this._vertices.push([mx, my]);
      }
    }

    this._finishDrawing();
  }

  /**
   * Track cursor position for the rubber-band preview line.
   */
  override pointerMove(e: PointerEventState): void {
    const [x, y] = this.gfx.viewport.toModelCoord(e.x, e.y);
    this._cursorPos = [x, y];

    if (this._drawingOverlay) {
      this._drawingOverlay.globalAlpha = 1;
    }

    this._updateOverlay();
  }

  override pointerOut(e: PointerEventState): void {
    if (
      e.raw.relatedTarget &&
      hasClassNameInList(
        e.raw.relatedTarget as Element,
        EXCLUDING_MOUSE_OUT_CLASS_LIST
      )
    )
      return;

    if (this._drawingOverlay && !this._isDrawing) {
      this._drawingOverlay.globalAlpha = 0;
      this._surfaceComponent?.refresh();
    }
  }

  /**
   * Prevent default drag behavior while drawing polygon.
   * We consume drag events to avoid interference with the canvas.
   */
  override dragStart(_e: PointerEventState): void {
    // Do nothing - polygon tool uses clicks, not drags
  }

  override dragMove(_e: PointerEventState): void {
    // Do nothing
  }

  override dragEnd(_e: PointerEventState): void {
    // Do nothing
  }

  /**
   * Finish the polygon: compute bounding box, normalize vertices, and create
   * the shape element on the surface.
   */
  private _finishDrawing() {
    if (this._vertices.length < 3) {
      this._cancelDrawing();
      return;
    }

    const vertices = this._vertices;

    // Compute bounding box of all vertices
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const [vx, vy] of vertices) {
      if (vx < minX) minX = vx;
      if (vy < minY) minY = vy;
      if (vx > maxX) maxX = vx;
      if (vy > maxY) maxY = vy;
    }

    const w = maxX - minX;
    const h = maxY - minY;

    // Guard against degenerate polygons
    if (w < 1 || h < 1) {
      this._cancelDrawing();
      return;
    }

    // Normalize vertices to [0, 1] relative to bounding box
    const normalizedVertices = vertices.map(([vx, vy]) => [
      (vx - minX) / w,
      (vy - minY) / h,
    ]);

    // Ensure clockwise winding order using the shoelace formula.
    // Positive signed area = counter-clockwise, so reverse to make clockwise.
    // This is done once at creation time so downstream tangent computation
    // always produces outward-pointing normals.
    let signedArea2 = 0;
    for (let i = 0; i < normalizedVertices.length; i++) {
      const [x1, y1] = normalizedVertices[i];
      const [x2, y2] =
        normalizedVertices[(i + 1) % normalizedVertices.length];
      signedArea2 += (x2 - x1) * (y2 + y1);
    }
    // In screen coordinates (Y-down), positive signedArea2 means
    // counter-clockwise winding, so reverse to get clockwise.
    // smoothFlags and controlPoints arrays are indexed parallel to vertices,
    // so they must be reversed in sync to maintain correct per-vertex mapping.
    let smoothFlagsForModel: boolean[] | null = null;
    let controlPointsForModel: (number[] | null)[] | null = null;
    if (signedArea2 > 0) {
      normalizedVertices.reverse();
      if (smoothFlagsForModel) {
        smoothFlagsForModel = [...smoothFlagsForModel].reverse();
      }
      if (controlPointsForModel) {
        controlPointsForModel = [...controlPointsForModel].reverse();
      }
    }

    const bound = new Bound(minX, minY, w, h);

    // Get last-used shape attributes for styling
    const _shapeName = ShapeType.Polygon;
    void (
      this.std.get(EditPropsStore).lastProps$.value[`shape:${_shapeName}`] ??
      this.std.get(EditPropsStore).lastProps$.value['shape:rect']
    );

    this.doc.captureSync();

    const id = this.gfx.surface!.addElement({
      type: CanvasElementType.SHAPE,
      shapeType: ShapeType.Polygon,
      xywh: bound.serialize(),
      radius: 0,
      vertices: normalizedVertices,
      isClosed: true,
      smoothFlags: smoothFlagsForModel,
      ...(controlPointsForModel ? { controlPoints: controlPointsForModel } : {}),
    });

    this.std.getOptional(TelemetryProvider)?.track('CanvasElementAdded', {
      control: 'canvas:draw',
      page: 'whiteboard editor',
      module: 'toolbar',
      segment: 'toolbar',
      type: CanvasElementType.SHAPE,
      other: {
        shapeName: 'polygon',
      },
    });

    // Select the newly created element and switch to default tool
    const element = this.gfx.getElementById(id);
    if (element) {
      this.controller.setTool(DefaultTool);
      this.gfx.selection.set({
        elements: [element.id],
        editing: false,
      });
    }

    this._reset();
    this._removeOverlay();
  }

  /**
   * Cancel the current drawing session and reset state.
   */
  private _cancelDrawing() {
    this._reset();
    this._updateOverlay();
  }

  /**
   * Reset the drawing state.
   */
  private _reset() {
    this._vertices = [];
    this._cursorPos = null;
    this._isDrawing = false;
  }

  /**
   * Create the overlay for previewing the in-progress polygon.
   */
  private _createOverlay() {
    this._removeOverlay();

    const strokeColor = this._getStrokeColor();
    const fillColor = this._getFillColor();
    const { strokeStyle, strokeWidth } = this._getStrokeProps();

    this._drawingOverlay = new PolygonDrawingOverlay(this.gfx, {
      strokeColor,
      fillColor,
      strokeStyle,
      strokeWidth,
    });
    this._surfaceComponent?.renderer.addOverlay(this._drawingOverlay);
  }

  /**
   * Remove the drawing overlay.
   */
  private _removeOverlay() {
    if (!this._drawingOverlay) return;
    this._drawingOverlay.dispose();
    this._surfaceComponent?.renderer.removeOverlay(this._drawingOverlay);
    this._drawingOverlay = null;
    this._surfaceComponent?.renderer.refresh();
  }

  /**
   * Update the overlay with current vertices and cursor position.
   */
  private _updateOverlay() {
    if (!this._drawingOverlay) return;
    this._drawingOverlay.vertices = this._vertices;
    this._drawingOverlay.cursorPos = this._cursorPos;
    this._drawingOverlay.isDrawing = this._isDrawing;
    this._surfaceComponent?.refresh();
  }

  private _getStrokeColor(): string {
    const shapeName = ShapeType.Polygon;
    const props =
      this.std.get(EditPropsStore).lastProps$.value[`shape:${shapeName}`] ??
      this.std.get(EditPropsStore).lastProps$.value['shape:rect'];

    return this.std
      .get(ThemeProvider)
      .getColorValue(
        props?.strokeColor,
        DefaultTheme.shapeStrokeColor,
        true
      );
  }

  private _getStrokeProps(): {
    strokeStyle: StrokeStyle;
    strokeWidth: number;
  } {
    const shapeName = ShapeType.Polygon;
    const props =
      this.std.get(EditPropsStore).lastProps$.value[`shape:${shapeName}`] ??
      this.std.get(EditPropsStore).lastProps$.value['shape:rect'];

    return {
      strokeStyle: (props?.strokeStyle as StrokeStyle) ?? ('solid' as StrokeStyle),
      strokeWidth: (props?.strokeWidth as number) ?? 4,
    };
  }

  private _getFillColor(): string {
    const shapeName = ShapeType.Polygon;
    const props =
      this.std.get(EditPropsStore).lastProps$.value[`shape:${shapeName}`] ??
      this.std.get(EditPropsStore).lastProps$.value['shape:rect'];

    return this.std
      .get(ThemeProvider)
      .getColorValue(
        props?.fillColor,
        DefaultTheme.shapeFillColor,
        true
      );
  }
}
