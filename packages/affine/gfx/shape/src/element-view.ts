import {
  type SurfaceBlockComponent,
} from '@blocksuite/affine-block-surface';
import { ShapeElementModel, ShapeType } from '@blocksuite/affine-model';
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
   * Override framework drag handlers to suppress default element movement
   * when the user is dragging a polygon vertex in editing mode.
   */
  override onDragStart(ctx: DragStartContext): void {
    if (this._isDraggingVertex) return; // suppress default stash/move
    super.onDragStart(ctx);
  }

  override onDragMove(ctx: DragMoveContext): void {
    if (this._isDraggingVertex) return; // suppress default element move
    super.onDragMove(ctx);
  }

  override onDragEnd(ctx: DragEndContext): void {
    if (this._isDraggingVertex) return; // suppress default pop
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
        // For polygon shapes, double-click enters vertex editing mode
        if (
          this.model.shapeType === ShapeType.Polygon &&
          this._vertexEditingOverlay
        ) {
          this._enterVertexEditingMode();
          return;
        }

        mountShapeTextEditor(this.model, edgeless);
      }
    });
  }

  /** Whether a vertex is currently being dragged (suppresses default drag). */
  private _isDraggingVertex = false;

  /** Disposer for the Escape key listener used in vertex editing mode. */
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
        evt.stopPropagation();
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
          if (this.model.smoothFlags) {
            this.model.stash('smoothFlags');
          }
          this._vertexEditingOverlay.toggleVertexSmooth(idx);
          if (this.model.smoothFlags) {
            this.model.pop('smoothFlags');
          }
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
        this.model.stash('vertices');
        if (this.model.smoothFlags) {
          this.model.stash('smoothFlags');
        }
        const newIdx = this._vertexEditingOverlay.insertVertexAtMidpoint(midIdx);
        this.model.pop('vertices');
        if (this.model.smoothFlags) {
          this.model.pop('smoothFlags');
        }
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

    // Vertex dragging: start drag on pointer down over a vertex
    this.on('dragstart', (e) => {
      if (!this._vertexEditingOverlay) return;
      if (!this._vertexEditingOverlay.isEditing) return;

      const [mx, my] = this.gfx.viewport.toModelCoord(e.x, e.y);
      const hitIdx = this._vertexEditingOverlay.hitTestVertex(mx, my);

      if (hitIdx >= 0) {
        this._isDraggingVertex = true;
        this._vertexEditingOverlay.activeVertexIndex = hitIdx;
        this.model.stash('xywh');
        this.model.stash('vertices');
        this._surfaceComponent?.refresh();
      }
    });

    this.on('dragmove', (e) => {
      if (!this._vertexEditingOverlay) return;
      if (!this._isDraggingVertex) return;

      const [mx, my] = this.gfx.viewport.toModelCoord(e.x, e.y);
      this._vertexEditingOverlay.moveVertex(
        this._vertexEditingOverlay.activeVertexIndex,
        mx,
        my
      );
      this._surfaceComponent?.refresh();
    });

    this.on('dragend', () => {
      if (!this._vertexEditingOverlay) return;
      if (!this._isDraggingVertex) return;

      this._isDraggingVertex = false;
      this._vertexEditingOverlay.activeVertexIndex = -1;
      this._vertexEditingOverlay.clearSnapGuides();
      this.model.pop('xywh');
      this.model.pop('vertices');
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
    this._surfaceComponent?.renderer.refresh();
  }

  /** Get the vertex editing overlay (used by interaction handlers). */
  get vertexEditingOverlay(): PolygonVertexEditingOverlay | null {
    return this._vertexEditingOverlay;
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
