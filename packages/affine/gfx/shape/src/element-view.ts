import {
  type SurfaceBlockComponent,
  type SurfaceBlockModel,
} from '@blocksuite/affine-block-surface';
import { ConnectorPathGenerator } from '@blocksuite/affine-gfx-connector';
import {
  type ConnectorElementModel,
  ShapeElementModel,
  ShapeType,
} from '@blocksuite/affine-model';
import { Bound, rotatePoint } from '@blocksuite/global/gfx';
import type { GfxModel } from '@blocksuite/std/gfx';
import {
  GfxElementModelView,
  GfxViewInteractionExtension,
} from '@blocksuite/std/gfx';
import type { PointerEventState } from '@blocksuite/std';

import { normalizeShapeBound } from './element-renderer';
import { PolygonVertexEditingOverlay } from './overlay/polygon-vertex-editing-overlay';
import { mountShapeTextEditor } from './text/edgeless-shape-text-editor';

export class ShapeElementView extends GfxElementModelView<ShapeElementModel> {
  static override type: string = 'shape';

  /** Overlay for polygon vertex editing (only active for polygon shapes). */
  private _vertexEditingOverlay: PolygonVertexEditingOverlay | null = null;

  private get _surfaceComponent() {
    return this.gfx.surfaceComponent as SurfaceBlockComponent | null;
  }

  override onCreated(): void {
    super.onCreated();

    this._initDblClickToEdit();
    this._initPolygonVertexEditing();
  }

  override onDestroyed(): void {
    this._escapeKeyDisposer?.();
    this._escapeKeyDisposer = null;
    for (const disposer of this._dragHandlerDisposers) {
      disposer();
    }
    this._dragHandlerDisposers = [];
    this._removeVertexEditingOverlay();
    super.onDestroyed();
  }

  /**
   * Synchronously recalculate and apply the path for every connector
   * attached to this polygon shape.
   *
   * Called during polygon vertex drag so that connector routing stays
   * visually correct on every drag frame.
   */
  private _syncConnectorPaths(): void {
    const surface = this.model.surface as unknown as SurfaceBlockModel;
    const connectors = surface.getConnectors(
      this.model.id
    ) as ConnectorElementModel[];

    if (connectors.length === 0) return;

    const elementGetter = (id: string): GfxModel | null =>
      (surface.getElementById(id) ??
        surface.store.getModelById(id)) as GfxModel | null;

    for (const connector of connectors) {
      ConnectorPathGenerator.updatePath(connector, null, elementGetter);
    }
  }

  private _initDblClickToEdit(): void {
    this.on('dblclick', () => {
      const edgeless = this.std.view.getBlock(this.std.store.root!.id);

      if (
        edgeless &&
        !this.model.isLocked() &&
        this.model instanceof ShapeElementModel
      ) {
        if (this._vertexEditingOverlay?.isEditing) {
          this._exitVertexEditingMode();
        }
        mountShapeTextEditor(this.model, edgeless);
      }
    });
  }

  /**
   * Whether a vertex is currently being dragged.
   * Set true in onDragStart when _pendingVertexIndex ≥ 0; reset in onDragEnd.
   */
  private _isDraggingVertex = false;

  /** Bezier handle being dragged (null = none). */
  private _pendingBezierHandle: { vertexIndex: number; handleIndex: number } | null = null;
  private _isDraggingBezierHandle = false;
  private _bezierDragStartModelCoord: [number, number] | null = null;

  /**
   * The vertex index pressed on the last pointerdown (-1 = none).
   * Examined in onDragStart to determine whether to enter vertex-drag mode.
   * Reset on each pointerdown and when drag ends.
   */
  private _pendingVertexIndex = -1;

  /**
   * Pointer model-space position at drag start.
   * Used to compute model-space deltas from PointerEventState screen coords.
   */
  private _pointerStartModelCoord: [number, number] | null = null;

  /**
   * Absolute model-space position of the dragged vertex at drag start.
   * Combined with pointer delta to compute absolute target for moveVertex().
   */
  private _vertexDragStartModelCoord: [number, number] | null = null;

  /** Disposer for the Escape/Delete/B key listener used in vertex editing mode. */
  private _escapeKeyDisposer: (() => void) | null = null;

  /** Disposers for drag event handlers registered during vertex editing mode. */
  private _dragHandlerDisposers: (() => void)[] = [];

  /**
   * Enter polygon vertex editing mode: set overlay to editing, update
   * selection state to editing, and listen for Escape/Delete keys.
   */
  private _enterVertexEditingMode(): void {
    if (!this._vertexEditingOverlay) return;

    this._vertexEditingOverlay.isEditing = true;

    // Set selection editing state so framework knows we are editing
    this.gfx.selection.set({
      elements: [this.model.id],
      editing: true,
    });

    this._surfaceComponent?.refresh();

    // Listen for keyboard events during editing mode
    const keydownHandler = (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') {
        evt.preventDefault();
        // Use stopImmediatePropagation to prevent ALL other document-level
        // listeners (including the global edgeless Escape handler that would
        // clear the entire selection) from receiving this event.  We only
        // want to exit vertex-editing mode while keeping the element selected.
        evt.stopImmediatePropagation();
        this._exitVertexEditingMode();
        return;
      }

      // Delete or Backspace deletes the hovered vertex
      if (
        (evt.key === 'Delete' || evt.key === 'Backspace') &&
        this._vertexEditingOverlay
      ) {
        const idx = this._vertexEditingOverlay.hoveredVertexIndex;
        if (idx >= 0) {
          evt.preventDefault();
          evt.stopPropagation();
          this.gfx.doc.captureSync();
          this.model.stash('xywh');
          this.model.stash('vertices');
          if (this.model.smoothFlags) {
            this.model.stash('smoothFlags');
          }
          this.model.stash('controlPoints');
          const deleted = this._vertexEditingOverlay.deleteVertex(idx);
          this.model.pop('controlPoints');
          this.model.pop('xywh');
          this.model.pop('vertices');
          if (this.model.smoothFlags) {
            this.model.pop('smoothFlags');
          }
          if (deleted) {
            this._vertexEditingOverlay.hoveredVertexIndex = -1;
            this._surfaceComponent?.refresh();
          }
        }
        return;
      }

      // 'B' key toggles Bezier smoothing on the hovered vertex
      if (
        (evt.key === 'b' || evt.key === 'B') &&
        this._vertexEditingOverlay
      ) {
        const idx = this._vertexEditingOverlay.hoveredVertexIndex;
        if (idx >= 0) {
          evt.preventDefault();
          evt.stopPropagation();
          this.gfx.doc.captureSync();
          // Always stash smoothFlags before toggling, even when it is currently
          // null. toggleVertexSmooth() may transition smoothFlags from null to
          // a boolean array; stash/pop must bracket the mutation symmetrically
          // so that elementUpdated is emitted with props['smoothFlags'] in all
          // cases (null → array, array → modified array).
          this.model.stash('xywh');
          this.model.stash('vertices');
          this.model.stash('smoothFlags');
          this.model.stash('controlPoints');
          this._vertexEditingOverlay.toggleVertexSmooth(idx);
          this.model.pop('controlPoints');
          this.model.pop('smoothFlags');
          this.model.pop('vertices');
          this.model.pop('xywh');
          this._surfaceComponent?.refresh();
        }
        return;
      }
    };
    document.addEventListener('keydown', keydownHandler, { capture: true });
    this._escapeKeyDisposer = () => {
      document.removeEventListener('keydown', keydownHandler, {
        capture: true,
      });
    };

    // ── Drag handlers for vertex/bezier editing ───────────────────────────
    // Registered handlers receive PointerEventState and are dispatched by
    // GfxViewEventManager BEFORE DefaultTool checks selection.editing.
    // This means they work even when editing=true (which causes DefaultTool
    // to skip handleElementMove and the lifecycle onDragStart/Move/End).
    //
    // When editing mode exits, these are unregistered so dispatch('dragstart')
    // returns false → DefaultTool proceeds normally → element move works.

    const dragstartDisposer = this.on('dragstart', (e: PointerEventState) => {
      // Vertex drag
      if (this._pendingVertexIndex >= 0) {
        const verts = this.model.vertices;
        if (verts && this._pendingVertexIndex < verts.length) {
          this._isDraggingVertex = true;
          this._vertexEditingOverlay!.activeVertexIndex = this._pendingVertexIndex;

          this.model.stash('xywh');
          this.model.stash('vertices');
          this.model.stash('controlPoints');

          // Record pointer start in model space for delta computation
          const [startMX, startMY] = this.gfx.viewport.toModelCoord(e.x, e.y);
          this._pointerStartModelCoord = [startMX, startMY];

          // Record vertex absolute model position
          const bound = Bound.deserialize(this.model.xywh);
          const v = verts[this._pendingVertexIndex];
          const localCoord: [number, number] = [
            bound.x + v[0] * bound.w,
            bound.y + v[1] * bound.h,
          ];
          this._vertexDragStartModelCoord = rotatePoint(
            localCoord,
            bound.center as [number, number],
            this.model.rotate ?? 0
          ) as [number, number];

          this._surfaceComponent?.refresh();
          return;
        }
      }

      // Bezier handle drag
      if (this._pendingBezierHandle) {
        this._isDraggingBezierHandle = true;
        this._vertexEditingOverlay!.activeBezierHandleIndex = this._pendingBezierHandle.vertexIndex;
        this._vertexEditingOverlay!.activeBezierHandleType = this._pendingBezierHandle.handleIndex;

        this.model.stash('xywh');
        this.model.stash('vertices');
        this.model.stash('controlPoints');

        const [startMX, startMY] = this.gfx.viewport.toModelCoord(e.x, e.y);
        this._pointerStartModelCoord = [startMX, startMY];

        const cp = this._vertexEditingOverlay!.getBezierControlPoints(this._pendingBezierHandle.vertexIndex);
        if (cp) {
          const pt = this._pendingBezierHandle.handleIndex === 0 ? cp.cp1 : cp.cp2;
          const bound = Bound.deserialize(this.model.xywh);
          this._bezierDragStartModelCoord = rotatePoint(
            pt,
            bound.center as [number, number],
            this.model.rotate ?? 0
          ) as [number, number];
        }

        this._surfaceComponent?.refresh();
      }
    });

    const dragmoveDisposer = this.on('dragmove', (e: PointerEventState) => {
      if (!this._pointerStartModelCoord) return;

      const [curMX, curMY] = this.gfx.viewport.toModelCoord(e.x, e.y);
      const dx = curMX - this._pointerStartModelCoord[0];
      const dy = curMY - this._pointerStartModelCoord[1];

      // Bezier handle drag
      if (this._isDraggingBezierHandle && this._pendingBezierHandle && this._bezierDragStartModelCoord) {
        this._vertexEditingOverlay!.moveBezierHandle(
          this._pendingBezierHandle.vertexIndex,
          this._pendingBezierHandle.handleIndex,
          this._bezierDragStartModelCoord[0] + dx,
          this._bezierDragStartModelCoord[1] + dy
        );
        this._syncConnectorPaths();
        this._surfaceComponent?.refresh();
        return;
      }

      // Vertex drag
      if (this._isDraggingVertex && this._vertexDragStartModelCoord) {
        this._vertexEditingOverlay!.moveVertex(
          this._vertexEditingOverlay!.activeVertexIndex,
          this._vertexDragStartModelCoord[0] + dx,
          this._vertexDragStartModelCoord[1] + dy
        );
        this._syncConnectorPaths();
        this._surfaceComponent?.refresh();
      }
    });

    const dragendDisposer = this.on('dragend', (_e: PointerEventState) => {
      // Bezier handle drag end
      if (this._isDraggingBezierHandle) {
        this._isDraggingBezierHandle = false;
        this._bezierDragStartModelCoord = null;
        this._pointerStartModelCoord = null;
        this._pendingBezierHandle = null;
        if (this._vertexEditingOverlay) {
          this._vertexEditingOverlay.activeBezierHandleIndex = -1;
          this._vertexEditingOverlay.activeBezierHandleType = -1;
        }
        this.model.pop('controlPoints');
        this.model.pop('vertices');
        this.model.pop('xywh');
        this._surfaceComponent?.refresh();
        return;
      }

      // Vertex drag end
      if (this._isDraggingVertex) {
        this._isDraggingVertex = false;
        this._vertexDragStartModelCoord = null;
        this._pointerStartModelCoord = null;
        this._pendingVertexIndex = -1;

        if (this._vertexEditingOverlay) {
          this._vertexEditingOverlay.activeVertexIndex = -1;
          this._vertexEditingOverlay.clearSnapGuides();
        }

        this.model.pop('xywh');
        this.model.pop('vertices');
        this.model.pop('controlPoints');
        this._surfaceComponent?.refresh();
      }
    });

    this._dragHandlerDisposers = [dragstartDisposer, dragmoveDisposer, dragendDisposer];
  }

  /**
   * Exit polygon vertex editing mode: clear overlay editing state,
   * reset selection to non-editing, and clean up key listener.
   */
  private _exitVertexEditingMode(): void {
    if (!this._vertexEditingOverlay) return;

    this._vertexEditingOverlay.isEditing = false;
    this._vertexEditingOverlay.hoveredVertexIndex = -1;
    this._vertexEditingOverlay.activeVertexIndex = -1;
    this._vertexEditingOverlay.clearSnapGuides();

    // Keep element selected but exit editing
    this.gfx.selection.set({
      elements: [this.model.id],
      editing: false,
    });

    this._surfaceComponent?.refresh();

    this._escapeKeyDisposer?.();
    this._escapeKeyDisposer = null;

    // Unregister drag handlers so dispatch('dragstart') returns false
    // and DefaultTool proceeds with normal element move.
    for (const disposer of this._dragHandlerDisposers) {
      disposer();
    }
    this._dragHandlerDisposers = [];

    // Reset any pending or active vertex drag state.
    this._pendingVertexIndex = -1;
    this._isDraggingVertex = false;
    this._vertexDragStartModelCoord = null;
    this._pointerStartModelCoord = null;

    // Reset bezier handle drag state.
    this._pendingBezierHandle = null;
    this._isDraggingBezierHandle = false;
    this._bezierDragStartModelCoord = null;
  }

  /**
   * Set up selection-based lifecycle for the polygon vertex editing overlay.
   * The overlay is shown when a polygon is selected and removed when
   * deselected or when a non-polygon shape is selected.
   */
  private _initPolygonVertexEditing(): void {
    if (this.model.shapeType !== ShapeType.Polygon) return;

    // Subscribe to selection changes to manage overlay lifecycle
    this.disposable.add(
      this.gfx.selection.slots.updated.subscribe(() => {
        const selectedIds = this.gfx.selection.selectedIds;
        const isSelected =
          selectedIds.length === 1 && selectedIds[0] === this.model.id;

        if (isSelected) {
          this._ensureVertexEditingOverlay();
        } else {
          // Clean up escape key listener when deselected
          this._escapeKeyDisposer?.();
          this._escapeKeyDisposer = null;
          this._removeVertexEditingOverlay();
        }
      })
    );

    // ── Vertex press tracking ─────────────────────────────────────────────
    // Record which vertex (if any) the pointer pressed on.  The registered
    // dragstart handler (added in _enterVertexEditingMode) reads
    // _pendingVertexIndex to decide whether to enter vertex-drag mode.
    this.on('pointerdown', (e) => {
      if (!this._vertexEditingOverlay?.isEditing) {
        // Outside editing mode no vertex drag is possible.
        this._pendingVertexIndex = -1;
        return;
      }

      const [mx, my] = this.gfx.viewport.toModelCoord(e.x, e.y);
      this._pendingVertexIndex =
        this._vertexEditingOverlay.hitTestVertex(mx, my);

      // If no vertex hit, check bezier handle hit
      if (this._pendingVertexIndex < 0) {
        this._pendingBezierHandle =
          this._vertexEditingOverlay.hitTestBezierHandle(mx, my);
      } else {
        this._pendingBezierHandle = null;
      }
    });

    // Listen for pointer move to update hover state on the overlay
    this.on('pointermove', (e) => {
      if (!this._vertexEditingOverlay) return;

      const [mx, my] = this.gfx.viewport.toModelCoord(e.x, e.y);
      this._vertexEditingOverlay.cursorModelPos = [mx, my];

      const hitIdx = this._vertexEditingOverlay.hitTestVertex(mx, my);
      let needRefresh = false;

      if (hitIdx !== this._vertexEditingOverlay.hoveredVertexIndex) {
        this._vertexEditingOverlay.hoveredVertexIndex = hitIdx;
        needRefresh = true;
      }

      // Also check midpoint hover (only when editing and not hovering a vertex)
      if (this._vertexEditingOverlay.isEditing && hitIdx < 0) {
        const midIdx = this._vertexEditingOverlay.hitTestMidpoint(mx, my);
        if (midIdx !== this._vertexEditingOverlay.hoveredMidpointIndex) {
          this._vertexEditingOverlay.hoveredMidpointIndex = midIdx;
          needRefresh = true;
        }
      } else if (this._vertexEditingOverlay.hoveredMidpointIndex >= 0) {
        this._vertexEditingOverlay.hoveredMidpointIndex = -1;
        needRefresh = true;
      }

      if (needRefresh) {
        this._surfaceComponent?.refresh();
      }
    });

    // Click on edge midpoint to insert a new vertex (in editing mode)
    this.on('click', (e) => {
      if (!this._vertexEditingOverlay) return;
      if (!this._vertexEditingOverlay.isEditing) return;

      const [mx, my] = this.gfx.viewport.toModelCoord(e.x, e.y);

      // Only handle midpoint clicks when not clicking on a vertex
      const hitVertex = this._vertexEditingOverlay.hitTestVertex(mx, my);
      if (hitVertex >= 0) return;

      const midIdx = this._vertexEditingOverlay.hitTestMidpoint(mx, my);
      if (midIdx >= 0) {
        this.gfx.doc.captureSync();
        // Stash xywh alongside vertices so that elementUpdated includes
        // props['xywh'] even though the bounding box doesn't change.
        // This allows the connector-watcher (which checks props['xywh']) to
        // react to vertex-count changes and re-anchor connected connectors.
        this.model.stash('xywh');
        this.model.stash('vertices');
        this.model.stash('smoothFlags');
        this.model.stash('controlPoints');
        const newIdx = this._vertexEditingOverlay.insertVertexAtMidpoint(midIdx);
        this.model.pop('controlPoints');
        this.model.pop('xywh');
        this.model.pop('vertices');
        this.model.pop('smoothFlags');
        if (newIdx >= 0) {
          this._vertexEditingOverlay.hoveredVertexIndex = newIdx;
          this._vertexEditingOverlay.hoveredMidpointIndex = -1;
          this._surfaceComponent?.refresh();
        }
      }
    });

    this.on('pointerleave', () => {
      if (!this._vertexEditingOverlay) return;
      if (this._vertexEditingOverlay.activeVertexIndex >= 0) return;

      this._vertexEditingOverlay.hoveredVertexIndex = -1;
      this._vertexEditingOverlay.cursorModelPos = null;
      this._surfaceComponent?.refresh();
    });
  }

  private _ensureVertexEditingOverlay(): void {
    if (this._vertexEditingOverlay) return;

    const overlay = new PolygonVertexEditingOverlay(this.gfx);
    overlay.setElement(this.model.id);

    this._vertexEditingOverlay = overlay;
    this._surfaceComponent?.renderer.addOverlay(overlay);
  }

  private _removeVertexEditingOverlay(): void {
    if (!this._vertexEditingOverlay) return;

    this._vertexEditingOverlay.isEditing = false;
    this._vertexEditingOverlay.dispose();
    this._surfaceComponent?.renderer.removeOverlay(this._vertexEditingOverlay);
    this._vertexEditingOverlay = null;

    // Clean up drag handlers and reset drag state in case the overlay is
    // removed during an active drag (e.g. element deselected externally).
    for (const disposer of this._dragHandlerDisposers) {
      disposer();
    }
    this._dragHandlerDisposers = [];
    this._pendingVertexIndex = -1;
    this._isDraggingVertex = false;
    this._vertexDragStartModelCoord = null;
    this._pointerStartModelCoord = null;

    this._surfaceComponent?.renderer.refresh();
  }

  /** Get the vertex editing overlay (used by interaction handlers). */
  get vertexEditingOverlay(): PolygonVertexEditingOverlay | null {
    return this._vertexEditingOverlay;
  }

  /**
   * Public entry point for entering polygon vertex editing mode.
   * Called by the "Edit vertices" toolbar button.
   */
  enterVertexEditingMode(): void {
    if (this.model.shapeType !== ShapeType.Polygon) return;
    this._ensureVertexEditingOverlay();
    this._enterVertexEditingMode();
  }
}

export const ShapeViewInteraction =
  GfxViewInteractionExtension<ShapeElementView>(ShapeElementView.type, {
    handleSelection: ({ gfx, view }) => {
      return {
        onSelect(context) {
          // When polygon vertex editing is active, preserve the editing flag
          // so that the bounding-box / resize handles stay hidden.
          if (view.vertexEditingOverlay?.isEditing) {
            gfx.selection.set({
              elements: [context.model.id],
              editing: true,
            });
            return;
          }
          context.default(context);
        },
      };
    },
    handleResize: () => {
      return {
        onResizeMove({ newBound, model }) {
          const normalizedBound = normalizeShapeBound(model, newBound);

          model.xywh = normalizedBound.serialize();
        },
      };
    },
  });
