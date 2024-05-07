import type { PointerEventState } from '@blocksuite/block-std';
import { DisposableGroup, noop } from '@blocksuite/global/utils';

import {
  asyncFocusRichText,
  buildPath,
  type EdgelessTool,
} from '../../../../_common/utils/index.js';
import {
  type DefaultTool,
  handleNativeRangeAtPoint,
  resetNativeSelection,
  type Selectable,
} from '../../../../_common/utils/index.js';
import { clamp } from '../../../../_common/utils/math.js';
import type { FrameBlockModel } from '../../../../frame-block/index.js';
import type { NoteBlockModel } from '../../../../note-block/note-model.js';
import { GroupLikeModel } from '../../../../surface-block/element-model/base.js';
import {
  GroupElementModel,
  MindmapElementModel,
  ShapeElementModel,
  TextElementModel,
} from '../../../../surface-block/element-model/index.js';
import {
  Bound,
  type CanvasElement,
  ConnectorElementModel,
  type IVec,
} from '../../../../surface-block/index.js';
import { isConnectorAndBindingsAllSelected } from '../../../../surface-block/managers/connector-manager.js';
import type { EdgelessModel, HitTestOptions } from '../../type.js';
import { edgelessElementsBound } from '../../utils/bound-utils.js';
import { calPanDelta } from '../../utils/panning-utils.js';
import {
  isCanvasElement,
  isFrameBlock,
  isNoteBlock,
} from '../../utils/query.js';
import {
  addText,
  mountFrameTitleEditor,
  mountGroupTitleEditor,
  mountShapeTextEditor,
  mountTextElementEditor,
} from '../../utils/text.js';
import { prepareClipboardData } from '../clipboard.js';
import { EdgelessToolController } from './index.js';

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
}

export class DefaultToolController extends EdgelessToolController<DefaultTool> {
  readonly tool = <DefaultTool>{
    type: 'default',
  };
  override enableHover = true;
  dragType = DefaultModeDragType.None;

  private _dragStartPos: IVec = [0, 0];
  private _dragLastPos: IVec = [0, 0];
  private _dragStartModelCoord: IVec = [0, 0];
  private _dragLastModelCoord: IVec = [0, 0];
  private _lock = false;
  // Do not select the text, when click again after activating the note.
  private _isDoubleClickedOnMask = false;
  private _alignBound = new Bound();
  private _selectedBounds: Bound[] = [];
  private _toBeMoved: EdgelessModel[] = [];
  private _autoPanTimer: number | null = null;
  private _dragging = false;
  private _wheeling = false;
  private _disposables: DisposableGroup | null = null;

  // For moving selection with space with mouse
  private _moveSelectionStartPos: IVec = [0, 0];
  private _moveSelectionDragStartTemp: IVec = [0, 0];

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

  get selection() {
    return this._edgeless.service.selection;
  }

  get state() {
    return this.selection.selections;
  }

  get _zoom() {
    return this._edgeless.service.viewport.zoom;
  }

  get _readonly() {
    return this._edgeless.doc.readonly;
  }

  private _pick(x: number, y: number, options?: HitTestOptions) {
    const service = this._service;
    const modelPos = service.viewport.toModelCoord(x, y);
    const group = service.pickElementInGroup(modelPos[0], modelPos[1], options);

    if (group instanceof MindmapElementModel) {
      const picked = service.pickElement(modelPos[0], modelPos[1], {
        ...((options ?? {}) as HitTestOptions),
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

  private _setNoneSelectionState() {
    this.selection.clear();
    resetNativeSelection(null);
  }

  private _setSelectionState(elements: string[], editing: boolean) {
    this.selection.set({
      elements,
      editing,
    });
  }

  private _addEmptyParagraphBlock(note: NoteBlockModel) {
    const blockId = this._doc.addBlock(
      'affine:paragraph',
      { type: 'text' },
      note.id
    );
    if (blockId) {
      asyncFocusRichText(this._edgeless.host, blockId)?.catch(console.error);
    }
  }

  private _handleClickAtNoteBlock(note: NoteBlockModel, e: PointerEventState) {
    // check if note has children blocks, if not, add a paragraph block and focus on it
    if (note.children.length === 0) {
      this._addEmptyParagraphBlock(note);
    } else {
      // handleNativeRangeAtPoint(e.raw.clientX, e.raw.clientY);
      const noteBlockElement = this._edgeless.host.view.viewFromPath(
        'block',
        buildPath(note)
      );
      if (noteBlockElement) {
        const rect = noteBlockElement.getBoundingClientRect();
        const offsetY = 16 * this._zoom;
        const offsetX = 2 * this._zoom;
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
        return;
      }

      handleNativeRangeAtPoint(e.raw.clientX, e.raw.clientY);
    }
  }

  private _handleClickOnSelected(element: EdgelessModel, e: PointerEventState) {
    if (this._readonly) return;

    const { selectedIds, selections } = this.selection;
    const editing = selections[0]?.editing ?? false;

    // click the inner area of active text and note element
    if (selectedIds.length === 1 && selectedIds[0] === element.id && editing) {
      if (isNoteBlock(element) && element.children.length === 0) {
        this._addEmptyParagraphBlock(element);
      }
      return;
    }

    // handle single note block click
    if (!e.keys.shift && selectedIds.length === 1 && isNoteBlock(element)) {
      if (
        (selectedIds[0] === element.id && !editing) ||
        (editing && selectedIds[0] !== element.id)
      ) {
        // issue #1809
        // If the previously selected element is a noteBlock and is in an active state,
        // then the currently clicked noteBlock should also be in an active state when selected.
        this._setSelectionState([element.id], true);
        this._edgeless.updateComplete
          .then(() => this._handleClickAtNoteBlock(element, e))
          .catch(console.error);
        return;
      }
    }

    this.selection.set({
      // hold shift key to multi select or de-select element
      elements: e.keys.shift
        ? this.selection.has(element.id)
          ? selectedIds.filter(id => id !== element.id)
          : [...selectedIds, element.id]
        : [element.id],
      editing: false,
    });
  }

  private _getSnapAxis(dx: number, dy: number): 'x' | 'y' {
    const angle = Math.abs(Math.atan2(dy, dx));
    return angle < Math.PI / 4 || angle > 3 * (Math.PI / 4) ? 'x' : 'y';
  }

  private _handleSurfaceDragMove(selected: CanvasElement, bound: Bound) {
    if (!this._lock) {
      this._lock = true;
      this._doc.captureSync();
    }

    if (selected instanceof ConnectorElementModel) {
      selected.moveTo(bound);
    }

    this._service.updateElement(selected.id, {
      xywh: bound.serialize(),
    });
  }

  private _handleBlockDragMove(block: EdgelessModel, bound: Bound) {
    this._service.updateElement(block.id, {
      xywh: bound.serialize(),
    });
  }

  private _isInSelectedRect(viewX: number, viewY: number) {
    const selected = this.selection.elements;
    if (!selected.length) return false;

    const commonBound = edgelessElementsBound(selected);

    const [modelX, modelY] = this._service.viewport.toModelCoord(viewX, viewY);
    if (commonBound && commonBound.isPointInBound([modelX, modelY])) {
      return true;
    }
    return false;
  }

  private _isDraggable(element: Selectable) {
    return !(
      element instanceof ConnectorElementModel &&
      !isConnectorAndBindingsAllSelected(element, this._toBeMoved)
    );
  }

  onContainerPointerDown(): void {
    noop();
  }

  onContainerClick(e: PointerEventState) {
    const selected = this._pick(e.x, e.y, {
      ignoreTransparent: true,
    });

    if (selected) {
      this._handleClickOnSelected(selected, e);
    } else if (!e.keys.shift) {
      this._setNoneSelectionState();
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
      addText(this._edgeless, e);
      return;
    } else {
      const [modelX, modelY] = this._service.viewport.toModelCoord(e.x, e.y);
      if (selected instanceof TextElementModel) {
        mountTextElementEditor(selected, this._edgeless, {
          x: modelX,
          y: modelY,
        });
        return;
      }
      if (selected instanceof ShapeElementModel) {
        mountShapeTextEditor(selected, this._edgeless);
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

  private _determineDragType(e: PointerEventState): DefaultModeDragType {
    // Is dragging started from current selected rect
    if (this._isInSelectedRect(e.x, e.y)) {
      return this.selection.editing
        ? DefaultModeDragType.NativeEditing
        : DefaultModeDragType.ContentMoving;
    } else {
      const selected = this._pick(e.x, e.y);
      if (selected) {
        this._setSelectionState([selected.id], false);
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

    const data = JSON.parse(
      JSON.stringify(await prepareClipboardData(this._toBeMoved, _edgeless.std))
    );

    const bound = edgelessElementsBound(this._toBeMoved);
    const [elements, blocks] =
      clipboardController.createElementsFromClipboardData(
        data as Record<string, unknown>[],
        bound.center
      );

    this._toBeMoved = [...elements, ...blocks];
    this._setSelectionState(
      this._toBeMoved.map(el => el.id),
      false
    );
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
      tools.shiftKey ? [...elements, ...selection.elements] : elements
    );

    this._setSelectionState(
      Array.from(set).map(element => element.id),
      false
    );

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
    if (this.selection.empty) {
      this.selection.clearLast();
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

  async onContainerDragStart(e: PointerEventState) {
    if (this.selection.editing) return;
    // Determine the drag type based on the current state and event
    let dragType = this._determineDragType(e);

    this.prepareMovedElements();
    // If alt key is pressed and content is moving, clone the content
    if (e.keys.alt && dragType === DefaultModeDragType.ContentMoving) {
      dragType = DefaultModeDragType.AltCloning;
      await this._cloneContent();
    }
    this._filterConnectedConnector();

    this._toBeMoved.forEach(ele => {
      ele.stash('xywh');
    });

    // Connector needs to be updated first
    this._toBeMoved.sort((a, _) =>
      a instanceof ConnectorElementModel ? -1 : 1
    );
    // Set up drag state
    this.initializeDragState(e, dragType);
  }

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

  private prepareMovedElements() {
    const elements = this.selection.elements;
    const toBeMoved = new Set(elements);
    elements.forEach(element => {
      if (isFrameBlock(element)) {
        this._edgeless.service.frame
          .getElementsInFrame(element)
          .forEach(ele => toBeMoved.add(ele));
      } else if (element instanceof GroupLikeModel) {
        element.decendants().forEach(ele => toBeMoved.add(ele));
      }
    });
    this._toBeMoved = Array.from(toBeMoved);
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

    this._alignBound = this._edgeless.service.snap.setupAlignables(
      this._toBeMoved
    );

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
      const isXAxis = this._getSnapAxis(delta[0], delta[1]) === 'x';
      delta[isXAxis ? 1 : 0] = 0;
    }

    this._toBeMoved.forEach((element, index) => {
      const isGraphicElement = isCanvasElement(element);

      if (isGraphicElement && !this._isDraggable(element)) return;

      let bound = this._selectedBounds[index];
      if (shouldClone) bound = bound.clone();

      bound.x += delta[0];
      bound.y += delta[1];

      if (isGraphicElement) {
        this._handleSurfaceDragMove(element, bound);
      } else {
        this._handleBlockDragMove(element, bound);
      }
    });

    const frame = this._edgeless.service.frame.selectFrame(this._toBeMoved);
    frame
      ? this._surface.overlays.frame.highlight(frame as FrameBlockModel)
      : this._surface.overlays.frame.clear();
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
      case DefaultModeDragType.NativeEditing: {
        // TODO reset if drag out of note
        break;
      }
    }
  }

  onContainerDragEnd() {
    this._doc.transact(() => {
      this._toBeMoved.forEach(el => {
        el.pop('xywh');

        if (el.group instanceof MindmapElementModel) {
          el.group.requestLayout();
        }
      });
    });

    if (this._lock) {
      this._doc.captureSync();
      this._lock = false;
    }

    if (this.selection.editing) {
      return;
    }
    const { surface } = this._edgeless;
    this._dragStartPos = [0, 0];
    this._dragLastPos = [0, 0];
    this._selectedBounds = [];
    this._edgeless.service.snap.cleanupAlignables();
    surface.overlays.frame.clear();
    this._toBeMoved = [];
    this._clearSelectingState();
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
