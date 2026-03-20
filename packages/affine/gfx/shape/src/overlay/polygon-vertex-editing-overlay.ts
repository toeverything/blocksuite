import {
  type RoughCanvas,
  ToolOverlay,
} from '@blocksuite/affine-block-surface';
import { ShapeElementModel, ShapeType } from '@blocksuite/affine-model';
import { Bound } from '@blocksuite/global/gfx';
import type { GfxController } from '@blocksuite/std/gfx';

// ─── Visual constants ───────────────────────────────────────────────────────

/** Radius of a normal vertex handle (screen pixels, divided by zoom). */
const VERTEX_HANDLE_RADIUS = 5;

/** Radius of a hovered vertex handle (screen pixels, divided by zoom). */
const VERTEX_HANDLE_HOVER_RADIUS = 7;

/** Radius of a dragged vertex handle (screen pixels, divided by zoom). */
const VERTEX_HANDLE_ACTIVE_RADIUS = 8;

/** Hit-test distance to consider the cursor "over" a vertex (screen px). */
const VERTEX_HIT_DISTANCE = 10;

/** Snap distance in model coordinates for coordinate alignment guides. */
const SNAP_GUIDE_DISTANCE = 6;

/** Color for default vertex handles. */
const HANDLE_FILL_COLOR = '#ffffff';

/** Color for hovered vertex handles. */
const HANDLE_HOVER_FILL_COLOR = '#d0ebff';

/** Color for actively dragged vertex handles. */
const HANDLE_ACTIVE_FILL_COLOR = '#339af0';

/** Snap guide line color. */
const SNAP_GUIDE_COLOR = '#f06595';

/** Edge midpoint handle radius. */
const MIDPOINT_HANDLE_RADIUS = 3.5;

/** Hovered edge midpoint handle radius. */
const MIDPOINT_HANDLE_HOVER_RADIUS = 5;

/** Color for edge midpoint handles. */
const MIDPOINT_FILL_COLOR = '#e9ecef';

/** Color for hovered edge midpoint handles. */
const MIDPOINT_HOVER_FILL_COLOR = '#d0ebff';

/** Hit-test distance for edge midpoint handles (screen px). */
const MIDPOINT_HIT_DISTANCE = 10;

/** Bezier control handle radius. */
const BEZIER_HANDLE_RADIUS = 4;

/** Bezier control handle color. */
const BEZIER_HANDLE_COLOR = '#e64980';

/** Bezier control line color. */
const BEZIER_LINE_COLOR = '#e64980';

// ─── Overlay class ──────────────────────────────────────────────────────────

/**
 * Overlay rendered on top of a selected polygon shape that provides:
 *
 * - Vertex handle circles at each polygon vertex (with hover/active states)
 * - Edge midpoint indicators
 * - Coordinate snapping guides while dragging a vertex
 * - Real-time polygon path update feedback during vertex drag
 *
 * This overlay works alongside the standard bounding-box resize handles
 * provided by the framework. Vertex editing is activated when the user
 * double-clicks a selected polygon (entering editing mode) or when a
 * polygon is first selected (non-editing mode shows smaller handles).
 */
export class PolygonVertexEditingOverlay extends ToolOverlay {
  // ── Linked polygon element ──────────────────────────────────────────

  /** ID of the polygon element this overlay is attached to. */
  private _elementId: string | null = null;

  // ── Interaction state ───────────────────────────────────────────────

  /** Index of the currently hovered vertex (-1 = none). */
  hoveredVertexIndex = -1;

  /** Index of the currently hovered edge midpoint (-1 = none). */
  hoveredMidpointIndex = -1;

  /** Index of the vertex currently being dragged (-1 = none). */
  activeVertexIndex = -1;

  /** Whether vertex editing mode is enabled (double-click to enter). */
  isEditing = false;

  /** Current cursor position in model coordinates (for hover testing). */
  cursorModelPos: [number, number] | null = null;

  /** Index of the vertex whose Bezier control handle is being dragged (-1 = none). */
  activeBezierHandleIndex = -1;

  /** Which handle of the active bezier vertex is being dragged (0=cp1, 1=cp2, -1=none). */
  activeBezierHandleType: number = -1;

  // ── Snap guide state ────────────────────────────────────────────────

  /** Horizontal snap guide Y coordinate (null = hidden). */
  snapGuideY: number | null = null;

  /** Vertical snap guide X coordinate (null = hidden). */
  snapGuideX: number | null = null;

  constructor(gfx: GfxController) {
    super(gfx);
  }

  /** Attach this overlay to a specific polygon element. */
  setElement(elementId: string) {
    this._elementId = elementId;
  }

  /** Get the linked ShapeElementModel if it's a polygon. */
  private _getPolygonModel(): ShapeElementModel | null {
    if (!this._elementId) return null;
    const el = this.gfx.getElementById(this._elementId);
    if (
      el instanceof ShapeElementModel &&
      el.shapeType === ShapeType.Polygon
    ) {
      return el;
    }
    return null;
  }

  /**
   * Convert a normalized [0-1] vertex to absolute model coordinates
   * based on the polygon's bounding box.
   */
  private _toAbsolute(
    nv: number[],
    bound: Bound
  ): [number, number] {
    return [bound.x + nv[0] * bound.w, bound.y + nv[1] * bound.h];
  }

  /**
   * Test if a model-coordinate point is within hit distance of a vertex.
   */
  hitTestVertex(
    modelX: number,
    modelY: number
  ): number {
    const model = this._getPolygonModel();
    if (!model || !model.vertices) return -1;

    const bound = Bound.deserialize(model.xywh);
    const zoom = this.gfx.viewport.zoom;
    const hitDist = VERTEX_HIT_DISTANCE / zoom;

    for (let i = 0; i < model.vertices.length; i++) {
      const [ax, ay] = this._toAbsolute(model.vertices[i], bound);
      const dx = modelX - ax;
      const dy = modelY - ay;
      if (Math.sqrt(dx * dx + dy * dy) < hitDist) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Move a vertex to a new absolute position, computing snap guides
   * against other vertices. Updates the model's normalized vertices
   * and bounding box.
   */
  moveVertex(
    vertexIndex: number,
    modelX: number,
    modelY: number
  ): void {
    const model = this._getPolygonModel();
    if (!model || !model.vertices) return;

    const bound = Bound.deserialize(model.xywh);
    const zoom = this.gfx.viewport.zoom;
    const snapDist = SNAP_GUIDE_DISTANCE / zoom;

    // Collect absolute positions of all other vertices for snapping
    const otherAbsolute: [number, number][] = [];
    for (let i = 0; i < model.vertices.length; i++) {
      if (i === vertexIndex) continue;
      otherAbsolute.push(this._toAbsolute(model.vertices[i], bound));
    }

    // Attempt coordinate snapping
    let snappedX = modelX;
    let snappedY = modelY;
    this.snapGuideX = null;
    this.snapGuideY = null;

    for (const [ox, oy] of otherAbsolute) {
      if (Math.abs(modelX - ox) < snapDist) {
        snappedX = ox;
        this.snapGuideX = ox;
      }
      if (Math.abs(modelY - oy) < snapDist) {
        snappedY = oy;
        this.snapGuideY = oy;
      }
    }

    // Compute new absolute vertices array
    const newAbsVertices: [number, number][] = model.vertices.map(
      (v, i) =>
        i === vertexIndex
          ? ([snappedX, snappedY] as [number, number])
          : (this._toAbsolute(v, bound) as [number, number])
    );

    // Re-compute bounding box from new absolute positions
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const [vx, vy] of newAbsVertices) {
      if (vx < minX) minX = vx;
      if (vy < minY) minY = vy;
      if (vx > maxX) maxX = vx;
      if (vy > maxY) maxY = vy;
    }

    const w = Math.max(maxX - minX, 1);
    const h = Math.max(maxY - minY, 1);

    // Re-normalize vertices to new bounding box
    const normalized = newAbsVertices.map(([vx, vy]) => [
      (vx - minX) / w,
      (vy - minY) / h,
    ]);

    const newBound = new Bound(minX, minY, w, h);

    // Update model
    model.xywh = newBound.serialize();
    model.vertices = normalized;
  }

  /** Clear snap guides (call on drag end). */
  clearSnapGuides() {
    this.snapGuideX = null;
    this.snapGuideY = null;
  }

  /**
   * Test if a model-coordinate point is within hit distance of an edge midpoint.
   * Returns the edge index (i.e., the midpoint between vertex i and vertex i+1),
   * or -1 if not near any midpoint.
   */
  hitTestMidpoint(
    modelX: number,
    modelY: number
  ): number {
    const model = this._getPolygonModel();
    if (!model || !model.vertices) return -1;

    const bound = Bound.deserialize(model.xywh);
    const zoom = this.gfx.viewport.zoom;
    const hitDist = MIDPOINT_HIT_DISTANCE / zoom;

    for (let i = 0; i < model.vertices.length; i++) {
      const [ax, ay] = this._toAbsolute(model.vertices[i], bound);
      const nextIdx = (i + 1) % model.vertices.length;
      const [bx, by] = this._toAbsolute(model.vertices[nextIdx], bound);
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;

      const dx = modelX - mx;
      const dy = modelY - my;
      if (Math.sqrt(dx * dx + dy * dy) < hitDist) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Test if a model-coordinate point hits a bezier control handle.
   * Returns { vertexIndex, handleIndex: 0=cp1, 1=cp2 } or null.
   */
  hitTestBezierHandle(
    modelX: number,
    modelY: number
  ): { vertexIndex: number; handleIndex: number } | null {
    const model = this._getPolygonModel();
    if (!model || !model.vertices || !model.smoothFlags) return null;

    const zoom = this.gfx.viewport.zoom;
    const hitDist = BEZIER_HANDLE_RADIUS * 2 / zoom;

    for (let i = 0; i < model.vertices.length; i++) {
      if (!model.smoothFlags[i]) continue;
      const cp = this.getBezierControlPoints(i);
      if (!cp) continue;

      // Check cp1
      const dx1 = modelX - cp.cp1[0];
      const dy1 = modelY - cp.cp1[1];
      if (Math.sqrt(dx1 * dx1 + dy1 * dy1) < hitDist) {
        return { vertexIndex: i, handleIndex: 0 };
      }

      // Check cp2
      const dx2 = modelX - cp.cp2[0];
      const dy2 = modelY - cp.cp2[1];
      if (Math.sqrt(dx2 * dx2 + dy2 * dy2) < hitDist) {
        return { vertexIndex: i, handleIndex: 1 };
      }
    }
    return null;
  }

  /**
   * Move a bezier control handle to an absolute model position.
   * Stores the result as normalized coordinates in model.controlPoints.
   */
  moveBezierHandle(
    vertexIndex: number,
    handleIndex: number,
    modelX: number,
    modelY: number
  ): void {
    const model = this._getPolygonModel();
    if (!model || !model.vertices) return;

    const bound = Bound.deserialize(model.xywh);
    const count = model.vertices.length;

    // Initialize controlPoints array if null
    let controlPoints: (number[] | null)[] = model.controlPoints
      ? [...model.controlPoints]
      : new Array(count).fill(null);

    // Ensure array is the right length
    while (controlPoints.length < count) controlPoints.push(null);

    // Auto-compute current control points for this vertex if not set
    if (!controlPoints[vertexIndex]) {
      const cp = this.getBezierControlPoints(vertexIndex);
      if (!cp) return;
      // Store as normalized [cp1x, cp1y, cp2x, cp2y]
      controlPoints[vertexIndex] = [
        (cp.cp1[0] - bound.x) / bound.w,
        (cp.cp1[1] - bound.y) / bound.h,
        (cp.cp2[0] - bound.x) / bound.w,
        (cp.cp2[1] - bound.y) / bound.h,
      ];
    }

    // Convert absolute position to normalized coordinates
    const normX = (modelX - bound.x) / bound.w;
    const normY = (modelY - bound.y) / bound.h;

    // Update the specific handle
    const entry = [...controlPoints[vertexIndex]!];
    if (handleIndex === 0) {
      entry[0] = normX;
      entry[1] = normY;
    } else {
      entry[2] = normX;
      entry[3] = normY;
    }
    controlPoints[vertexIndex] = entry;

    model.controlPoints = controlPoints;
  }

  /**
   * Insert a new vertex at the midpoint of edge `edgeIndex` (between vertex
   * edgeIndex and edgeIndex+1). Returns the index of the newly inserted vertex.
   */
  insertVertexAtMidpoint(edgeIndex: number): number {
    const model = this._getPolygonModel();
    if (!model || !model.vertices) return -1;

    const vertices = [...model.vertices];
    const nextIdx = (edgeIndex + 1) % vertices.length;

    // Compute the midpoint in normalized space
    const midNorm = [
      (vertices[edgeIndex][0] + vertices[nextIdx][0]) / 2,
      (vertices[edgeIndex][1] + vertices[nextIdx][1]) / 2,
    ];

    // Insert after edgeIndex
    const insertIdx = edgeIndex + 1;
    vertices.splice(insertIdx, 0, midNorm);

    // Update smoothFlags if present
    if (model.smoothFlags) {
      const flags = [...model.smoothFlags];
      flags.splice(insertIdx, 0, false);
      model.smoothFlags = flags;
    }

    // Update controlPoints if present
    if (model.controlPoints) {
      const cps = [...model.controlPoints];
      cps.splice(insertIdx, 0, null);
      model.controlPoints = cps;
    }

    model.vertices = vertices;
    return insertIdx;
  }

  /**
   * Delete the vertex at the given index. Returns true if successful.
   * Requires at least 3 vertices to remain after deletion.
   */
  deleteVertex(vertexIndex: number): boolean {
    const model = this._getPolygonModel();
    if (!model || !model.vertices) return false;
    if (model.vertices.length <= 3) return false; // minimum polygon is a triangle

    const vertices = [...model.vertices];
    vertices.splice(vertexIndex, 1);

    // Update smoothFlags if present
    if (model.smoothFlags) {
      const flags = [...model.smoothFlags];
      flags.splice(vertexIndex, 1);
      model.smoothFlags = flags;
    }

    // Update controlPoints if present
    if (model.controlPoints) {
      const cps = [...model.controlPoints];
      cps.splice(vertexIndex, 1);
      model.controlPoints = cps;
    }

    // Re-compute bounding box from remaining vertices
    const bound = Bound.deserialize(model.xywh);
    const absVertices = vertices.map(v => this._toAbsolute(v, bound));

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const [vx, vy] of absVertices) {
      if (vx < minX) minX = vx;
      if (vy < minY) minY = vy;
      if (vx > maxX) maxX = vx;
      if (vy > maxY) maxY = vy;
    }

    const w = Math.max(maxX - minX, 1);
    const h = Math.max(maxY - minY, 1);

    const normalized = absVertices.map(([vx, vy]) => [
      (vx - minX) / w,
      (vy - minY) / h,
    ]);

    const newBound = new Bound(minX, minY, w, h);
    model.xywh = newBound.serialize();
    model.vertices = normalized;
    return true;
  }

  /**
   * Toggle smooth (Bezier) flag for a vertex. When smooth is true, the
   * edges adjacent to this vertex are rendered as Bezier curves with
   * automatically computed control points.
   */
  toggleVertexSmooth(vertexIndex: number): void {
    const model = this._getPolygonModel();
    if (!model || !model.vertices) return;

    const count = model.vertices.length;
    let flags = model.smoothFlags ? [...model.smoothFlags] : new Array(count).fill(false);

    // Ensure flags array matches vertex count
    while (flags.length < count) flags.push(false);
    if (flags.length > count) flags = flags.slice(0, count);

    const wasSmooth = flags[vertexIndex];
    flags[vertexIndex] = !wasSmooth;
    model.smoothFlags = flags;

  }

  /**
   * Check if a vertex has Bezier smoothing enabled.
   */
  isVertexSmooth(vertexIndex: number): boolean {
    const model = this._getPolygonModel();
    if (!model || !model.smoothFlags) return false;
    return !!model.smoothFlags[vertexIndex];
  }

  /**
   * Get the computed Bezier control points for a smooth vertex.
   * Returns [cp1, cp2] where cp1 is the control point for the incoming edge
   * and cp2 is for the outgoing edge, both in absolute model coordinates.
   * Returns null if the vertex is not smooth.
   */
  getBezierControlPoints(
    vertexIndex: number
  ): { cp1: [number, number]; cp2: [number, number] } | null {
    const model = this._getPolygonModel();
    if (!model || !model.vertices) return null;
    if (!model.smoothFlags || !model.smoothFlags[vertexIndex]) return null;

    const bound = Bound.deserialize(model.xywh);

    // Check for custom control points first
    const custom = model.controlPoints?.[vertexIndex];
    if (custom) {
      const cp1: [number, number] = [
        custom[0] * bound.w + bound.x,
        custom[1] * bound.h + bound.y,
      ];
      const cp2: [number, number] = [
        custom[2] * bound.w + bound.x,
        custom[3] * bound.h + bound.y,
      ];
      return { cp1, cp2 };
    }

    // Fall back to auto-computation
    const vertices = model.vertices;
    const count = vertices.length;

    const prev = this._toAbsolute(vertices[(vertexIndex - 1 + count) % count], bound);
    const curr = this._toAbsolute(vertices[vertexIndex], bound);
    const next = this._toAbsolute(vertices[(vertexIndex + 1) % count], bound);

    const dx1 = prev[0] - curr[0];
    const dy1 = prev[1] - curr[1];
    const dx2 = next[0] - curr[0];
    const dy2 = next[1] - curr[1];

    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;

    const cpDist1 = len1 / 3;
    const cpDist2 = len2 / 3;

    const cp1: [number, number] = [
      curr[0] + (dx1 / len1) * cpDist1,
      curr[1] + (dy1 / len1) * cpDist1,
    ];
    const cp2: [number, number] = [
      curr[0] + (dx2 / len2) * cpDist2,
      curr[1] + (dy2 / len2) * cpDist2,
    ];

    return { cp1, cp2 };
  }

  // ── Rendering ───────────────────────────────────────────────────────

  override render(ctx: CanvasRenderingContext2D, _rc: RoughCanvas): void {
    const model = this._getPolygonModel();
    if (!model || !model.vertices) return;
    if (!this.isEditing && this.hoveredVertexIndex < 0) return;

    const bound = Bound.deserialize(model.xywh);
    const zoom = this.gfx.viewport.zoom;
    const vertices = model.vertices;

    ctx.save();
    ctx.globalAlpha = this.globalAlpha;

    // ── Draw snap guides ────────────────────────────────────────────
    if (this.activeVertexIndex >= 0) {
      ctx.setLineDash([4 / zoom, 3 / zoom]);
      ctx.lineWidth = 1 / zoom;
      ctx.strokeStyle = SNAP_GUIDE_COLOR;

      if (this.snapGuideX !== null) {
        ctx.beginPath();
        ctx.moveTo(this.snapGuideX, bound.y - 20 / zoom);
        ctx.lineTo(this.snapGuideX, bound.y + bound.h + 20 / zoom);
        ctx.stroke();
      }
      if (this.snapGuideY !== null) {
        ctx.beginPath();
        ctx.moveTo(bound.x - 20 / zoom, this.snapGuideY);
        ctx.lineTo(bound.x + bound.w + 20 / zoom, this.snapGuideY);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // ── Draw Bezier control handles ────────────────────────────────
    if (this.isEditing && model.smoothFlags) {
      for (let i = 0; i < vertices.length; i++) {
        if (!model.smoothFlags[i]) continue;
        const cp = this.getBezierControlPoints(i);
        if (!cp) continue;

        const [ax, ay] = this._toAbsolute(vertices[i], bound);
        const cpR = BEZIER_HANDLE_RADIUS / zoom;

        // Draw control lines
        ctx.beginPath();
        ctx.moveTo(cp.cp1[0], cp.cp1[1]);
        ctx.lineTo(ax, ay);
        ctx.lineTo(cp.cp2[0], cp.cp2[1]);
        ctx.strokeStyle = BEZIER_LINE_COLOR;
        ctx.lineWidth = 1 / zoom;
        ctx.setLineDash([3 / zoom, 2 / zoom]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw control point handles
        for (const cp_pt of [cp.cp1, cp.cp2]) {
          ctx.beginPath();
          ctx.arc(cp_pt[0], cp_pt[1], cpR, 0, Math.PI * 2);
          ctx.fillStyle = BEZIER_HANDLE_COLOR;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1 / zoom;
          ctx.stroke();
        }
      }
    }

    // ── Draw edge midpoint handles ──────────────────────────────────
    if (this.isEditing) {
      for (let i = 0; i < vertices.length; i++) {
        const [ax, ay] = this._toAbsolute(vertices[i], bound);
        const nextIdx = (i + 1) % vertices.length;
        const [bx, by] = this._toAbsolute(vertices[nextIdx], bound);
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2;

        const isHoveredMid = i === this.hoveredMidpointIndex;
        const midR = (isHoveredMid ? MIDPOINT_HANDLE_HOVER_RADIUS : MIDPOINT_HANDLE_RADIUS) / zoom;
        const midFill = isHoveredMid ? MIDPOINT_HOVER_FILL_COLOR : MIDPOINT_FILL_COLOR;

        ctx.beginPath();
        ctx.arc(mx, my, midR, 0, Math.PI * 2);
        ctx.fillStyle = midFill;
        ctx.fill();
        ctx.strokeStyle = isHoveredMid ? '#228be6' : '#868e96';
        ctx.lineWidth = (isHoveredMid ? 1.5 : 1) / zoom;
        ctx.stroke();
      }
    }

    // ── Draw vertex handles ─────────────────────────────────────────
    for (let i = 0; i < vertices.length; i++) {
      const [ax, ay] = this._toAbsolute(vertices[i], bound);
      const isHovered = i === this.hoveredVertexIndex;
      const isActive = i === this.activeVertexIndex;

      let radius: number;
      let fillColor: string;
      let strokeWidth: number;

      if (isActive) {
        radius = VERTEX_HANDLE_ACTIVE_RADIUS / zoom;
        fillColor = HANDLE_ACTIVE_FILL_COLOR;
        strokeWidth = 2 / zoom;
      } else if (isHovered) {
        radius = VERTEX_HANDLE_HOVER_RADIUS / zoom;
        fillColor = HANDLE_HOVER_FILL_COLOR;
        strokeWidth = 2 / zoom;
      } else {
        radius = VERTEX_HANDLE_RADIUS / zoom;
        fillColor = HANDLE_FILL_COLOR;
        strokeWidth = 1.5 / zoom;
      }

      // Outer stroke
      ctx.beginPath();
      ctx.arc(ax, ay, radius, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = '#228be6';
      ctx.lineWidth = strokeWidth;
      ctx.stroke();

      // Smooth vertex indicator (diamond shape on top of circle)
      if (this.isEditing && model.smoothFlags && model.smoothFlags[i]) {
        const dSize = 3.5 / zoom;
        ctx.beginPath();
        ctx.moveTo(ax, ay - dSize);
        ctx.lineTo(ax + dSize, ay);
        ctx.lineTo(ax, ay + dSize);
        ctx.lineTo(ax - dSize, ay);
        ctx.closePath();
        ctx.fillStyle = BEZIER_HANDLE_COLOR;
        ctx.fill();
      }

      // Index label for editing mode (only when editing and zoomed in enough)
      if (this.isEditing && zoom >= 1.5) {
        ctx.font = `${10 / zoom}px sans-serif`;
        ctx.fillStyle = '#228be6';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${i}`, ax, ay - radius - 2 / zoom);
      }
    }

    ctx.restore();
  }
}
