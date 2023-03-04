import { caretRangeFromPoint } from '@blocksuite/global/utils';
import type { SurfaceElement, XYWH } from '@blocksuite/phasor';

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
  getSelectionBoxBound,
  getXYWH,
  isSurfaceElement,
  isTopLevelBlock,
  pick,
} from '../utils.js';
import { MouseModeController } from './index.js';

export class DefaultModeController extends MouseModeController<DefaultMouseMode> {
  readonly mouseMode = <DefaultMouseMode>{
    type: 'default',
  };

  private _startRange: Range | null = null;
  private _dragLastPos: { x: number; y: number } = { x: 0, y: 0 };
  private _lock = false;

  private _pick(x: number, y: number) {
    const { surface } = this._edgeless;
    const [modelX, modelY] = surface.viewport.toModelCoord(x, y);
    const selectedShape = surface.pickTop(modelX, modelY);
    return selectedShape ? selectedShape : pick(this._blocks, modelX, modelY);
  }

  private _updateFrameSelectionState(x: number, y: number) {
    if (this._frameSelectionState) {
      this._frameSelectionState.end = new DOMPoint(x, y);
    }
    if (this._hoverState) {
      this._setSingleSelectionState(this._hoverState.content, false);
    }
  }

  private _updateHoverState(content: Selectable | null) {
    if (!content) {
      this._hoverState = null;
      return;
    }

    const { viewport } = this._edgeless.surface;
    const xywh = getXYWH(content);
    this._hoverState = {
      rect: getSelectionBoxBound(viewport, xywh),
      content,
    };
  }

  private _setNoneSelectionState() {
    this._blockSelectionState = { type: 'none' };
    this._edgeless.slots.updateSelection.emit(this._blockSelectionState);
    resetNativeSelection(null);
  }

  private _setSingleSelectionState(selected: Selectable, active: boolean) {
    const { viewport } = this._edgeless.surface;
    const xywh = getXYWH(selected);
    this._blockSelectionState = {
      type: 'single',
      active,
      selected,
      rect: getSelectionBoxBound(viewport, xywh),
    };
    this._edgeless.slots.updateSelection.emit(this._blockSelectionState);
  }

  private _handleClickOnSelected(selected: Selectable, e: SelectionEvent) {
    const isSurfaceEl = isSurfaceElement(selected);

    // shape
    if (isSurfaceEl) {
      this._setSingleSelectionState(selected, true);
    }
    // block
    else {
      switch (this.blockSelectionState.type) {
        case 'none':
          this._setSingleSelectionState(selected, false);
          break;
        case 'single':
          if (this.blockSelectionState.selected === selected) {
            this._setSingleSelectionState(selected, true);
          } else {
            this._setSingleSelectionState(selected, false);
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
    const deltaX = this._dragLastPos.x - e.raw.clientX;
    const deltaY = this._dragLastPos.y - e.raw.clientY;
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
    this._setSingleSelectionState(selected, true);
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
    this._setSingleSelectionState(block, false);
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
    const selected = this._pick(e.x, e.y);

    if (selected) {
      // See https://github.com/toeverything/blocksuite/pull/1484
      if (this._blockSelectionState.type === 'single') {
        if (this._blockSelectionState.selected !== selected) {
          this._setNoneSelectionState();
        }
      } else {
        if (isTopLevelBlock(selected)) {
          this._setSingleSelectionState(selected, true);
        }
      }
    } else {
      this._setNoneSelectionState();
      this._frameSelectionState = {
        start: new DOMPoint(e.x, e.y),
        end: new DOMPoint(e.x, e.y),
      };
    }

    const [x, y] = [e.raw.clientX, e.raw.clientY];
    this._startRange = caretRangeFromPoint(x, y);
    this._dragLastPos = { x, y };
  }

  onContainerDragMove(e: SelectionEvent) {
    const { blockSelectionState } = this;

    switch (blockSelectionState.type) {
      case 'none':
        break;
      case 'single':
        if (isSurfaceElement(blockSelectionState.selected)) {
          this._handleSurfaceDragMove(blockSelectionState.selected, e);
          break;
        }

        // Is inside an active frame, handle regular rich-text editing
        if (blockSelectionState.active) {
          // TODO reset if drag out of frame
          handleNativeRangeDragMove(this._startRange, e);
          break;
        }

        // Is frame-dragging over a non-active frame
        if (this._frameSelectionState) {
          noop();
        }
        // Is dragging a selected (but not active) frame, move it
        else {
          this._handleBlockDragMove(blockSelectionState.selected, e);
        }
        break;
    }

    if (this._frameSelectionState) {
      this._updateFrameSelectionState(e.x, e.y);
    }
    this._dragLastPos = {
      x: e.raw.clientX,
      y: e.raw.clientY,
    };
  }

  onContainerDragEnd(e: SelectionEvent) {
    const selected = this._pick(e.x, e.y);
    const isSurfaceEl = isSurfaceElement(selected);

    if (this._lock) {
      this._page.captureSync();
      this._lock = false;
    }

    if (this.isActive && !isSurfaceEl) {
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
    } else if (this.blockSelectionState.type === 'single') {
      if (!this._frameSelectionState) {
        this._page.captureSync();
      }
    }
    this._frameSelectionState = null;
  }

  onContainerMouseMove(e: SelectionEvent) {
    const { viewport } = this._edgeless.surface;
    const [modelX, modelY] = viewport.toModelCoord(e.x, e.y);

    const shape = this._surface.pickTop(modelX, modelY);
    const blocks = pick(this._blocks, modelX, modelY);

    this._updateHoverState(shape ?? blocks);
    this._edgeless.slots.hoverUpdated.emit();
  }

  onContainerMouseOut(_: SelectionEvent) {
    noop();
  }

  // Selection rect can be used for both top-level blocks and surface elements
  syncSelectionRect() {
    const { viewport } = this._edgeless.surface;
    if (this.blockSelectionState.type === 'single') {
      const selected = this.blockSelectionState.selected;

      const xywh = getXYWH(selected);
      const rect = getSelectionBoxBound(viewport, xywh);
      this.blockSelectionState.rect = rect;
      this._edgeless.slots.updateSelection.emit(this.blockSelectionState);
    }

    this._updateHoverState(this._hoverState?.content || null);
  }

  clearSelection() {
    this._blockSelectionState = {
      type: 'none',
    };
    this._hoverState = null;
  }
}
