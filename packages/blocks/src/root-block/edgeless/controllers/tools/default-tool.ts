import type { PointerEventState } from '@blocksuite/block-std';
import { DisposableGroup, noop } from '@blocksuite/global/utils';

import {
  asyncFocusRichText,
  buildPath,
} from '../../../../_common/utils/index.js';
import {
  handleNativeRangeAtPoint,
  resetNativeSelection,
} from '../../../../_common/utils/index.js';
import { clamp } from '../../../../_common/utils/math.js';
import type { EdgelessTextBlockModel } from '../../../../edgeless-text/edgeless-text-model.js';
import type { FrameBlockModel } from '../../../../frame-block/index.js';
import type { NoteBlockModel } from '../../../../note-block/note-model.js';
import {
  type IHitTestOptions,
  SurfaceGroupLikeModel,
} from '../../../../surface-block/element-model/base.js';
import { isConnectorWithLabel } from '../../../../surface-block/element-model/connector.js';
import {
  ConnectorElementModel,
  GroupElementModel,
  MindmapElementModel,
  ShapeElementModel,
  TextElementModel,
} from '../../../../surface-block/element-model/index.js';
import type { MindmapNode } from '../../../../surface-block/element-model/utils/mindmap/layout.js';
import {
  hideTargetConnector,
  moveSubtree,
  showMergeIndicator,
} from '../../../../surface-block/element-model/utils/mindmap/utils.js';
import {
  Bound,
  type IVec,
  type IVec2,
  Vec,
} from '../../../../surface-block/index.js';
import { isConnectorAndBindingsAllSelected } from '../../../../surface-block/managers/connector-manager.js';
import { intersects } from '../../../../surface-block/utils/math-utils.js';
import type { EdgelessTool } from '../../types.js';
import { edgelessElementsBound } from '../../utils/bound-utils.js';
import { prepareCloneData } from '../../utils/clone-utils.js';
import { calPanDelta } from '../../utils/panning-utils.js';
import {
  isCanvasElement,
  isEdgelessTextBlock,
  isFrameBlock,
  isNoteBlock,
} from '../../utils/query.js';
import {
  addText,
  mountConnectorLabelEditor,
  mountFrameTitleEditor,
  mountGroupTitleEditor,
  mountShapeTextEditor,
  mountTextElementEditor,
} from '../../utils/text.js';
import { EdgelessToolController } from './edgeless-tool.js';

export enum DefaultModeDragType {
  /** Moving selected contents */
  ContentMoving = 'content-moving',
  /** Expanding the dragging area, select the content covered inside */
  Selecting = 'selecting',
  /** Native range dragging inside active note block */
  NativeEditing = 'native-editing',
  /** Default void state */
  None = 'none',
  /** Dragging preview */
  PreviewDragging = 'preview-dragging',
  /** press alt/option key to clone selected  */
  AltCloning = 'alt-cloning',
  /** Moving connector label */
  ConnectorLabelMoving = 'connector-label-moving',
}

type DefaultTool = {
  type: 'default';
};

export class DefaultToolController extends EdgelessToolController<DefaultTool> {
  private _dragStartPos: IVec = [0, 0];

  private _dragLastPos: IVec = [0, 0];

  private _dragStartModelCoord: IVec = [0, 0];

  private _dragLastModelCoord: IVec = [0, 0];

  private _lock = false;

  // Do not select the text, when click again after activating the note.
  private _isDoubleClickedOnMask = false;

  private _alignBound = new Bound();

  private _selectedBounds: Bound[] = [];

  private _toBeMoved: BlockSuite.EdgelessModelType[] = [];

  private _autoPanTimer: number | null = null;

  private _dragging = false;

  private _wheeling = false;

  private _disposables: DisposableGroup | null = null;

  // For moving selection with space with mouse
  private _moveSelectionStartPos: IVec = [0, 0];

  private _moveSelectionDragStartTemp: IVec = [0, 0];

  // For moving the connector label
  private _selectedConnector: ConnectorElementModel | null = null;

  private _selectedConnectorLabelBounds: Bound | null = null;

  private _clearMindMapHoverState: (() => void)[] = [];

  private _hoveredMindMap: null | {
    mindmap: MindmapElementModel;
    node: MindmapNode;
    mergeInfo?: Exclude<
      ReturnType<typeof showMergeIndicator>,
      undefined
    >['mergeInfo'];
  } = null;

  private _draggingSingleMindmap: null | {
    mindmap: MindmapElementModel;
    node: MindmapNode;
    startElementBound: Bound;
    clear?: () => void;
    detach?: boolean;
  } = null;

  readonly tool = {
    type: 'default',
  } as DefaultTool;

  override enableHover = true;

  dragType = DefaultModeDragType.None;

  override get draggingArea() {
    if (this.dragType === DefaultModeDragType.Selecting) {
      const [startX, startY] = this._service.viewport.toViewCoord(
        this._dragStartModelCoord[0],
        this._dragStartModelCoord[1]
      );
      const [endX, endY] = this._service.viewport.toViewCoord(
        this._dragLastModelCoord[0],
        this._dragLastModelCoord[1]
      );
      return {
        start: new DOMPoint(startX, startY),
        end: new DOMPoint(endX, endY),
      };
    }
    return null;
  }

  get edgelessSelectionManager() {
    return this._edgeless.service.selection;
  }

  get zoom() {
    return this._edgeless.service.viewport.zoom;
  }

  get readonly() {
    return this._edgeless.doc.readonly;
  }

  private _pick(x: number, y: number, options?: IHitTestOptions) {
    const service = this._service;
    const modelPos = service.viewport.toModelCoord(x, y);
    const group = service.pickElementInGroup(modelPos[0], modelPos[1], options);

    if (group instanceof MindmapElementModel) {
      const picked = service.pickElement(modelPos[0], modelPos[1], {
        ...((options ?? {}) as IHitTestOptions),
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

  private _addEmptyParagraphBlock(
    block: NoteBlockModel | EdgelessTextBlockModel
  ) {
    const blockId = this._doc.addBlock(
      'affine:paragraph',
      { type: 'text' },
      block.id
    );
    if (blockId) {
      asyncFocusRichText(this._edgeless.host, blockId)?.catch(console.error);
    }
  }

  private _isDraggable(element: BlockSuite.EdgelessModelType) {
    return !(
      element instanceof ConnectorElementModel &&
      !isConnectorAndBindingsAllSelected(element, this._toBeMoved)
    );
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
          isConnectorWithLabel(selected) &&
          (selected as ConnectorElementModel).labelHitTest(
            this._service.viewport.toModelCoord(x, y)
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
          isConnectorWithLabel(selected) &&
          (selected as ConnectorElementModel).labelHitTest(
            this._service.viewport.toModelCoord(x, y)
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

  private async _cloneContent() {
    this._lock = true;
    const { _edgeless } = this;
    const { clipboardController } = _edgeless;

    const snapshot = await prepareCloneData(this._toBeMoved, _edgeless.std);

    const bound = edgelessElementsBound(this._toBeMoved);
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

  private _updateSelectingState = () => {
    const { tools, service } = this._edgeless;
    const { selection } = service;

    if (tools.spaceBar) {
      /* Move the selection if space is pressed */
      const [moveCurX, moveCurY] = this._dragLastPos;
      const zoom = service.viewport.zoom;

      const dx = (moveCurX - this._moveSelectionStartPos[0]) / zoom;
      const dy = (moveCurY - this._moveSelectionStartPos[1]) / zoom;

      const [startX, startY] = service.viewport.toModelCoord(
        this._moveSelectionDragStartTemp[0],
        this._moveSelectionDragStartTemp[1]
      );
      this._dragStartModelCoord[0] = startX + dx;
      this._dragStartModelCoord[1] = startY + dy;
    }

    const startX = this._dragStartModelCoord[0];
    const startY = this._dragStartModelCoord[1];

    // Should convert the last drag position to model coordinate
    const [curX, curY] = service.viewport.toModelCoord(
      this._dragLastPos[0],
      this._dragLastPos[1]
    );

    const x = Math.min(startX, curX);
    const y = Math.min(startY, curY);

    const w = Math.abs(startX - curX);
    const h = Math.abs(startY - curY);
    const bound = new Bound(x, y, w, h);

    const elements = service.pickElementsByBound(bound);

    const set = new Set(
      tools.shiftKey ? [...elements, ...selection.selectedElements] : elements
    );

    this.edgelessSelectionManager.set({
      elements: Array.from(set).map(element => element.id),
      editing: false,
    });

    // Record the last model coordinate for dragging area updating
    this._dragLastModelCoord = [curX, curY];
    this._edgeless.slots.draggingAreaUpdated.emit();
  };

  private _panViewport = (delta: IVec) => {
    const { viewport } = this._service;
    viewport.applyDeltaCenter(delta[0], delta[1]);
  };

  private _stopAutoPanning = () => {
    if (this._autoPanTimer) {
      clearTimeout(this._autoPanTimer);
      this._autoPanTimer = null;
    }
  };

  private _clearLastSelection = () => {
    if (this.edgelessSelectionManager.empty) {
      this.edgelessSelectionManager.clearLast();
    }
  };

  private _clearDisposable = () => {
    if (this._disposables) {
      this._disposables.dispose();
      this._disposables = null;
    }
  };

  private _startAutoPanning = (delta: IVec) => {
    this._panViewport(delta);
    this._stopAutoPanning();

    this._autoPanTimer = window.setInterval(() => {
      this._panViewport(delta);
      this._updateSelectingState();
    }, 30);
  };

  private _clearSelectingState = () => {
    this._stopAutoPanning();
    this._clearDisposable();

    this._dragging = false;
    this._wheeling = false;
    this._dragStartPos = [0, 0];
    this._dragLastPos = [0, 0];
    this._dragStartModelCoord = [0, 0];
    this._dragLastModelCoord = [0, 0];
    this._edgeless.slots.draggingAreaUpdated.emit();

    // Move Selection with space
    this._moveSelectionDragStartTemp = [0, 0];
    this._moveSelectionStartPos = [0, 0];
  };

  private _filterConnectedConnector() {
    this._toBeMoved = this._toBeMoved.filter(ele => {
      if (
        ele instanceof ConnectorElementModel &&
        ele.source.id &&
        ele.target.id
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

  private initializeDragState(
    e: PointerEventState,
    dragType: DefaultModeDragType
  ) {
    const { x, y } = e;
    this.dragType = dragType;
    this._dragging = true;
    this._dragStartPos = [x, y];
    this._dragLastPos = [x, y];
    const [startX, startY] = this._service.viewport.toModelCoord(x, y);
    this._dragStartModelCoord = [startX, startY];
    this._dragLastModelCoord = [startX, startY];

    this._selectedBounds = this._toBeMoved.map(element =>
      Bound.deserialize(element.xywh)
    );

    if (
      this._toBeMoved.every(ele => !(ele.group instanceof MindmapElementModel))
    ) {
      this._alignBound = this._edgeless.service.snap.setupAlignables(
        this._toBeMoved
      );
    }

    this._clearDisposable();
    this._disposables = new DisposableGroup();

    // If the drag type is selecting, set up the dragging area disposable group
    // If the viewport updates when dragging, should update the dragging area and selection
    if (this.dragType === DefaultModeDragType.Selecting) {
      this._disposables.add(
        this._edgeless.service.viewport.viewportUpdated.on(() => {
          if (
            this.dragType === DefaultModeDragType.Selecting &&
            this._dragging &&
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
        this._edgeless.service.viewport.viewportMoved.on(delta => {
          if (
            this.dragType === DefaultModeDragType.ContentMoving &&
            this._dragging &&
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

            this._alignBound = this._edgeless.service.snap.setupAlignables(
              this._toBeMoved
            );

            this._moveContent(delta, this._alignBound);
          }
        })
      );
      return;
    }
  }

  private _moveContent(
    [dx, dy]: IVec,
    alignBound: Bound,
    shifted?: boolean,
    shouldClone?: boolean
  ) {
    alignBound.x += dx;
    alignBound.y += dy;

    const alignRst = this._edgeless.service.snap.align(alignBound);
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
          this._doc.captureSync();
        }

        if (element instanceof ConnectorElementModel) {
          element.moveTo(bound);
        }

        this._service.updateElement(element.id, {
          xywh: bound.serialize(),
        });
      } else {
        this._service.updateElement(element.id, {
          xywh: bound.serialize(),
        });
      }
    });

    if (this._draggingSingleMindmap) {
      const {
        node: currentNode,
        mindmap: currentMindmap,
        startElementBound,
      } = this._draggingSingleMindmap;
      const current = currentNode.element;
      const subtree = currentMindmap.getNode(current.id)!;
      const [x, y] = this._service.viewport.toModelCoord(
        this._dragLastPos[0],
        this._dragLastPos[1]
      );

      this._clearMindMapHoverState.forEach(fn => fn());
      this._clearMindMapHoverState = [];

      const hoveredMindmap = this._edgeless.service
        .pickElement(x, y, { all: true, expand: 40 })
        .filter(el => el.group?.type === 'mindmap' && el !== current)
        .map(el => ({
          element: el as ShapeElementModel,
          node: (el.group as MindmapElementModel).getNode(el.id)!,
          mindmap: el.group as MindmapElementModel,
        }))[0];

      if (hoveredMindmap) {
        const { node, element, mindmap } = hoveredMindmap;
        element.opacity = 0.8;

        const { clear, mergeInfo } =
          showMergeIndicator(mindmap, node, subtree, [x, y]) ?? {};
        clear && this._clearMindMapHoverState.push(clear);
        const clearHide = hideTargetConnector(currentMindmap, subtree);
        clearHide && this._clearMindMapHoverState.push(clearHide);

        const layoutType = mergeInfo?.layoutType;

        this._clearMindMapHoverState.push(() => {
          element.opacity = 1;
        });
        currentMindmap.layout(subtree, false, layoutType ?? undefined);
        this._hoveredMindMap = {
          node,
          mindmap,
          mergeInfo,
        };
      } else {
        const bound = new Bound(x, y, 40, 40);

        if (
          !(
            intersects(startElementBound, bound) ||
            startElementBound.contains(bound)
          ) &&
          currentMindmap.tree.id !== currentNode.id
        ) {
          const clearHide = hideTargetConnector(currentMindmap, subtree);
          clearHide && this._clearMindMapHoverState.push(clearHide);
          this._draggingSingleMindmap.detach = true;
        } else {
          this._draggingSingleMindmap.detach = false;
        }

        currentMindmap.layout(subtree, false);
        this._hoveredMindMap = null;
      }
    }

    const frame = this._edgeless.service.frame.selectFrame(this._toBeMoved);
    frame
      ? this._surface.overlays.frame.highlight(frame as FrameBlockModel)
      : this._surface.overlays.frame.clear();
  }

  private _moveLabel(delta: IVec) {
    const connector = this._selectedConnector;
    let bounds = this._selectedConnectorLabelBounds;
    if (!connector || !bounds) return;
    bounds = bounds.clone();
    const center = connector.getNearestPoint(
      Vec.add(bounds.center, delta) as IVec2
    );
    const distance = connector.getOffsetDistanceByPoint(center as IVec2);
    bounds.center = center;
    this._service.updateElement(connector.id, {
      labelXYWH: bounds.toXYWH(),
      labelOffset: {
        distance,
      },
    });
  }

  onContainerPointerDown(): void {
    noop();
  }

  onContainerClick(e: PointerEventState) {
    if (this.readonly) return;

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
        this._edgeless.updateComplete
          .then(() => {
            // check if block has children blocks, if not, add a paragraph block and focus on it
            if (selected.children.length === 0) {
              this._addEmptyParagraphBlock(selected);
            } else {
              const blockElement = this._edgeless.host.view.viewFromPath(
                'block',
                buildPath(selected)
              );
              if (blockElement) {
                const rect = blockElement.getBoundingClientRect();
                const offsetY = 16 * this.zoom;
                const offsetX = 2 * this.zoom;
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

  onContainerContextMenu() {
    // repairContextMenuRange(e);
    noop();
  }

  onContainerDblClick(e: PointerEventState) {
    if (this._doc.readonly) {
      const viewport = this._service.viewport;
      if (viewport.zoom === 1) {
        // Fit to Screen
        const { centerX, centerY, zoom } =
          this._edgeless.service.getFitToScreenData();
        viewport.setViewport(zoom, [centerX, centerY], true);
      } else {
        // Zoom to 100% and Center
        const [x, y] = viewport.toModelCoord(e.x, e.y);
        viewport.setViewport(1, [x, y], true);
      }
      return;
    }

    const selected = this._pick(e.x, e.y, {
      expand: 10,
    });
    if (!selected) {
      const textFlag = this._edgeless.doc.awarenessStore.getFlag(
        'enable_edgeless_text'
      );

      if (textFlag) {
        const [x, y] = this._service.viewport.toModelCoord(e.x, e.y);
        const textService = this._edgeless.host.spec.getService(
          'affine:edgeless-text'
        );
        textService.initEdgelessTextBlock({
          edgeless: this._edgeless,
          x,
          y,
        });
      } else {
        addText(this._edgeless, e);
      }
      this._edgeless.service.telemetryService?.track('CanvasElementAdded', {
        control: 'canvas:dbclick',
        page: 'whiteboard editor',
        module: 'toolbar',
        segment: 'toolbar',
        type: 'text',
      });
      return;
    } else {
      const [x, y] = this._service.viewport.toModelCoord(e.x, e.y);
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
      this.onContainerClick(e);
      this._isDoubleClickedOnMask = true;
      return;
    }
  }

  onContainerTripleClick() {
    if (this._isDoubleClickedOnMask) return;
  }

  async onContainerDragStart(e: PointerEventState) {
    if (this.edgelessSelectionManager.editing) return;
    // Determine the drag type based on the current state and event
    let dragType = this._determineDragType(e);

    const elements = this.edgelessSelectionManager.selectedElements;
    const toBeMoved = new Set(elements);
    elements.forEach(element => {
      if (isFrameBlock(element)) {
        this._edgeless.service.frame
          .getElementsInFrame(element)
          .forEach(ele => toBeMoved.add(ele));
      } else if (
        element.group instanceof MindmapElementModel &&
        elements.length > 1
      ) {
        element.group.descendants().forEach(ele => toBeMoved.add(ele));
      } else if (element instanceof SurfaceGroupLikeModel) {
        element.descendants().forEach(ele => toBeMoved.add(ele));
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
    this.initializeDragState(e, dragType);

    // stash the state
    if (
      this._toBeMoved.length === 1 &&
      this._toBeMoved[0].group instanceof MindmapElementModel
    ) {
      const mindmap = this._toBeMoved[0].group as MindmapElementModel;
      this._draggingSingleMindmap = {
        mindmap,
        node: mindmap.getNode(this._toBeMoved[0].id)!,
        clear: mindmap.stashTree(this._toBeMoved[0].id),
        startElementBound: mindmap.elementBound,
      };
    } else {
      this._toBeMoved.forEach(ele => {
        ele.stash('xywh');

        if (ele instanceof ConnectorElementModel) {
          ele.stash('labelXYWH');
        }
      });
    }
  }

  onContainerDragMove(e: PointerEventState) {
    const { viewport } = this._service;
    const zoom = viewport.zoom;
    switch (this.dragType) {
      case DefaultModeDragType.Selecting: {
        // Record the last drag pointer position for auto panning and view port updating
        this._dragLastPos = [e.x, e.y];

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
          this._dragStartPos = [...this._dragLastPos];
        } else {
          this._dragLastPos = [e.x, e.y];
        }

        const dx = (e.x - this._dragStartPos[0]) / zoom;
        const dy = (e.y - this._dragStartPos[1]) / zoom;
        const alignBound = this._alignBound.clone();
        const shifted = e.keys.shift || this._edgeless.tools.shiftKey;

        this._moveContent([dx, dy], alignBound, shifted, true);
        break;
      }
      case DefaultModeDragType.ConnectorLabelMoving: {
        const dx = (e.x - this._dragStartPos[0]) / zoom;
        const dy = (e.y - this._dragStartPos[1]) / zoom;
        this._moveLabel([dx, dy]);
        break;
      }
      case DefaultModeDragType.NativeEditing: {
        // TODO reset if drag out of note
        break;
      }
    }
  }

  onContainerDragEnd() {
    // mindmap
    if (this._draggingSingleMindmap) {
      if (this._hoveredMindMap && this._hoveredMindMap.mergeInfo) {
        const { mergeInfo, mindmap } = this._hoveredMindMap;
        const { node: currentNode, mindmap: currentMindmap } =
          this._draggingSingleMindmap;

        moveSubtree(
          currentMindmap,
          currentNode!,
          mindmap,
          mergeInfo.target,
          mergeInfo.index,
          mergeInfo.layoutType
        );
      } else if (this._draggingSingleMindmap.detach) {
        const { mindmap } = this._draggingSingleMindmap;
        const subtree = mindmap.detach(this._draggingSingleMindmap.node);

        if (subtree) {
          MindmapElementModel.createFromTree(
            subtree,
            mindmap.style,
            mindmap.layoutType,
            this._surface.model
          );
        }
      } else {
        this._draggingSingleMindmap.mindmap.layout();
        this._toBeMoved.forEach(el => el.pop('xywh'));
      }

      this._draggingSingleMindmap.clear?.();
    } else {
      this._toBeMoved.forEach(el => {
        this._doc.transact(() => {
          el.pop('xywh');
        });

        if (el instanceof ConnectorElementModel) {
          el.pop('labelXYWH');
        }

        if (el instanceof MindmapElementModel) {
          el.requestLayout();
        }
      });
    }

    if (this._lock) {
      this._doc.captureSync();
      this._lock = false;
    }

    if (this.edgelessSelectionManager.editing) {
      return;
    }
    const { surface } = this._edgeless;
    this._dragStartPos = [0, 0];
    this._dragLastPos = [0, 0];
    this._selectedBounds = [];
    this._edgeless.service.snap.cleanupAlignables();
    surface.overlays.frame.clear();
    this._toBeMoved = [];
    this._selectedConnector = null;
    this._selectedConnectorLabelBounds = null;
    this._clearSelectingState();
    this._clearMindMapHoverState.forEach(fn => fn());
    this._draggingSingleMindmap = null;
    this.dragType = DefaultModeDragType.None;
  }

  onContainerMouseMove() {
    noop();
  }

  onContainerMouseOut(_: PointerEventState) {
    noop();
  }

  onPressShiftKey(_: boolean) {
    noop();
  }

  onPressSpaceBar(_pressed: boolean): void {
    const { service } = this._edgeless;

    if (this._dragging) {
      if (_pressed) {
        const [lastX, lastY] = this._dragLastPos;
        this._moveSelectionStartPos = [lastX, lastY];

        const [startX, startY] = this._dragStartPos;
        this._moveSelectionDragStartTemp = [startX, startY];
      } else {
        // To reuse space with the same selection, update the drag start to the current start position from dragStartModelCoord.
        const [mX, mY] = this._dragStartModelCoord;

        this._dragStartPos = service.viewport.toViewCoord(mX, mY);

        this._moveSelectionDragStartTemp = [...this._dragStartPos];
      }
    }
  }

  beforeModeSwitch(edgelessTool?: EdgelessTool) {
    if (edgelessTool?.type === 'pan') {
      this._clearLastSelection();
    }
    this._stopAutoPanning();
    this._clearDisposable();
    noop();
  }

  afterModeSwitch() {
    noop();
  }
}

declare global {
  namespace BlockSuite {
    interface EdgelessToolMap {
      default: DefaultToolController;
    }
  }
}
