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
import { Bound } from '@blocksuite/global/gfx';
import type { GfxModel } from '@blocksuite/std/gfx';
import {
  GfxElementModelView,
  GfxViewInteractionExtension,
} from '@blocksuite/std/gfx';
import type {
  DragEndContext,
  DragMoveContext,
  DragStartContext,
} from '@blocksuite/std/gfx';

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
    this._removeVertexEditingOverlay();
    super.onDestroyed();
  }

  /**
   * Override framework drag handlers to wire both polygon-body drag-to-move
   * and vertex drag through the same pipeline.
   *
   * Design rationale
   * ────────────────
   * `GfxViewEventManager.dispatch('dragstart')` returns `true` whenever the
   * view has *any* 'dragstart' listener registered – regardless of whether
   * the listener actually does anything.  When it returns `true`, DefaultTool
   * sees `handledByView = true` and skips the default drag-to-move path.
   *
   * The old approach registered a 'dragstart' handler in _enterVertexEditingMode
   * and removed it in _exitVertexEditingMode.  That worked for the non-editing
   * case but had a bug in editing mode: clicking on the polygon BODY (not a
   * vertex) still had handledByView=true so the polygon could not be moved
   * while vertex editing was active.
   *
   * The new approach:
   *   1. A 'pointerdown' handler (always registered for polygons) records
   *      which vertex was pressed → `_pendingVertexIndex`.
   *   2. NO 'dragstart' listener is ever registered on this view.
   *      ⇒ dispatch('dragstart') always returns false
   *      ⇒ handledByView is always false
   *      ⇒ DefaultTool always proceeds to call handleElementMove()
   *      ⇒ InteractivityManager eventually calls view.onDragStart/Move/End
   *   3. Here in onDragStart we inspect _pendingVertexIndex and branch:
   *        • ≥ 0 AND overlay.isEditing  → vertex drag  (suppress super)
   *        • otherwise                  → element move (call super)
   *
   * This guarantees that:
   *   • Clicking anywhere inside the polygon body (PIP-hit via includesPoint)
   *     always initiates a normal element move – both in normal mode and in
   *     vertex-editing mode.
   *   • Clicking a vertex handle in editing mode initiates a vertex drag.
   */
  override onDragStart(ctx: DragStartContext): void {
    // If in vertex editing mode and a vertex was pressed, start vertex drag.
    if (
      this._vertexEditingOverlay?.isEditing &&
      this._pendingVertexIndex >= 0
    ) {
      const verts = this.model.vertices;
      if (verts && this._pendingVertexIndex < verts.length) {
        this._isDraggingVertex = true;
        this._vertexEditingOverlay.activeVertexIndex = this._pendingVertexIndex;

        // Stash so intermediate vertex moves do not flood the CRDT.
        this.model.stash('xywh');
        this.model.stash('vertices');

        // Record the vertex's absolute model position so that onDragMove can
        // convert the framework's cumulative dx/dy back to an absolute
        // target coordinate for moveVertex().
        const bound = Bound.deserialize(this.model.xywh);
        const v = verts[this._pendingVertexIndex];
        this._vertexDragStartModelCoord = [
          bound.x + v[0] * bound.w,
          bound.y + v[1] * bound.h,
        ];

        this._surfaceComponent?.refresh();
        return; // suppress default element-move stash
      }
    }

    // Default: let the framework move the whole element.
    // This runs for:
    //   • Non-editing mode – click anywhere in polygon body (PIP tested)
    //   • Editing mode     – click on body but not on a vertex handle
    super.onDragStart(ctx);
  }

  override onDragMove(ctx: DragMoveContext): void {
    if (this._isDraggingVertex) {
      if (this._vertexEditingOverlay && this._vertexDragStartModelCoord) {
        // Convert the cumulative delta provided by the framework into the
        // absolute model-space target position for the vertex.
        const targetX = this._vertexDragStartModelCoord[0] + ctx.dx;
        const targetY = this._vertexDragStartModelCoord[1] + ctx.dy;
        this._vertexEditingOverlay.moveVertex(
          this._vertexEditingOverlay.activeVertexIndex,
          targetX,
          targetY
        );

        // Sub-AC 5b: Recalculate connector paths in real-time as polygon
        // vertices are dragged.
        //
        // Two complementary mechanisms keep connectors in sync:
        //
        // 1. Implicit path (already in place):
        //    moveVertex() updates stashed `xywh` and `vertices` → the stash
        //    setter fires `surface.elementUpdated` synchronously → the
        //    connector-watcher reacts and schedules `queueMicrotask` →
        //    microtask runs before the next RAF → canvas renders with
        //    up-to-date connector paths.
        //
        // 2. Explicit path (added here for determinism):
        //    Directly call ConnectorPathGenerator.updatePath() for each
        //    connector attached to this polygon.  This is synchronous, so
        //    connector paths are guaranteed to be current before refresh()
        //    even if the microtask scheduling is delayed for any reason.
        //    The connector-watcher's subsequent microtask is a harmless
        //    no-op because it will compute the same path.
        this._syncConnectorPaths();

        this._surfaceComponent?.refresh();
      }
      return;
    }

    super.onDragMove(ctx);
  }

  /**
   * Synchronously recalculate and apply the path for every connector
   * attached to this polygon shape.
   *
   * Called from `onDragMove` during polygon vertex drag so that connector
   * routing stays visually correct on every drag frame (Sub-AC 5b).
   *
   * Uses `ConnectorPathGenerator.updatePath()` — the same function used by
   * the connector-watcher middleware — so routing logic is consistent.
   *
   * The cast to `SurfaceBlockModel` (affine) is required because
   * `GfxPrimitiveElementModel.surface` is typed as the framework base class
   * which does not declare `getConnectors()`.  At runtime this is always the
   * affine SurfaceBlockModel that does have the method.
   */
  private _syncConnectorPaths(): void {
    // Cast to the affine SurfaceBlockModel which provides getConnectors().
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

  override onDragEnd(ctx: DragEndContext): void {
    if (this._isDraggingVertex) {
      this._isDraggingVertex = false;
      this._vertexDragStartModelCoord = null;
      this._pendingVertexIndex = -1;

      if (this._vertexEditingOverlay) {
        this._vertexEditingOverlay.activeVertexIndex = -1;
        this._vertexEditingOverlay.clearSnapGuides();
      }

      // Commit the final vertex / bounding-box state to the CRDT.
      this.model.pop('xywh');
      this.model.pop('vertices');
      this._surfaceComponent?.refresh();
      return;
    }

    super.onDragEnd(ctx);
  }

  private _initDblClickToEdit(): void {
    this.on('dblclick', () => {
      const edgeless = this.std.view.getBlock(this.std.store.root!.id);

      if (
        edgeless &&
        !this.model.isLocked() &&
        this.model instanceof ShapeElementModel
      ) {
        // All shapes (including polygon) open the text editor on double-click.
        // Vertex editing for polygons is accessed via the toolbar "Edit vertices"
        // button instead.
        //
        // Text-editing mode and vertex-editing mode are mutually exclusive:
        // if vertex editing is active, exit it before opening the text editor.
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

  /**
   * The vertex index pressed on the last pointerdown (-1 = none).
   * Examined in onDragStart to determine whether to enter vertex-drag mode.
   * Reset on each pointerdown and when drag ends.
   */
  private _pendingVertexIndex = -1;

  /**
   * Absolute model-space position of the dragged vertex at drag start.
   * Lets onDragMove convert the framework's cumulative (dx, dy) deltas into
   * absolute target coordinates for moveVertex().
   */
  private _vertexDragStartModelCoord: [number, number] | null = null;

  /** Disposer for the Escape/Delete/B key listener used in vertex editing mode. */
  private _escapeKeyDisposer: (() => void) | null = null;

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
          const deleted = this._vertexEditingOverlay.deleteVertex(idx);
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
          this.model.stash('smoothFlags');
          this._vertexEditingOverlay.toggleVertexSmooth(idx);
          this.model.pop('smoothFlags');
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

    // Vertex drag is now handled entirely through onDragStart/Move/End via
    // the _pendingVertexIndex set in the 'pointerdown' handler registered by
    // _initPolygonVertexEditing().  No 'dragstart'/'dragmove'/'dragend'
    // handlers are registered here so that dispatch('dragstart') always
    // returns false, keeping handledByView=false and letting DefaultTool
    // invoke handleElementMove → view.onDragStart/Move/End for all drags.
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

    // Reset any pending or active vertex drag state.
    this._pendingVertexIndex = -1;
    this._isDraggingVertex = false;
    this._vertexDragStartModelCoord = null;
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
    // Record which vertex (if any) the pointer pressed on.  onDragStart reads
    // _pendingVertexIndex to decide whether to enter vertex-drag mode.
    //
    // We do NOT use a 'dragstart' handler for this because registering one
    // would cause GfxViewEventManager.dispatch('dragstart') to return true,
    // making DefaultTool see handledByView=true and skip handleElementMove
    // entirely – which would break body drag-to-move.  Using 'pointerdown'
    // avoids that: pointerdown dispatch does not affect the handledByView
    // flag checked by DefaultTool.dragStart().
    this.on('pointerdown', (e) => {
      if (!this._vertexEditingOverlay?.isEditing) {
        // Outside editing mode no vertex drag is possible.
        this._pendingVertexIndex = -1;
        return;
      }

      const [mx, my] = this.gfx.viewport.toModelCoord(e.x, e.y);
      this._pendingVertexIndex =
        this._vertexEditingOverlay.hitTestVertex(mx, my);
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
        const newIdx = this._vertexEditingOverlay.insertVertexAtMidpoint(midIdx);
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

    // Reset vertex drag state in case the overlay is removed during an
    // active drag (e.g. element deselected externally while dragging).
    this._pendingVertexIndex = -1;
    this._isDraggingVertex = false;
    this._vertexDragStartModelCoord = null;

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
    handleResize: () => {
      return {
        onResizeMove({ newBound, model }) {
          const normalizedBound = normalizeShapeBound(model, newBound);

          model.xywh = normalizedBound.serialize();
        },
      };
    },
  });
