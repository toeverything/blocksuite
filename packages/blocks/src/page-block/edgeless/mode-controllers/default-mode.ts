import { assertExists, caretRangeFromPoint } from '@blocksuite/global/utils';
import type { PointerEventState } from '@blocksuite/lit';
import {
  ConnectorElement,
  type PhasorElement,
  TextElement,
  type XYWH,
} from '@blocksuite/phasor';
import { deserializeXYWH, getCommonBound, isPointIn } from '@blocksuite/phasor';

import {
  type BlockComponentElement,
  type DefaultMouseMode,
  getBlockElementByModel,
  getClosestBlockElementByPoint,
  getModelByBlockElement,
  getRectByBlockElement,
  handleNativeRangeClick,
  handleNativeRangeDragMove,
  isEmpty,
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
import type { Selectable } from '../selection-manager.js';
import {
  addText,
  getXYWH,
  handleElementChangedEffectForConnector,
  isConnectorAndBindingsAllSelected,
  isPhasorElement,
  isTopLevelBlock,
  mountTextEditor,
  pickBlocksByBound,
  pickTopBlock,
} from '../utils.js';
import { MouseModeController } from './index.js';

export enum DefaultModeDragType {
  /** Moving selected contents */
  ContentMoving = 'content-moving',
  /** Expanding the dragging area, select the content covered inside */
  Selecting = 'selecting',
  /** Native range dragging inside active frame block */
  NativeEditing = 'native-editing',
  /** Default void state */
  None = 'none',
  /** Dragging preview */
  PreviewDragging = 'preview-dragging',
}

export class DefaultModeController extends MouseModeController<DefaultMouseMode> {
  readonly mouseMode = <DefaultMouseMode>{
    type: 'default',
  };
  override enableHover = true;
  dragType = DefaultModeDragType.None;

  private _startRange: Range | null = null;
  private _dragStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private _dragLastPos: { x: number; y: number } = { x: 0, y: 0 };
  private _lock = false;
  // Do not select the text, when click again after activating the frame.
  private _isDoubleClickedOnMask = false;

  override get draggingArea() {
    if (this.dragType === DefaultModeDragType.Selecting) {
      return {
        start: new DOMPoint(this._dragStartPos.x, this._dragStartPos.y),
        end: new DOMPoint(this._dragLastPos.x, this._dragLastPos.y),
      };
    }
    return null;
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

  private _setSelectionState(selected: Selectable[], active: boolean) {
    this._edgeless.slots.selectionUpdated.emit({
      selected,
      active,
    });
  }

  private _handleClickOnSelected(selected: Selectable, e: PointerEventState) {
    this._edgeless.clearSelectedBlocks();

    const currentSelected =
      this._edgeless.selection.blockSelectionState.selected;
    if (currentSelected.length !== 1) {
      this._setSelectionState([selected], false);
      return;
    }

    // phasor element
    if (isPhasorElement(selected)) {
      if (
        this._blockSelectionState.selected[0] instanceof TextElement &&
        this._blockSelectionState.active
      ) {
        return;
      }
      this._setSelectionState([selected], false);
    }
    // frame block
    else {
      if (currentSelected[0] === selected) {
        this._setSelectionState([selected], true);
      } else {
        // issue #1809
        // If the previously selected element is a frameBlock and is in an active state,
        // then the currently clicked frameBlock should also be in an active state when selected.
        const active =
          isTopLevelBlock(currentSelected[0]) &&
          this._edgeless.selection.isActive;
        this._setSelectionState([selected], active);
      }
      this._edgeless.slots.selectedBlocksUpdated.emit([]);
      handleNativeRangeClick(this._page, e);
    }
  }

  private _handleDragMoveEffect(element: Selectable) {
    handleElementChangedEffectForConnector(
      element,
      this._edgeless.selection.blockSelectionState.selected,
      this._edgeless.surface,
      this._page
    );
  }

  private _handleSurfaceDragMove(
    selected: PhasorElement,
    e: PointerEventState
  ) {
    if (!this._lock) {
      this._lock = true;
      this._page.captureSync();
    }
    const { surface } = this._edgeless;
    const { zoom } = surface.viewport;
    const deltaX = this._dragLastPos.x - e.x;
    const deltaY = this._dragLastPos.y - e.y;
    const boundX = selected.x - deltaX / zoom;
    const boundY = selected.y - deltaY / zoom;
    const boundW = selected.w;
    const boundH = selected.h;

    if (
      selected.type !== 'connector' ||
      (selected instanceof ConnectorElement &&
        isConnectorAndBindingsAllSelected(
          selected,
          this._edgeless.selection.blockSelectionState.selected
        ))
    ) {
      surface.setElementBound(selected.id, {
        x: boundX,
        y: boundY,
        w: boundW,
        h: boundH,
      });
    }

    this._handleDragMoveEffect(selected);
  }

  private _handleBlockDragMove(
    block: TopLevelBlockModel,
    e: PointerEventState
  ) {
    const [modelX, modelY, modelW, modelH] = JSON.parse(block.xywh) as XYWH;
    const { zoom } = this._edgeless.surface.viewport;
    const xywh = JSON.stringify([
      modelX + e.delta.x / zoom,
      modelY + e.delta.y / zoom,
      modelW,
      modelH,
    ]);
    this._page.updateBlock(block, { xywh });
    this._handleDragMoveEffect(block);

    // TODO: refactor
    if (this._edgeless.selection.selectedBlocks.length) {
      this._edgeless.slots.selectedBlocksUpdated.emit(
        this._edgeless.selection.selectedBlocks
      );
    }
  }

  private _isInSelectedRect(viewX: number, viewY: number) {
    const { selected } = this._edgeless.selection.blockSelectionState;
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

  private _forceUpdateSelection() {
    // FIXME: force triggering selection change to re-render selection rect
    this._edgeless.slots.selectionUpdated.emit({
      ...this._edgeless.selection.blockSelectionState,
    });
  }

  private _tryDeleteEmptyBlocks() {
    const emptyBlocks = this._blocks.filter(b => isEmpty(b));
    // always keep at least one frame block
    if (emptyBlocks.length === this._blocks.length) {
      emptyBlocks.shift();
    }

    if (emptyBlocks.length) {
      this._page.captureSync();
      emptyBlocks.forEach(b => this._page.deleteBlock(b));
    }
  }

  /** Update drag handle by closest block elements */
  private _updateDragHandle(e: PointerEventState) {
    const block = this._edgeless.selection.blockSelectionState.selected[0];
    if (!block || !isTopLevelBlock(block)) return;
    const frameBlockElement = getBlockElementByModel(block);
    assertExists(frameBlockElement);

    const {
      raw: { clientX, clientY },
    } = e;
    const point = new Point(clientX, clientY);
    const element = getClosestBlockElementByPoint(
      point,
      {
        container: frameBlockElement,
        rect: Rect.fromDOM(frameBlockElement),
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

  onContainerClick(e: PointerEventState) {
    this._tryDeleteEmptyBlocks();

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
      e.raw.target.classList.contains('affine-edgeless-mask')
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

  onContainerDragStart(e: PointerEventState) {
    // Is dragging started from current selected rect
    if (this._isInSelectedRect(e.x, e.y)) {
      this.dragType = this._edgeless.selection.blockSelectionState.active
        ? DefaultModeDragType.NativeEditing
        : DefaultModeDragType.ContentMoving;
    } else {
      const selected = this._pick(e.x, e.y);
      if (selected) {
        this._setSelectionState([selected], false);
        this.dragType = DefaultModeDragType.ContentMoving;
      } else {
        this.dragType = DefaultModeDragType.Selecting;
      }
    }

    this._startRange = caretRangeFromPoint(e.x, e.y);
    this._dragStartPos = { x: e.x, y: e.y };
    this._dragLastPos = { x: e.x, y: e.y };
  }

  onContainerDragMove(e: PointerEventState) {
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
        const bound = { x, y, w: w / zoom, h: h / zoom };

        const blocks = pickBlocksByBound(this._blocks, bound);
        const elements = this._surface.pickByBound(bound);
        this._setSelectionState([...blocks, ...elements], false);
        break;
      }
      case DefaultModeDragType.ContentMoving: {
        this._edgeless.selection.blockSelectionState.selected.forEach(
          element => {
            if (isPhasorElement(element)) {
              this._handleSurfaceDragMove(element, e);
            } else {
              this._handleBlockDragMove(element, e);
            }
          }
        );
        this._forceUpdateSelection();
        break;
      }
      case DefaultModeDragType.NativeEditing: {
        // TODO reset if drag out of frame
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

    if (this._edgeless.selection.isActive) {
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
    this.dragType = DefaultModeDragType.None;
    this._dragStartPos = { x: 0, y: 0 };
    this._dragLastPos = { x: 0, y: 0 };
    this._forceUpdateSelection();
  }

  onContainerMouseMove(e: PointerEventState) {
    if (this.dragType === DefaultModeDragType.PreviewDragging) return;
    this._updateDragHandle(e);
  }

  onContainerMouseOut(_: PointerEventState) {
    noop();
  }
}
