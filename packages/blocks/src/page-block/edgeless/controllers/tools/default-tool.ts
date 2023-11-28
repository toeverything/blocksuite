import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, DisposableGroup, noop } from '@blocksuite/global/utils';
import { Workspace } from '@blocksuite/store';

import {
  type DefaultTool,
  handleNativeRangeAtPoint,
  resetNativeSelection,
  type Selectable,
  type TopLevelBlockModel,
} from '../../../../_common/utils/index.js';
import { getBlockClipboardInfo } from '../../../../_legacy/clipboard/index.js';
import type { FrameBlockModel } from '../../../../frame-block/index.js';
import { EdgelessBlockType } from '../../../../surface-block/edgeless-types.js';
import type { HitTestOptions } from '../../../../surface-block/elements/edgeless-element.js';
import {
  Bound,
  type CanvasElement,
  ConnectorElement,
  GroupElement,
  type IVec,
  ShapeElement,
  TextElement,
  Vec,
} from '../../../../surface-block/index.js';
import { getElementsFromGroup } from '../../../../surface-block/managers/group-manager.js';
import { GET_DEFAULT_TEXT_COLOR } from '../../components/panel/color-panel.js';
import { isConnectorAndBindingsAllSelected } from '../../connector-manager.js';
import { edgelessElementsBound } from '../../utils/bound-utils.js';
import { calPanDelta } from '../../utils/panning-utils.js';
import {
  isCanvasElement,
  isFrameBlock,
  isImageBlock,
  isNoteBlock,
} from '../../utils/query.js';
import {
  addText,
  mountFrameTitleEditor,
  mountGroupTitleEditor,
  mountShapeTextEditor,
  mountTextElementEditor,
} from '../../utils/text.js';
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
  private _lastMoveDelta: IVec = [0, 0];
  private _lock = false;
  // Do not select the text, when click again after activating the note.
  private _isDoubleClickedOnMask = false;
  private _alignBound = new Bound();
  private _selectedBounds: Bound[] = [];
  private _toBeMoved: Selectable[] = [];
  private _frames = new Set<FrameBlockModel>();
  private _autoPanTimer: number | null = null;
  private _dragging = false;
  private _draggingAreaDisposables: DisposableGroup | null = null;

  override get draggingArea() {
    if (this.dragType === DefaultModeDragType.Selecting) {
      const [startX, startY] = this._surface.toViewCoord(
        this._dragStartModelCoord[0],
        this._dragStartModelCoord[1]
      );
      const [endX, endY] = this._surface.toViewCoord(
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
    return this._edgeless.selectionManager;
  }

  get state() {
    return this.selection.state;
  }

  get isActive() {
    return this.selection.state.editing;
  }

  private _pick(x: number, y: number, options?: HitTestOptions) {
    const { surface } = this._edgeless;
    return surface.pickTopWithGroup(
      surface.viewport.toModelCoord(x, y),
      options
    );
  }

  private _setNoneSelectionState() {
    if (this.selection.empty) return;

    this.selection.clear();
    resetNativeSelection(null);
  }

  private _setSelectionState(elements: string[], editing: boolean) {
    this.selection.setSelection({
      elements,
      editing,
    });
  }

  private _handleClickOnSelected(element: Selectable, e: PointerEventState) {
    const { elements, editing } = this.state;
    // click the inner area of active text and note element
    if (editing && elements.length === 1 && elements[0] === element.id) {
      return;
    }

    // handle single note block click
    if (!e.keys.shift && elements.length === 1 && isNoteBlock(element)) {
      if (
        (elements[0] === element.id && !editing) ||
        (editing && elements[0] !== element.id)
      ) {
        // issue #1809
        // If the previously selected element is a noteBlock and is in an active state,
        // then the currently clicked noteBlock should also be in an active state when selected.
        this._setSelectionState([element.id], true);
        requestAnimationFrame(() => {
          handleNativeRangeAtPoint(e.raw.clientX, e.raw.clientY);
        });
        return;
      }
    }

    // hold shift key to multi select or de-select element
    if (e.keys.shift) {
      const selections = [...elements];
      if (elements.includes(element.id)) {
        this._setSelectionState(
          selections.filter(id => id !== element.id),
          false
        );
      } else {
        this._setSelectionState([...selections, element.id], false);
      }
    } else {
      this._setSelectionState([element.id], false);
    }
  }

  private _handleSurfaceDragMove(
    selected: CanvasElement,
    initialBound: Bound,
    delta: IVec
  ) {
    if (!this._lock) {
      this._lock = true;
      this._page.captureSync();
    }

    const { surface } = this._edgeless;
    const bound = initialBound.clone();
    bound.x += delta[0];
    bound.y += delta[1];

    if (selected instanceof ConnectorElement) {
      surface.connector.updateXYWH(selected, bound);
    }

    this._edgeless.updateElementInLocal(selected.id, {
      xywh: bound.serialize(),
    });
  }

  private _handleBlockDragMove(
    block: TopLevelBlockModel,
    initialBound: Bound,
    delta: IVec
  ) {
    const bound = initialBound.clone();
    bound.x += delta[0];
    bound.y += delta[1];

    this._edgeless.updateElementInLocal(block.id, {
      xywh: bound.serialize(),
    });
  }

  private _isInSelectedRect(viewX: number, viewY: number) {
    const selected = this.selection.elements;
    if (!selected.length) return false;

    const commonBound = edgelessElementsBound(selected);

    const [modelX, modelY] = this._surface.toModelCoord(viewX, viewY);
    if (commonBound && commonBound.isPointInBound([modelX, modelY])) {
      return true;
    }
    return false;
  }

  private _isDraggable(element: Selectable) {
    return !(
      element instanceof ConnectorElement &&
      !isConnectorAndBindingsAllSelected(element, this._toBeMoved)
    );
  }

  private _forceUpdateSelection(
    type: DefaultModeDragType,
    dragging = false,
    delta: IVec = [0, 0]
  ) {
    this._edgeless.slots.selectedRectUpdated.emit({
      type: type === DefaultModeDragType.Selecting ? 'select' : 'move',
      delta: Vec.toPoint(delta),
      dragging,
    });
  }

  onContainerPointerDown(): void {
    noop();
  }

  onContainerClick(e: PointerEventState) {
    const selected = this._pick(e.x, e.y);

    if (selected) {
      this._handleClickOnSelected(selected, e);
    } else {
      this._setNoneSelectionState();
    }

    this._isDoubleClickedOnMask = false;
  }

  onContainerContextMenu() {
    // repairContextMenuRange(e);
    noop();
  }

  onContainerDblClick(e: PointerEventState) {
    if (this._page.readonly) {
      const viewport = this._surface.viewport;
      if (viewport.zoom === 1) {
        // Fit to Screen
        const { centerX, centerY, zoom } = this._edgeless.getFitToScreenData();
        viewport.setViewport(zoom, [centerX, centerY], true);
      } else {
        // Zoom to 100% and Center
        const [x, y] = viewport.toModelCoord(e.x, e.y);
        viewport.setViewport(1, [x, y], true);
      }
      return;
    }

    const selected = this._pick(e.x, e.y, {
      pierce: true,
      expand: 10,
    });
    if (!selected) {
      const key = 'blocksuite:' + this._edgeless.page.id + ':edgelessText';
      const textData = sessionStorage.getItem(key);
      const color =
        textData && JSON.parse(textData).color
          ? JSON.parse(textData).color
          : GET_DEFAULT_TEXT_COLOR();
      addText(this._edgeless, e, color);
      return;
    } else {
      const [modelX, modelY] = this._edgeless.surface.viewport.toModelCoord(
        e.x,
        e.y
      );
      if (selected instanceof TextElement) {
        mountTextElementEditor(selected, this._edgeless, {
          x: modelX,
          y: modelY,
        });
        return;
      }
      if (selected instanceof ShapeElement) {
        mountShapeTextEditor(selected, this._edgeless);
        return;
      }
      if (isFrameBlock(selected)) {
        mountFrameTitleEditor(selected, this._edgeless);
        return;
      }
      if (
        selected instanceof GroupElement &&
        selected.titleBound.containsPoint([modelX, modelY])
      ) {
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
      return this.state.editing
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
    const elements = (await Promise.all(
      this._toBeMoved.map(async selected => {
        return await this._cloneSelected(selected);
      })
    )) as Selectable[];
    this._toBeMoved = elements;
    this._setSelectionState(
      elements.map(el => el.id),
      false
    );
  }

  private async _cloneSelected(selected: Selectable) {
    const { _edgeless, _surface } = this;
    if (isNoteBlock(selected)) {
      const noteService = _edgeless.getService(EdgelessBlockType.NOTE);
      const id = _surface.addElement(
        EdgelessBlockType.NOTE,
        {
          xywh: selected.xywh,
          edgeless: selected.edgeless,
          background: selected.background,
          hidden: selected.hidden,
        },
        this._page.root?.id
      );
      const note = this._page.getBlockById(id);
      assertExists(note);
      const serializedBlock = (await getBlockClipboardInfo(selected)).json;
      await noteService.json2Block(note, serializedBlock.children);
      return _surface.pickById(id);
    } else if (isFrameBlock(selected)) {
      const frameService = _edgeless.getService(EdgelessBlockType.FRAME);
      const json = frameService.block2Json(selected);
      const id = this._surface.addElement(EdgelessBlockType.FRAME, {
        xywh: json.xywh,
        title: new Workspace.Y.Text(json.title),
        background: json.background,
      });
      return _surface.pickById(id);
    } else if (isImageBlock(selected)) {
      const imageService = _edgeless.getService(EdgelessBlockType.IMAGE);
      const json = imageService.block2Json(selected, []);
      const id = this._surface.addElement(
        EdgelessBlockType.IMAGE,
        {
          xywh: json.xywh,
          sourceId: json.sourceId,
          rotate: json.rotate,
        },
        this._surface.model
      );
      return _surface.pickById(id);
    } else {
      const id = _surface.addElement(
        selected.type,
        selected.serialize() as unknown as Record<string, unknown>
      );
      return _surface.pickById(id);
    }
  }

  private _addFrames() {
    this.selection.elements.forEach(ele => {
      if (isFrameBlock(ele)) {
        this._frames.add(ele);
      } else {
        const frame = this._edgeless.surface.frame.selectFrame([ele]);
        if (frame) {
          this._frames.add(frame as FrameBlockModel);
        }
      }
    });
  }

  private _updateSelectingState = () => {
    const { surface } = this._edgeless;
    const { viewport } = surface;
    const startX = this._dragStartModelCoord[0];
    const startY = this._dragStartModelCoord[1];
    // Should convert the last drag position to model coordinate
    const [curX, curY] = viewport.toModelCoord(
      this._dragLastPos[0],
      this._dragLastPos[1]
    );
    const x = Math.min(startX, curX);
    const y = Math.min(startY, curY);

    const w = Math.abs(startX - curX);
    const h = Math.abs(startY - curY);
    const bound = new Bound(x, y, w, h);

    const elements = surface.pickByBound(bound);
    this._setSelectionState([...elements.map(element => element.id)], false);

    // Record the last model coordinate for dragging area updating
    this._dragLastModelCoord = [curX, curY];
    this._forceUpdateSelection(this.dragType, true);
    this._edgeless.slots.draggingAreaUpdated.emit();
  };

  private _panViewport = (delta: IVec) => {
    const { viewport } = this._edgeless.surface;
    viewport.applyDeltaCenter(delta[0], delta[1]);
  };

  private _stopAutoPanning = () => {
    if (this._autoPanTimer) {
      clearTimeout(this._autoPanTimer);
      this._autoPanTimer = null;
    }
  };

  private _clearDraggingAreaDisposable = () => {
    if (this._draggingAreaDisposables) {
      this._draggingAreaDisposables.dispose();
      this._draggingAreaDisposables = null;
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
    this._clearDraggingAreaDisposable();
    this._dragging = false;
    this._dragLastPos = [0, 0];
    this._dragStartModelCoord = [0, 0];
    this._dragLastModelCoord = [0, 0];
    this._edgeless.slots.draggingAreaUpdated.emit();
  };

  async onContainerDragStart(e: PointerEventState) {
    // Determine the drag type based on the current state and event
    let dragType = this._determineDragType(e);

    this.prepareMovedElements();
    // If alt key is pressed and content is moving, clone the content
    if (e.keys.alt && dragType === DefaultModeDragType.ContentMoving) {
      dragType = DefaultModeDragType.AltCloning;
      await this._cloneContent();
    }

    this._addFrames();
    // Set up drag state
    this.initializeDragState(e, dragType);
  }

  private prepareMovedElements() {
    const elements = this.selection.elements;
    const toBeMoved = new Set(elements);
    elements.forEach(element => {
      if (isFrameBlock(element)) {
        this._surface.frame
          .getElementsInFrame(element)
          .forEach(ele => toBeMoved.add(ele));
      } else if (element instanceof GroupElement) {
        getElementsFromGroup(element).forEach(ele => toBeMoved.add(ele));
      }
    });
    this._toBeMoved = Array.from(toBeMoved);
  }

  initializeDragState(e: PointerEventState, dragType: DefaultModeDragType) {
    const { x, y } = e;
    this.dragType = dragType;
    this._dragging = true;
    this._dragStartPos = [x, y];
    this._dragLastPos = [x, y];
    const [startX, startY] = this._surface.toModelCoord(x, y);
    this._dragStartModelCoord = [startX, startY];
    this._dragLastModelCoord = [startX, startY];

    this._alignBound = this._surface.snap.setupAlignables(this._toBeMoved);

    this._selectedBounds = this._toBeMoved.map(element =>
      Bound.deserialize(element.xywh)
    );

    // If the drag type is selecting, set up the dragging area disposable group
    // If the viewport updates when dragging, should update the dragging area and selection
    if (this.dragType === DefaultModeDragType.Selecting) {
      this._clearDraggingAreaDisposable();

      this._draggingAreaDisposables = new DisposableGroup();
      this._draggingAreaDisposables.add(
        this._edgeless.slots.viewportUpdated.on(() => {
          if (
            this.dragType === DefaultModeDragType.Selecting &&
            this._dragging &&
            !this._autoPanTimer
          ) {
            this._updateSelectingState();
          }
        })
      );
    }
  }

  onContainerDragMove(e: PointerEventState) {
    const { surface } = this._edgeless;
    const { viewport } = surface;
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

        const dx = (e.x - this._dragStartPos[0]) / zoom;
        const dy = (e.y - this._dragStartPos[1]) / zoom;
        const curBound = this._alignBound.clone();
        curBound.x += dx;
        curBound.y += dy;

        const alignRst = surface.snap.align(curBound);
        const delta = [dx + alignRst.dx, dy + alignRst.dy];

        this._toBeMoved.forEach((element, index) => {
          if (isCanvasElement(element)) {
            if (!this._isDraggable(element)) return;
            this._handleSurfaceDragMove(
              element,
              this._selectedBounds[index],
              delta
            );
          } else {
            this._handleBlockDragMove(
              element,
              this._selectedBounds[index],
              delta
            );
          }
        });
        const frame = surface.frame.selectFrame(this._toBeMoved);
        frame
          ? surface.frame.setHighlight(frame as FrameBlockModel)
          : surface.frame.clearHighlight();

        this._forceUpdateSelection(
          this.dragType,
          true,
          Vec.sub(delta, this._lastMoveDelta)
        );
        this._lastMoveDelta = delta;
        break;
      }
      case DefaultModeDragType.NativeEditing: {
        // TODO reset if drag out of note
        break;
      }
    }
  }

  onContainerDragEnd() {
    this._edgeless.applyLocalRecord(this._toBeMoved.map(ele => ele.id));

    if (this._lock) {
      this._page.captureSync();
      this._lock = false;
    }

    if (this.isActive) {
      return;
    }
    const { surface } = this._edgeless;
    this._dragStartPos = [0, 0];
    this._dragLastPos = [0, 0];
    this._selectedBounds = [];
    this._lastMoveDelta = [0, 0];
    surface.snap.cleanupAlignables();
    surface.frame.clearHighlight();
    this._addFrames();
    this._frames.clear();
    this._toBeMoved = [];
    this._forceUpdateSelection(this.dragType);
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

  beforeModeSwitch() {
    this._stopAutoPanning();
    this._clearDraggingAreaDisposable();
    noop();
  }

  afterModeSwitch() {
    noop();
  }
}
