import {
  type BlockComponentElement,
  type DefaultMouseMode,
  getBlockElementByModel,
  getClosestBlockElementByPoint,
  getModelByBlockElement,
  getSelectedStateRectByBlockElement,
  handleNativeRangeClick,
  handleNativeRangeDragMove,
  noop,
  Point,
  Rect,
  resetNativeSelection,
  type SelectionEvent,
  type TopLevelBlockModel,
} from '@blocksuite/blocks/std';
import { Rectangle, route } from '@blocksuite/connector';
import { assertExists, caretRangeFromPoint } from '@blocksuite/global/utils';
import type { PhasorElement, XYWH } from '@blocksuite/phasor';
import { getBrushBoundFromPoints, SurfaceElement } from '@blocksuite/phasor';
import { deserializeXYWH, getCommonBound, isPointIn } from '@blocksuite/phasor';

import { showFormatQuickBar } from '../../../components/format-quick-bar/index.js';
import { showFormatQuickBarByDoubleClick } from '../../index.js';
import {
  calcCurrentSelectionPosition,
  getNativeSelectionMouseDragInfo,
  repairContextMenuRange,
} from '../../utils/position.js';
import type { Selectable } from '../selection-manager.js';
import {
  getXYWH,
  isPhasorElement,
  isTopLevelBlock,
  pickBlocksByBound,
  pickTopBlock,
} from '../utils.js';
import { getPointByDirection } from './connector-mode.js';
import { MouseModeController } from './index.js';

enum DragType {
  /** Moving selected contents */
  ContentMoving = 'content-moving',
  /** Expanding the dragging area, select the content covered inside */
  Selecting = 'selecting',
  /** Native range dragging inside active frame block */
  NativeEditing = 'native-editing',
  /** Default void state */
  None = 'none',
}

export class DefaultModeController extends MouseModeController<DefaultMouseMode> {
  readonly mouseMode = <DefaultMouseMode>{
    type: 'default',
  };
  enableHover = true;

  private _dragType = DragType.None;
  private _startRange: Range | null = null;
  private _dragStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private _dragLastPos: { x: number; y: number } = { x: 0, y: 0 };
  private _lock = false;

  get draggingArea() {
    if (this._dragType === DragType.Selecting) {
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
    this._blockSelectionState = { selected: [], active: false };
    this._edgeless.slots.selectionUpdated.emit(this._blockSelectionState);
    resetNativeSelection(null);
  }

  private _setSelectionState(selected: Selectable[], active: boolean) {
    this._blockSelectionState = {
      selected,
      active,
    };
    this._edgeless.slots.selectionUpdated.emit(this._blockSelectionState);
  }

  private _handleClickOnSelected(selected: Selectable, e: SelectionEvent) {
    const currentSelected = this.blockSelectionState.selected;
    if (currentSelected.length !== 1) {
      this._setSelectionState([selected], false);
      return;
    }

    // phasor element
    if (isPhasorElement(selected)) {
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
          this._blockSelectionState.active;
        this._setSelectionState([selected], active);
      }
      handleNativeRangeClick(this._page, e);
    }
  }

  private _handleSurfaceDragMove(selected: PhasorElement, e: SelectionEvent) {
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
      (!selected.startElement && !selected.endElement)
    ) {
      surface.setElementBound(selected.id, {
        x: boundX,
        y: boundY,
        w: boundW,
        h: boundH,
      });
    }

    if (selected.type !== 'connector') {
      const bindingElements = surface.getBindingElements(selected.id);
      bindingElements.forEach(bindingElement => {
        if (bindingElement.type === 'connector') {
          const { startElement, endElement, id, x, y, w, h, controllers } =
            bindingElement;
          const originStart = startElement?.id
            ? surface.pickById(startElement.id)
            : null;
          const originStartRect = originStart
            ? new Rectangle(...deserializeXYWH(getXYWH(originStart)))
            : null;
          const originStartPoint =
            originStartRect && startElement
              ? getPointByDirection(originStartRect, startElement.direction)
              : {
                  x: x + controllers[0],
                  y: y + controllers[1],
                };

          const originEnd = endElement?.id
            ? surface.pickById(endElement.id)
            : null;
          const originEndRect = originEnd
            ? new Rectangle(...deserializeXYWH(getXYWH(originEnd)))
            : null;
          const originEndPoint =
            originEndRect && endElement
              ? getPointByDirection(originEndRect, endElement.direction)
              : {
                  x: x + controllers[controllers.length - 2],
                  y: y + controllers[controllers.length - 1],
                };
          const routes = route(
            [originStartRect, originEndRect].filter(r => !!r) as Rectangle[],
            [originStartPoint, originEndPoint]
          );
          const bound = getBrushBoundFromPoints(
            routes.map(r => [r.x, r.y]),
            0
          );
          const newControllers = routes
            .map(r => [r.x, r.y])
            .flat()
            .map((v, index) => {
              return index % 2 ? v - bound.y : v - bound.x;
            });
          surface.updateConnectorElement(id, bound, newControllers);
        }
      });
    }
  }

  private _handleBlockDragMove(block: TopLevelBlockModel, e: SelectionEvent) {
    const [modelX, modelY, modelW, modelH] = JSON.parse(block.xywh) as XYWH;
    const { zoom } = this._edgeless.surface.viewport;
    const xywh = JSON.stringify([
      modelX + e.delta.x / zoom,
      modelY + e.delta.y / zoom,
      modelW,
      modelH,
    ]);
    this._page.updateBlock(block, { xywh });
  }

  private _isInSelectedRect(viewX: number, viewY: number) {
    const { selected } = this._blockSelectionState;
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
    this._blockSelectionState = {
      ...this._blockSelectionState,
    };
    this._edgeless.slots.selectionUpdated.emit(this._blockSelectionState);
  }

  private _tryDeleteEmptyBlocks() {
    const emptyBlocks = this._blocks.filter(b => !b.children.length);
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
  private _updateDragHandle(e: SelectionEvent) {
    const block = this._blockSelectionState.selected[0];
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
        rect: getSelectedStateRectByBlockElement(element),
      };
      this._edgeless.components.dragHandle?.onContainerMouseMove(
        e,
        hoverEditingState
      );
    }
  }

  onContainerClick(e: SelectionEvent) {
    this._tryDeleteEmptyBlocks();

    const selected = this._pick(e.x, e.y);

    if (selected) {
      this._handleClickOnSelected(selected, e);
    } else {
      this._setNoneSelectionState();
    }
  }

  onContainerContextMenu(e: SelectionEvent) {
    repairContextMenuRange(e);
  }

  onContainerDblClick(e: SelectionEvent) {
    showFormatQuickBarByDoubleClick(e, this._page, this._edgeless);
  }

  onContainerDragStart(e: SelectionEvent) {
    // Is dragging started from current selected rect
    if (this._isInSelectedRect(e.x, e.y)) {
      this._dragType = this._blockSelectionState.active
        ? DragType.NativeEditing
        : DragType.ContentMoving;
    } else {
      const selected = this._pick(e.x, e.y);
      if (selected) {
        this._setSelectionState([selected], false);
        this._dragType = DragType.ContentMoving;
      } else {
        this._dragType = DragType.Selecting;
      }
    }

    const [x, y] = [e.raw.clientX, e.raw.clientY];
    this._startRange = caretRangeFromPoint(x, y);
    this._dragStartPos = { x: e.x, y: e.y };
    this._dragLastPos = { x: e.x, y: e.y };
  }

  onContainerDragMove(e: SelectionEvent) {
    switch (this._dragType) {
      case DragType.Selecting: {
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
      case DragType.ContentMoving: {
        this._blockSelectionState.selected.forEach(element => {
          if (isPhasorElement(element)) {
            this._handleSurfaceDragMove(element, e);
          } else {
            this._handleBlockDragMove(element, e);
          }
        });
        this._forceUpdateSelection();
        break;
      }
      case DragType.NativeEditing: {
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

  onContainerDragEnd(e: SelectionEvent) {
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
    this._dragType = DragType.None;
    this._dragStartPos = { x: 0, y: 0 };
    this._dragLastPos = { x: 0, y: 0 };
    this._forceUpdateSelection();
  }

  onContainerMouseMove(e: SelectionEvent) {
    this._updateDragHandle(e);
  }

  onContainerMouseOut(_: SelectionEvent) {
    noop();
  }

  clearSelection() {
    this._blockSelectionState = {
      selected: [],
      active: false,
    };
  }
}
