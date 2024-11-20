import type {
  EdgelessTextBlockModel,
  FrameBlockModel,
  NoteBlockModel,
} from '@blocksuite/affine-model';
import type { PointerEventState } from '@blocksuite/block-std';
import type { IVec } from '@blocksuite/global/utils';

import {
  ConnectorUtils,
  OverlayIdentifier,
} from '@blocksuite/affine-block-surface';
import { focusTextModel } from '@blocksuite/affine-components/rich-text';
import {
  ConnectorElementModel,
  GroupElementModel,
  MindmapElementModel,
  ShapeElementModel,
  TextElementModel,
} from '@blocksuite/affine-model';
import { TelemetryProvider } from '@blocksuite/affine-shared/services';
import {
  clamp,
  handleNativeRangeAtPoint,
  resetNativeSelection,
} from '@blocksuite/affine-shared/utils';
import {
  BaseTool,
  getTopElements,
  GfxExtensionIdentifier,
  type GfxPrimitiveElementModel,
  isGfxContainerElm,
  type PointTestOptions,
} from '@blocksuite/block-std/gfx';
import {
  Bound,
  DisposableGroup,
  getCommonBoundWithRotation,
  noop,
  Vec,
} from '@blocksuite/global/utils';
import { effect } from '@preact/signals-core';

import type { GfxBlockModel } from '../block-model.js';
import type { EdgelessRootBlockComponent } from '../edgeless-root-block.js';
import type { EdgelessFrameManager, FrameOverlay } from '../frame-manager.js';
import type { EdgelessSnapManager } from '../utils/snap-manager.js';
import type { DefaultToolExt } from './default-tool-ext/ext.js';

import { isSelectSingleMindMap } from '../../../_common/edgeless/mindmap/index.js';
import { prepareCloneData } from '../utils/clone-utils.js';
import { calPanDelta } from '../utils/panning-utils.js';
import {
  isCanvasElement,
  isEdgelessTextBlock,
  isFrameBlock,
  isNoteBlock,
} from '../utils/query.js';
import {
  addText,
  mountConnectorLabelEditor,
  mountFrameTitleEditor,
  mountGroupTitleEditor,
  mountShapeTextEditor,
  mountTextElementEditor,
} from '../utils/text.js';
import { fitToScreen } from '../utils/viewport.js';
import { DefaultModeDragType } from './default-tool-ext/ext.js';
import { MindMapExt } from './default-tool-ext/mind-map-ext.js';

export class DefaultTool extends BaseTool {
  static override toolName: string = 'default';

  private _accumulateDelta: IVec = [0, 0];

  private _alignBound = new Bound();

  private _autoPanTimer: number | null = null;

  private _clearDisposable = () => {
    if (this._disposables) {
      this._disposables.dispose();
      this._disposables = null;
    }
  };

  private _clearSelectingState = () => {
    this._stopAutoPanning();
    this._clearDisposable();

    this._wheeling = false;
  };

  private _disposables: DisposableGroup | null = null;

  private _extHandlers: {
    dragStart?: (evt: PointerEventState) => void;
    dragMove?: (evt: PointerEventState) => void;
    dragEnd?: (evt: PointerEventState) => void;
  }[] = [];

  private _exts: DefaultToolExt[] = [];

  private _hoveredFrame: FrameBlockModel | null = null;

  // Do not select the text, when click again after activating the note.
  private _isDoubleClickedOnMask = false;

  private _lock = false;

  private _panViewport = (delta: IVec) => {
    this._accumulateDelta[0] += delta[0];
    this._accumulateDelta[1] += delta[1];
    this.gfx.viewport.applyDeltaCenter(delta[0], delta[1]);
  };

  private _pendingUpdates = new Map<
    GfxBlockModel | GfxPrimitiveElementModel,
    Partial<GfxBlockModel>
  >();

  private _rafId: number | null = null;

  private _selectedBounds: Bound[] = [];

  // For moving the connector label
  private _selectedConnector: ConnectorElementModel | null = null;

  private _selectedConnectorLabelBounds: Bound | null = null;

  private _selectionRectTransition: null | {
    w: number;
    h: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } = null;

  private _startAutoPanning = (delta: IVec) => {
    this._panViewport(delta);
    this._updateSelectingState(delta);
    this._stopAutoPanning();

    this._autoPanTimer = window.setInterval(() => {
      this._panViewport(delta);
      this._updateSelectingState(delta);
    }, 30);
  };

  private _stopAutoPanning = () => {
    if (this._autoPanTimer) {
      clearTimeout(this._autoPanTimer);
      this._autoPanTimer = null;
    }
  };

  private _toBeMoved: BlockSuite.EdgelessModel[] = [];

  private _updateSelectingState = (delta: IVec = [0, 0]) => {
    const { gfx } = this;

    if (gfx.keyboard.spaceKey$.peek() && this._selectionRectTransition) {
      /* Move the selection if space is pressed */
      const curDraggingViewArea = this.controller.draggingViewArea$.peek();
      const { w, h, startX, startY, endX, endY } =
        this._selectionRectTransition;
      const { endX: lastX, endY: lastY } = curDraggingViewArea;

      const dx = lastX + delta[0] - endX + this._accumulateDelta[0];
      const dy = lastY + delta[1] - endY + this._accumulateDelta[1];

      this.controller.draggingViewArea$.value = {
        ...curDraggingViewArea,
        x: Math.min(startX + dx, lastX),
        y: Math.min(startY + dy, lastY),
        w,
        h,
        startX: startX + dx,
        startY: startY + dy,
      };
    } else {
      const curDraggingArea = this.controller.draggingViewArea$.peek();
      const newStartX = curDraggingArea.startX - delta[0];
      const newStartY = curDraggingArea.startY - delta[1];

      this.controller.draggingViewArea$.value = {
        ...curDraggingArea,
        startX: newStartX,
        startY: newStartY,
        x: Math.min(newStartX, curDraggingArea.endX),
        y: Math.min(newStartY, curDraggingArea.endY),
        w: Math.abs(curDraggingArea.endX - newStartX),
        h: Math.abs(curDraggingArea.endY - newStartY),
      };
    }

    const { x, y, w, h } = this.controller.draggingArea$.peek();
    const bound = new Bound(x, y, w, h);

    const elements = getTopElements(gfx.getElementsByBound(bound));

    const set = new Set(
      gfx.keyboard.shiftKey$.peek()
        ? [...elements, ...gfx.selection.selectedElements]
        : elements
    );

    this.edgelessSelectionManager.set({
      elements: Array.from(set).map(element => element.id),
      editing: false,
    });
  };

  private _wheeling = false;

  dragType = DefaultModeDragType.None;

  enableHover = true;

  private get _edgeless(): EdgelessRootBlockComponent | null {
    const block = this.std.view.getBlock(this.doc.root!.id);

    return (block as EdgelessRootBlockComponent) ?? null;
  }

  private get _frameMgr() {
    return this.std.get(
      GfxExtensionIdentifier('frame-manager')
    ) as EdgelessFrameManager;
  }

  /**
   * Get the end position of the dragging area in the model coordinate
   */
  get dragLastPos() {
    const { endX, endY } = this.controller.draggingArea$.peek();

    return [endX, endY] as IVec;
  }

  /**
   * Get the start position of the dragging area in the model coordinate
   */
  get dragStartPos() {
    const { startX, startY } = this.controller.draggingArea$.peek();

    return [startX, startY] as IVec;
  }

  get edgelessSelectionManager() {
    return this.gfx.selection;
  }

  private get frameOverlay() {
    return this.std.get(OverlayIdentifier('frame')) as FrameOverlay;
  }

  get snapOverlay() {
    return this.std.get(
      OverlayIdentifier('snap-manager')
    ) as EdgelessSnapManager;
  }

  private _addEmptyParagraphBlock(
    block: NoteBlockModel | EdgelessTextBlockModel
  ) {
    const blockId = this.doc.addBlock(
      'affine:paragraph',
      { type: 'text' },
      block.id
    );
    if (blockId) {
      focusTextModel(this.std, blockId);
    }
  }

  private async _cloneContent() {
    this._lock = true;

    if (!this._edgeless) return;

    const clipboardController = this._edgeless?.clipboardController;
    const snapshot = await prepareCloneData(this._toBeMoved, this.std);

    const bound = getCommonBoundWithRotation(this._toBeMoved);
    const { canvasElements, blockModels } =
      await clipboardController.createElementsFromClipboardData(
        snapshot,
        bound.center
      );

    this._toBeMoved = [...canvasElements, ...blockModels];
    this.edgelessSelectionManager.set({
      elements: this._toBeMoved.map(e => e.id),
      editing: false,
    });
  }

  private _determineDragType(e: PointerEventState): DefaultModeDragType {
    const { x, y } = e;
    // Is dragging started from current selected rect
    if (this.edgelessSelectionManager.isInSelectedRect(x, y)) {
      if (this.edgelessSelectionManager.selectedElements.length === 1) {
        let selected = this.edgelessSelectionManager.selectedElements[0];
        // double check
        const currentSelected = this._pick(x, y);
        if (
          !isFrameBlock(selected) &&
          !(selected instanceof GroupElementModel) &&
          currentSelected &&
          currentSelected !== selected
        ) {
          selected = currentSelected;
          this.edgelessSelectionManager.set({
            elements: [selected.id],
            editing: false,
          });
        }

        if (
          isCanvasElement(selected) &&
          ConnectorUtils.isConnectorWithLabel(selected) &&
          (selected as ConnectorElementModel).labelIncludesPoint(
            this.gfx.viewport.toModelCoord(x, y)
          )
        ) {
          this._selectedConnector = selected as ConnectorElementModel;
          this._selectedConnectorLabelBounds = Bound.fromXYWH(
            this._selectedConnector.labelXYWH!
          );
          return DefaultModeDragType.ConnectorLabelMoving;
        }
      }

      return this.edgelessSelectionManager.editing
        ? DefaultModeDragType.NativeEditing
        : DefaultModeDragType.ContentMoving;
    } else {
      const selected = this._pick(x, y);
      if (selected) {
        this.edgelessSelectionManager.set({
          elements: [selected.id],
          editing: false,
        });

        if (
          isCanvasElement(selected) &&
          ConnectorUtils.isConnectorWithLabel(selected) &&
          (selected as ConnectorElementModel).labelIncludesPoint(
            this.gfx.viewport.toModelCoord(x, y)
          )
        ) {
          this._selectedConnector = selected as ConnectorElementModel;
          this._selectedConnectorLabelBounds = Bound.fromXYWH(
            this._selectedConnector.labelXYWH!
          );
          return DefaultModeDragType.ConnectorLabelMoving;
        }

        return DefaultModeDragType.ContentMoving;
      } else {
        return DefaultModeDragType.Selecting;
      }
    }
  }

  private _filterConnectedConnector() {
    this._toBeMoved = this._toBeMoved.filter(ele => {
      if (
        ele instanceof ConnectorElementModel &&
        ele.source?.id &&
        ele.target?.id
      ) {
        if (
          this._toBeMoved.some(e => e.id === ele.source.id) &&
          this._toBeMoved.some(e => e.id === ele.target.id)
        ) {
          return false;
        }
      }
      return true;
    });
  }

  private _isDraggable(element: BlockSuite.EdgelessModel) {
    return !(
      element instanceof ConnectorElementModel &&
      !ConnectorUtils.isConnectorAndBindingsAllSelected(
        element,
        this._toBeMoved
      )
    );
  }

  private _moveContent(
    [dx, dy]: IVec,
    alignBound: Bound,
    shifted?: boolean,
    shouldClone?: boolean
  ) {
    alignBound.x += dx;
    alignBound.y += dy;

    const alignRst = this.snapOverlay.align(alignBound);
    const delta = [dx + alignRst.dx, dy + alignRst.dy];

    if (shifted) {
      const angle = Math.abs(Math.atan2(delta[1], delta[0]));
      const direction =
        angle < Math.PI / 4 || angle > 3 * (Math.PI / 4) ? 'x' : 'y';
      delta[direction === 'x' ? 1 : 0] = 0;
    }

    this._toBeMoved.forEach((element, index) => {
      const isGraphicElement = isCanvasElement(element);

      if (isGraphicElement && !this._isDraggable(element)) return;

      let bound = this._selectedBounds[index];
      if (shouldClone) bound = bound.clone();

      bound.x += delta[0];
      bound.y += delta[1];

      if (isGraphicElement) {
        if (!this._lock) {
          this._lock = true;
          this.doc.captureSync();
        }

        if (element instanceof ConnectorElementModel) {
          element.moveTo(bound);
        }
      }

      this._scheduleUpdate(element, {
        xywh: bound.serialize(),
      });
    });

    this._hoveredFrame = this._frameMgr.getFrameFromPoint(
      this.dragLastPos,
      this._toBeMoved.filter(ele => isFrameBlock(ele))
    );

    this._hoveredFrame
      ? this.frameOverlay.highlight(this._hoveredFrame)
      : this.frameOverlay.clear();
  }

  private _moveLabel(delta: IVec) {
    const connector = this._selectedConnector;
    let bounds = this._selectedConnectorLabelBounds;
    if (!connector || !bounds) return;
    bounds = bounds.clone();
    const center = connector.getNearestPoint(
      Vec.add(bounds.center, delta) as IVec
    );
    const distance = connector.getOffsetDistanceByPoint(center as IVec);
    bounds.center = center;
    this.gfx.updateElement(connector, {
      labelXYWH: bounds.toXYWH(),
      labelOffset: {
        distance,
      },
    });
  }

  private _pick(x: number, y: number, options?: PointTestOptions) {
    const modelPos = this.gfx.viewport.toModelCoord(x, y);
    const group = this.gfx.getElementInGroup(modelPos[0], modelPos[1], options);

    if (group instanceof MindmapElementModel) {
      const picked = this.gfx.getElementByPoint(modelPos[0], modelPos[1], {
        ...((options ?? {}) as PointTestOptions),
        all: true,
      });

      let pickedIdx = picked.length - 1;

      while (pickedIdx >= 0) {
        const element = picked[pickedIdx];
        if (element === group) {
          pickedIdx -= 1;
          continue;
        }

        break;
      }

      return picked[pickedIdx] ?? null;
    }

    return group;
  }

  private _scheduleUpdate(
    element: GfxBlockModel | GfxPrimitiveElementModel,
    updates: Partial<GfxBlockModel>
  ) {
    this._pendingUpdates.set(element, updates);

    if (this._rafId !== null) return;

    this._rafId = requestAnimationFrame(() => {
      this._pendingUpdates.forEach((updates, element) => {
        this.gfx.updateElement(element, updates);
      });
      this._pendingUpdates.clear();
      this._rafId = null;
    });
  }

  private initializeDragState(dragType: DefaultModeDragType) {
    this.dragType = dragType;

    if (
      (this._toBeMoved.length &&
        this._toBeMoved.every(
          ele => !(ele.group instanceof MindmapElementModel)
        )) ||
      (isSelectSingleMindMap(this._toBeMoved) &&
        this._toBeMoved[0].id ===
          (this._toBeMoved[0].group as MindmapElementModel).tree.id)
    ) {
      const mindmap = this._toBeMoved[0].group as MindmapElementModel;

      this._alignBound = this.snapOverlay.setupAlignables(this._toBeMoved, [
        mindmap,
        ...(mindmap?.childElements || []),
      ]);
    }

    this._clearDisposable();
    this._disposables = new DisposableGroup();

    const ctx = {
      movedElements: this._toBeMoved,
      dragType,
    };

    this._extHandlers = this._exts.map(ext => ext.initDrag(ctx));
    this._selectedBounds = this._toBeMoved.map(element =>
      Bound.deserialize(element.xywh)
    );

    // If the drag type is selecting, set up the dragging area disposable group
    // If the viewport updates when dragging, should update the dragging area and selection
    if (this.dragType === DefaultModeDragType.Selecting) {
      this._disposables.add(
        this.gfx.viewport.viewportUpdated.on(() => {
          if (
            this.dragType === DefaultModeDragType.Selecting &&
            this.controller.dragging$.peek() &&
            !this._autoPanTimer
          ) {
            this._updateSelectingState();
          }
        })
      );
      return;
    }

    if (this.dragType === DefaultModeDragType.ContentMoving) {
      this._disposables.add(
        this.gfx.viewport.viewportMoved.on(delta => {
          if (
            this.dragType === DefaultModeDragType.ContentMoving &&
            this.controller.dragging$.peek() &&
            !this._autoPanTimer
          ) {
            if (
              this._toBeMoved.every(ele => {
                return !this._isDraggable(ele);
              })
            ) {
              return;
            }

            if (!this._wheeling) {
              this._wheeling = true;
              this._selectedBounds = this._toBeMoved.map(element =>
                Bound.deserialize(element.xywh)
              );
            }

            this._alignBound = this.snapOverlay.setupAlignables(
              this._toBeMoved
            );

            this._moveContent(delta, this._alignBound);
          }
        })
      );
      return;
    }
  }

  override activate(_: Record<string, unknown>): void {
    if (this.gfx.selection.lastSurfaceSelections.length) {
      this.gfx.selection.set(this.gfx.selection.lastSurfaceSelections);
    }
  }

  override click(e: PointerEventState) {
    if (this.doc.readonly) return;

    const selected = this._pick(e.x, e.y, {
      ignoreTransparent: true,
    });
    if (selected) {
      const { selectedIds, surfaceSelections } = this.edgelessSelectionManager;
      const editing = surfaceSelections[0]?.editing ?? false;

      // click active canvas text, edgeless text block and note block
      if (
        selectedIds.length === 1 &&
        selectedIds[0] === selected.id &&
        editing
      ) {
        // edgeless text block and note block
        if (
          (isNoteBlock(selected) || isEdgelessTextBlock(selected)) &&
          selected.children.length === 0
        ) {
          this._addEmptyParagraphBlock(selected);
        }
        // canvas text
        return;
      }

      // click non-active edgeless text block and note block
      if (
        !e.keys.shift &&
        selectedIds.length === 1 &&
        (isNoteBlock(selected) || isEdgelessTextBlock(selected)) &&
        ((selectedIds[0] === selected.id && !editing) ||
          (editing && selectedIds[0] !== selected.id))
      ) {
        // issue #1809
        // If the previously selected element is a noteBlock and is in an active state,
        // then the currently clicked noteBlock should also be in an active state when selected.
        this.edgelessSelectionManager.set({
          elements: [selected.id],
          editing: true,
        });
        this._edgeless?.updateComplete
          .then(() => {
            // check if block has children blocks, if not, add a paragraph block and focus on it
            if (selected.children.length === 0) {
              this._addEmptyParagraphBlock(selected);
            } else {
              const block = this.std.host.view.getBlock(selected.id);
              if (block) {
                const rect = block
                  .querySelector('.affine-block-children-container')!
                  .getBoundingClientRect();

                const offsetY = 8 * this.gfx.viewport.zoom;
                const offsetX = 2 * this.gfx.viewport.zoom;
                const x = clamp(
                  e.raw.clientX,
                  rect.left + offsetX,
                  rect.right - offsetX
                );
                const y = clamp(
                  e.raw.clientY,
                  rect.top + offsetY,
                  rect.bottom - offsetY
                );
                handleNativeRangeAtPoint(x, y);
              } else {
                handleNativeRangeAtPoint(e.raw.clientX, e.raw.clientY);
              }
            }
          })
          .catch(console.error);
        return;
      }

      this.edgelessSelectionManager.set({
        // hold shift key to multi select or de-select element
        elements: e.keys.shift
          ? this.edgelessSelectionManager.has(selected.id)
            ? selectedIds.filter(id => id !== selected.id)
            : [...selectedIds, selected.id]
          : [selected.id],
        editing: false,
      });
    } else if (!e.keys.shift) {
      this.edgelessSelectionManager.clear();
      resetNativeSelection(null);
    }

    this._isDoubleClickedOnMask = false;
  }

  override deactivate() {
    this._stopAutoPanning();
    this._clearDisposable();
    this._accumulateDelta = [0, 0];
    noop();
  }

  override doubleClick(e: PointerEventState) {
    if (this.doc.readonly) {
      const viewport = this.gfx.viewport;
      if (viewport.zoom === 1) {
        // Fit to Screen
        fitToScreen(
          [...this.gfx.layer.blocks, ...this.gfx.layer.canvasElements],
          this.gfx.viewport
        );
      } else {
        // Zoom to 100% and Center
        const [x, y] = viewport.toModelCoord(e.x, e.y);
        viewport.setViewport(1, [x, y], true);
      }
      return;
    }

    const selected = this._pick(e.x, e.y, {
      hitThreshold: 10,
    });
    if (!this._edgeless) {
      return;
    }

    if (!selected) {
      const textFlag = this.doc.awarenessStore.getFlag('enable_edgeless_text');

      if (textFlag) {
        const [x, y] = this.gfx.viewport.toModelCoord(e.x, e.y);
        this.std.command.exec('insertEdgelessText', { x, y });
      } else {
        addText(this._edgeless, e);
      }
      this.std.getOptional(TelemetryProvider)?.track('CanvasElementAdded', {
        control: 'canvas:dbclick',
        page: 'whiteboard editor',
        module: 'toolbar',
        segment: 'toolbar',
        type: 'text',
      });
      return;
    } else {
      const [x, y] = this.gfx.viewport.toModelCoord(e.x, e.y);
      if (selected instanceof TextElementModel) {
        mountTextElementEditor(selected, this._edgeless, {
          x,
          y,
        });
        return;
      }
      if (selected instanceof ShapeElementModel) {
        mountShapeTextEditor(selected, this._edgeless);
        return;
      }
      if (selected instanceof ConnectorElementModel) {
        mountConnectorLabelEditor(selected, this._edgeless, [x, y]);
        return;
      }
      if (isFrameBlock(selected)) {
        mountFrameTitleEditor(selected, this._edgeless);
        return;
      }
      if (selected instanceof GroupElementModel) {
        mountGroupTitleEditor(selected, this._edgeless);
        return;
      }
    }

    if (
      e.raw.target &&
      e.raw.target instanceof HTMLElement &&
      e.raw.target.classList.contains('affine-note-mask')
    ) {
      this.click(e);
      this._isDoubleClickedOnMask = true;
      return;
    }
  }

  override dragEnd(e: PointerEventState) {
    this._extHandlers.forEach(handler => handler.dragEnd?.(e));

    this._toBeMoved.forEach(el => {
      this.doc.transact(() => {
        el.pop('xywh');
      });

      if (el instanceof ConnectorElementModel) {
        el.pop('labelXYWH');
      }
    });

    {
      const frameManager = this._frameMgr;
      const toBeMovedTopElements = getTopElements(
        this._toBeMoved.map(el =>
          el.group instanceof MindmapElementModel ? el.group : el
        )
      );
      if (this._hoveredFrame) {
        frameManager.addElementsToFrame(
          this._hoveredFrame,
          toBeMovedTopElements
        );
      } else {
        // only apply to root nodes of trees
        toBeMovedTopElements.map(element =>
          frameManager.removeFromParentFrame(element)
        );
      }
    }

    if (this._lock) {
      this.doc.captureSync();
      this._lock = false;
    }

    if (this.edgelessSelectionManager.editing) return;

    this._selectedBounds = [];
    this.snapOverlay.cleanupAlignables();
    this.frameOverlay.clear();
    this._toBeMoved = [];
    this._selectedConnector = null;
    this._selectedConnectorLabelBounds = null;
    this._clearSelectingState();
    this.dragType = DefaultModeDragType.None;
  }

  override dragMove(e: PointerEventState) {
    const { viewport } = this.gfx;
    switch (this.dragType) {
      case DefaultModeDragType.Selecting: {
        // Record the last drag pointer position for auto panning and view port updating

        this._updateSelectingState();
        const moveDelta = calPanDelta(viewport, e);
        if (moveDelta) {
          this._startAutoPanning(moveDelta);
        } else {
          this._stopAutoPanning();
        }
        break;
      }
      case DefaultModeDragType.AltCloning:
      case DefaultModeDragType.ContentMoving: {
        if (
          this._toBeMoved.every(ele => {
            return !this._isDraggable(ele);
          })
        ) {
          return;
        }

        if (this._wheeling) {
          this._wheeling = false;
        }

        const dx = this.dragLastPos[0] - this.dragStartPos[0];
        const dy = this.dragLastPos[1] - this.dragStartPos[1];
        const alignBound = this._alignBound.clone();
        const shifted = e.keys.shift || this.gfx.keyboard.shiftKey$.peek();

        this._moveContent([dx, dy], alignBound, shifted, true);
        this._extHandlers.forEach(handler => handler.dragMove?.(e));
        break;
      }
      case DefaultModeDragType.ConnectorLabelMoving: {
        const dx = this.dragLastPos[0] - this.dragStartPos[0];
        const dy = this.dragLastPos[1] - this.dragStartPos[1];
        this._moveLabel([dx, dy]);
        break;
      }
      case DefaultModeDragType.NativeEditing: {
        // TODO reset if drag out of note
        break;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  override async dragStart(e: PointerEventState) {
    if (this.edgelessSelectionManager.editing) return;
    // Determine the drag type based on the current state and event
    let dragType = this._determineDragType(e);

    const elements = this.edgelessSelectionManager.selectedElements;
    const toBeMoved = new Set(elements);

    elements.forEach(element => {
      if (isGfxContainerElm(element)) {
        element.descendantElements.forEach(ele => {
          toBeMoved.add(ele);
        });
      }
    });

    this._toBeMoved = Array.from(toBeMoved);

    // If alt key is pressed and content is moving, clone the content
    if (e.keys.alt && dragType === DefaultModeDragType.ContentMoving) {
      dragType = DefaultModeDragType.AltCloning;
      await this._cloneContent();
    }
    this._filterConnectedConnector();

    // Connector needs to be updated first
    this._toBeMoved.sort((a, _) =>
      a instanceof ConnectorElementModel ? -1 : 1
    );

    // Set up drag state
    this.initializeDragState(dragType);

    // stash the state
    this._toBeMoved.forEach(ele => {
      ele.stash('xywh');

      if (ele instanceof ConnectorElementModel) {
        ele.stash('labelXYWH');
      }
    });

    this._extHandlers.forEach(handler => handler.dragStart?.(e));
  }

  override mounted() {
    this.disposable.add(
      effect(() => {
        const pressed = this.gfx.keyboard.spaceKey$.value;

        if (pressed) {
          const currentDraggingArea = this.controller.draggingViewArea$.peek();

          this._selectionRectTransition = {
            w: currentDraggingArea.w,
            h: currentDraggingArea.h,
            startX: currentDraggingArea.startX,
            startY: currentDraggingArea.startY,
            endX: currentDraggingArea.endX,
            endY: currentDraggingArea.endY,
          };
        } else {
          this._selectionRectTransition = null;
        }
      })
    );

    this._exts = [MindMapExt].map(constructor => new constructor(this));
    this._exts.forEach(ext => ext.mounted());
  }

  override pointerMove(e: PointerEventState) {
    const hovered = this._pick(e.x, e.y, {
      hitThreshold: 10,
    });
    if (
      isFrameBlock(hovered) &&
      hovered.externalBound?.isPointInBound(
        this.gfx.viewport.toModelCoord(e.x, e.y)
      )
    ) {
      this.frameOverlay.highlight(hovered);
    } else {
      this.frameOverlay.clear();
    }
  }

  override tripleClick() {
    if (this._isDoubleClickedOnMask) return;
  }

  override unmounted(): void {
    this._exts.forEach(ext => ext.unmounted());
  }
}

declare module '@blocksuite/block-std/gfx' {
  interface GfxToolsMap {
    default: DefaultTool;
  }
}
