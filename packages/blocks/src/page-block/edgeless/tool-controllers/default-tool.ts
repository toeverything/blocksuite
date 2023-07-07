import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, caretRangeFromPoint } from '@blocksuite/global/utils';
import {
  Bound,
  ConnectorElement,
  deserializeXYWH,
  getCommonBound,
  isPointIn,
  type PhasorElement,
  type PhasorElementType,
  type SurfaceManager,
  TextElement,
} from '@blocksuite/phasor';

import {
  type BlockComponentElement,
  type DefaultTool,
  getBlockElementByModel,
  getClosestBlockElementByPoint,
  getModelByBlockElement,
  getRectByBlockElement,
  handleNativeRangeAtPoint,
  handleNativeRangeDragMove,
  noop,
  Point,
  Rect,
  resetNativeSelection,
  type TopLevelBlockModel,
} from '../../../__internal__/index.js';
import { showFormatQuickBar } from '../../../components/format-quick-bar/index.js';
import { showFormatQuickBarByClicks } from '../../index.js';
import {
  calcCurrentSelectionPosition,
  getNativeSelectionMouseDragInfo,
} from '../../utils/position.js';
import { isConnectorAndBindingsAllSelected } from '../connector-manager.js';
import {
  getXYWH,
  isPhasorElement,
  isTopLevelBlock,
  pickBlocksByBound,
  pickTopBlock,
} from '../utils/query.js';
import type { Selectable } from '../utils/selection-manager.js';
import { addText, mountTextEditor } from '../utils/text.js';
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

  private _startRange: Range | null = null;
  private _dragStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private _dragLastPos: { x: number; y: number } = { x: 0, y: 0 };
  private _lastMoveDelta = { x: 0, y: 0 };
  private _lock = false;
  // Do not select the text, when click again after activating the note.
  private _isDoubleClickedOnMask = false;
  private _alignBound = new Bound();
  private _selectedBounds: Bound[] = [];

  override get draggingArea() {
    if (this.dragType === DefaultModeDragType.Selecting) {
      return {
        start: new DOMPoint(this._dragStartPos.x, this._dragStartPos.y),
        end: new DOMPoint(this._dragLastPos.x, this._dragLastPos.y),
      };
    }
    return null;
  }

  get selectedBlocks() {
    return this._edgeless.selection.selectedBlocks;
  }

  get state() {
    return this._edgeless.selection.state;
  }

  get isActive() {
    return this._edgeless.selection.state.active;
  }

  private _pick(x: number, y: number) {
    const { surface } = this._edgeless;
    const [modelX, modelY] = surface.viewport.toModelCoord(x, y);
    const selectedShape = surface.pickTop(modelX, modelY);
    return selectedShape
      ? selectedShape
      : pickTopBlock(this._blocks, modelX, modelY);
  }

  private _setNoneSelectionState() {
    this._edgeless.slots.selectionUpdated.emit({ selected: [], active: false });
    resetNativeSelection(null);
  }

  private _setSelectionState(
    selected: Selectable[],
    active: boolean,
    by = false
  ) {
    const state: {
      selected: Selectable[];
      active: boolean;
      by?: 'selecting';
    } = {
      selected,
      active,
    };
    if (by) state.by = 'selecting';
    this._edgeless.slots.selectionUpdated.emit(state);
  }

  private _handleClickOnSelected(element: Selectable, e: PointerEventState) {
    const { selected, active } = this.state;
    this._edgeless.clearSelectedBlocks();
    // click the inner area of active text and note element
    if (active && selected.length === 1 && selected[0] === element) {
      handleNativeRangeAtPoint(e.raw.clientX, e.raw.clientY);
      return;
    }

    // handle single note block click
    if (!e.keys.shift && selected.length === 1 && isTopLevelBlock(element)) {
      if (
        (selected[0] === element && !active) ||
        (active && selected[0] !== element)
      ) {
        // issue #1809
        // If the previously selected element is a noteBlock and is in an active state,
        // then the currently clicked noteBlock should also be in an active state when selected.
        this._setSelectionState([element], true);
        handleNativeRangeAtPoint(e.raw.clientX, e.raw.clientY);
        this._edgeless.slots.selectedBlocksUpdated.emit([]);
        return;
      }
    }

    // hold shift key to multi select or de-select element
    if (e.keys.shift) {
      const selections = [...selected];
      if (selected.includes(element)) {
        this._setSelectionState(
          selections.filter(item => item !== element),
          false
        );
      } else {
        this._setSelectionState([...selections, element], false);
      }
    } else {
      this._setSelectionState([element], false);
    }
  }

  private _handleSurfaceDragMove(
    selected: PhasorElement,
    initialBound: Bound,
    delta: { x: number; y: number }
  ) {
    if (!this._lock) {
      this._lock = true;
      this._page.captureSync();
    }

    const { surface } = this._edgeless;
    const bound = initialBound.clone();
    bound.x += delta.x;
    bound.y += delta.y;

    if (selected instanceof ConnectorElement) {
      this._edgeless.connector.updateXYWH(selected, bound);
    }

    surface.setElementBound(selected.id, bound);
  }

  private _handleBlockDragMove(
    block: TopLevelBlockModel,
    initialBound: Bound,
    delta: { x: number; y: number }
  ) {
    const bound = initialBound.clone();
    bound.x += delta.x;
    bound.y += delta.y;

    this._page.updateBlock(block, { xywh: bound.serialize() });

    // TODO: refactor
    if (this.selectedBlocks.length) {
      this._edgeless.slots.selectedBlocksUpdated.emit(this.selectedBlocks);
    }
  }

  private _isInSelectedRect(viewX: number, viewY: number) {
    const { selected } = this.state;
    if (!selected.length) return false;

    const commonBound = getCommonBound(
      selected.map(element => {
        if (isTopLevelBlock(element)) {
          const [x, y, w, h] = deserializeXYWH(getXYWH(element));
          return {
            x,
            y,
            w,
            h,
          };
        }
        return element;
      })
    );
    const [modelX, modelY] = this._surface.toModelCoord(viewX, viewY);
    if (commonBound && isPointIn(commonBound, modelX, modelY)) {
      return true;
    }
    return false;
  }

  private _isDraggable(element: Selectable) {
    return !(
      element instanceof ConnectorElement &&
      !isConnectorAndBindingsAllSelected(element, this.state.selected)
    );
  }

  private _forceUpdateSelection(
    type: DefaultModeDragType,
    dragging = false,
    delta = { x: 0, y: 0 }
  ) {
    this._edgeless.slots.selectedRectUpdated.emit({
      type: type === DefaultModeDragType.Selecting ? 'select' : 'move',
      delta,
      dragging,
    });
  }

  /** Update drag handle by closest block elements */
  private _updateDragHandle(e: PointerEventState) {
    const block = this.state.selected[0];
    if (!block || !isTopLevelBlock(block)) return;
    const noteBlockElement = getBlockElementByModel(block);
    assertExists(noteBlockElement);

    const {
      raw: { clientX, clientY },
    } = e;
    const point = new Point(clientX, clientY);
    const element = getClosestBlockElementByPoint(
      point,
      {
        container: noteBlockElement,
        rect: Rect.fromDOM(noteBlockElement),
      },
      this._edgeless.surface.viewport.zoom
    );
    let hoverEditingState = null;
    if (element) {
      hoverEditingState = {
        element: element as BlockComponentElement,
        model: getModelByBlockElement(element),
        rect: getRectByBlockElement(element),
      };
      this._edgeless.components.dragHandle?.onContainerMouseMove(
        e,
        hoverEditingState
      );
    }
  }

  onContainerPointerDown(e: PointerEventState): void {
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

  onContainerContextMenu(e: PointerEventState) {
    // repairContextMenuRange(e);
    noop();
  }

  onContainerDblClick(e: PointerEventState) {
    const selected = this._pick(e.x, e.y);
    if (!selected) {
      addText(this._edgeless, e);
      return;
    } else {
      if (selected instanceof TextElement) {
        mountTextEditor(selected, this._edgeless);
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

    showFormatQuickBarByClicks('double', e, this._page, this._edgeless);
  }

  onContainerTripleClick(e: PointerEventState) {
    if (this._isDoubleClickedOnMask) return;
    showFormatQuickBarByClicks('triple', e, this._page, this._edgeless);
  }

  private _determineDragType(e: PointerEventState): DefaultModeDragType {
    // Is dragging started from current selected rect
    if (this._isInSelectedRect(e.x, e.y)) {
      return this.state.active
        ? DefaultModeDragType.NativeEditing
        : DefaultModeDragType.ContentMoving;
    } else {
      const selected = this._pick(e.x, e.y);
      if (selected) {
        this._setSelectionState([selected], false);
        return DefaultModeDragType.ContentMoving;
      } else {
        return DefaultModeDragType.Selecting;
      }
    }
  }

  private async _cloneContent(e: PointerEventState) {
    this._lock = true;
    const { surface } = this._edgeless;
    const elements = (await Promise.all(
      this.state.selected.map(async selected => {
        return await this._cloneSelected(selected, surface);
      })
    )) as Selectable[];

    this._setSelectionState(elements, false);
  }

  private async _cloneSelected(selected: Selectable, surface: SurfaceManager) {
    if (isTopLevelBlock(selected)) {
      const noteService = this._edgeless.getService('affine:note');
      const id = this._page.addBlock(
        'affine:note',
        { xywh: selected.xywh },
        this._page.root?.id
      );
      const note = this._page.getBlockById(id);

      assertExists(note);
      await noteService.json2Block(
        note,
        noteService.block2Json(selected).children
      );
      return this._page.getBlockById(id);
    } else {
      const id = surface.addElement(
        selected.type as keyof PhasorElementType,
        selected.serialize() as unknown as Record<string, unknown>
      );
      return surface.pickById(id);
    }
  }

  async onContainerDragStart(e: PointerEventState) {
    // Determine the drag type based on the current state and event
    let dragType = this._determineDragType(e);

    // If alt key is pressed and content is moving, clone the content
    if (e.keys.alt && dragType === DefaultModeDragType.ContentMoving) {
      dragType = DefaultModeDragType.AltCloning;
      await this._cloneContent(e);
    }

    // Set up drag state
    this.initializeDragState(e, dragType);
  }

  initializeDragState(e: PointerEventState, dragType: DefaultModeDragType) {
    const { x, y } = e;
    this.dragType = dragType;
    this._startRange = caretRangeFromPoint(x, y);
    this._dragStartPos = { x, y };
    this._dragLastPos = { x, y };

    this._alignBound = this._edgeless.snap.setupAlignables(this.state.selected);

    this._selectedBounds = this.state.selected.map(element =>
      Bound.deserialize(element.xywh)
    );
  }

  onContainerDragMove(e: PointerEventState) {
    const zoom = this._edgeless.surface.viewport.zoom;
    switch (this.dragType) {
      case DefaultModeDragType.Selecting: {
        const startX = this._dragStartPos.x;
        const startY = this._dragStartPos.y;
        const viewX = Math.min(startX, e.x);
        const viewY = Math.min(startY, e.y);

        const [x, y] = this._surface.toModelCoord(viewX, viewY);
        const w = Math.abs(startX - e.x);
        const h = Math.abs(startY - e.y);
        const { zoom } = this._surface.viewport;
        const bound = new Bound(x, y, w / zoom, h / zoom);

        const blocks = pickBlocksByBound(this._blocks, bound);
        const elements = this._surface.pickByBound(bound);
        this._setSelectionState([...blocks, ...elements], false, true);

        this._forceUpdateSelection(this.dragType, true);
        break;
      }
      case DefaultModeDragType.AltCloning:
      case DefaultModeDragType.ContentMoving: {
        if (
          this.state.selected.every(ele => {
            return !this._isDraggable(ele);
          })
        ) {
          return;
        }

        const dx = (e.x - this._dragStartPos.x) / zoom;
        const dy = (e.y - this._dragStartPos.y) / zoom;
        const curBound = this._alignBound.clone();
        curBound.x += dx;
        curBound.y += dy;

        const alignRst = this._edgeless.snap.align(curBound);
        const delta = {
          x: dx + alignRst.dx,
          y: dy + alignRst.dy,
        };

        this.state.selected.forEach((element, index) => {
          if (isPhasorElement(element)) {
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

        this._forceUpdateSelection(this.dragType, true, {
          x: delta.x - this._lastMoveDelta.x,
          y: delta.y - this._lastMoveDelta.y,
        });
        this._lastMoveDelta = delta;
        break;
      }
      case DefaultModeDragType.NativeEditing: {
        // TODO reset if drag out of note
        handleNativeRangeDragMove(this._startRange, e);
        break;
      }
    }
    this._dragLastPos = {
      x: e.x,
      y: e.y,
    };
  }

  onContainerDragEnd(e: PointerEventState) {
    if (this._lock) {
      this._page.captureSync();
      this._lock = false;
    }

    if (this.isActive) {
      const { direction, selectedType } = getNativeSelectionMouseDragInfo(e);
      if (selectedType === 'Caret') {
        // If nothing is selected, then we should not show the format bar
        return;
      }
      showFormatQuickBar({
        page: this._page,
        container: this._edgeless,
        direction,
        anchorEl: {
          getBoundingClientRect: () => {
            return calcCurrentSelectionPosition(direction);
          },
        },
      });
    }

    this._forceUpdateSelection(this.dragType);
    this.dragType = DefaultModeDragType.None;
    this._dragStartPos = { x: 0, y: 0 };
    this._dragLastPos = { x: 0, y: 0 };
    this._selectedBounds = [];
    this._lastMoveDelta = { x: 0, y: 0 };
    this._edgeless.snap.cleanupAlignables();
  }

  onContainerMouseMove(e: PointerEventState) {
    if (this.dragType === DefaultModeDragType.PreviewDragging) return;
    this._updateDragHandle(e);
  }

  onContainerMouseOut(_: PointerEventState) {
    noop();
  }

  onPressShiftKey(_: boolean) {
    noop();
  }

  beforeModeSwitch() {
    noop();
  }

  afterModeSwitch() {
    noop();
  }
}
