import { caretRangeFromPoint } from '@blocksuite/global/utils';
import type { SurfaceElement, XYWH } from '@blocksuite/phasor';
import { deserializeXYWH, getCommonBound, isPointIn } from '@blocksuite/phasor';

import type {
  DefaultMouseMode,
  SelectionEvent,
  TopLevelBlockModel,
} from '../../../__internal__/index.js';
import {
  handleNativeRangeClick,
  handleNativeRangeDragMove,
  noop,
  resetNativeSelection,
} from '../../../__internal__/index.js';
import { showFormatQuickBar } from '../../../components/format-quick-bar/index.js';
import {
  calcCurrentSelectionPosition,
  getNativeSelectionMouseDragInfo,
  repairContextMenuRange,
} from '../../utils/position.js';
import type { Selectable } from '../selection-manager.js';
import {
  getXYWH,
  isSurfaceElement,
  isTopLevelBlock,
  pickBlocksByBound,
  pickTopBlock,
} from '../utils.js';
import { MouseModeController } from './index.js';

export class DefaultModeController extends MouseModeController<DefaultMouseMode> {
  readonly mouseMode = <DefaultMouseMode>{
    type: 'default',
  };
  enableCalcHoverState = true;

  private _draggingMode: 'translate' | 'select' | 'edit' | null = null;
  private _startRange: Range | null = null;
  private _dragStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private _dragLastPos: { x: number; y: number } = { x: 0, y: 0 };
  private _lock = false;

  get draggingArea() {
    if (this._draggingMode === 'select') {
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
    const isSurfaceEl = isSurfaceElement(selected);

    // shape
    if (isSurfaceEl) {
      this._setSelectionState([selected], false);
    }
    // block
    else {
      switch (this.blockSelectionState.selected.length) {
        case 0:
          this._setSelectionState([selected], false);
          break;
        case 1:
          if (this.blockSelectionState.selected[0] === selected) {
            this._setSelectionState([selected], true);
          } else {
            this._setSelectionState([selected], false);
          }
          handleNativeRangeClick(this._page, e);
          break;
      }
    }
  }

  private _handleSurfaceDragMove(selected: SurfaceElement, e: SelectionEvent) {
    if (!this._lock) {
      this._lock = true;
      this._page.captureSync();
    }
    const { zoom } = this._edgeless.surface.viewport;
    const deltaX = this._dragLastPos.x - e.x;
    const deltaY = this._dragLastPos.y - e.y;
    const boundX = selected.x - deltaX / zoom;
    const boundY = selected.y - deltaY / zoom;
    const boundW = selected.w;
    const boundH = selected.h;
    this._edgeless.surface.setElementBound(selected.id, {
      x: boundX,
      y: boundY,
      w: boundW,
      h: boundH,
    });
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

  private _isPointInSelectionArea(viewX: number, viewY: number) {
    const { selected } = this._blockSelectionState;
    if (!selected.length) {
      return false;
    }
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

  onContainerClick(e: SelectionEvent) {
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

  onContainerDblClick(_: SelectionEvent) {
    noop();
  }

  onContainerDragStart(e: SelectionEvent) {
    if (this._isPointInSelectionArea(e.x, e.y)) {
      this._draggingMode = this._blockSelectionState.active
        ? 'edit'
        : 'translate';
    } else {
      const selected = this._pick(e.x, e.y);
      if (selected) {
        this._setSelectionState([selected], false);
        this._draggingMode = 'translate';
      } else {
        this._draggingMode = 'select';
      }
    }

    const [x, y] = [e.raw.clientX, e.raw.clientY];
    this._startRange = caretRangeFromPoint(x, y);
    this._dragStartPos = { x: e.x, y: e.y };
    this._dragLastPos = { x: e.x, y: e.y };
  }

  onContainerDragMove(e: SelectionEvent) {
    switch (this._draggingMode) {
      case 'select': {
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
      case 'translate': {
        this._blockSelectionState.selected.forEach(element => {
          if (isSurfaceElement(element)) {
            this._handleSurfaceDragMove(element, e);
          } else {
            this._handleBlockDragMove(element, e);
          }
        });
        this._forceUpdateSelection();
        break;
      }
      case 'edit': {
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
        direction,
        anchorEl: {
          getBoundingClientRect: () => {
            return calcCurrentSelectionPosition(direction);
          },
        },
      });
    }
    this._draggingMode = null;
    this._dragStartPos = { x: 0, y: 0 };
    this._dragLastPos = { x: 0, y: 0 };
    this._forceUpdateSelection();
  }

  onContainerMouseMove(e: SelectionEvent) {
    noop();
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
