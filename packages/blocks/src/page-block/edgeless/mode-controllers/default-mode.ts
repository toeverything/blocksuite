import { caretRangeFromPoint } from '@blocksuite/global/utils';
import type { XYWH } from '@blocksuite/phasor';
import { serializeXYWH } from '@blocksuite/phasor';

import type {
  DefaultMouseMode,
  SelectionEvent,
} from '../../../__internal__/index.js';
import {
  handleNativeRangeClick,
  handleNativeRangeDragMove,
  noop,
  resetNativeSelection,
} from '../../../__internal__/index.js';
import { showFormatQuickBar } from '../../../components/format-quick-bar/index.js';
import {
  getNativeSelectionMouseDragInfo,
  repairContextMenuRange,
} from '../../utils/position.js';
import type { Selectable } from '../selection-manager.js';
import {
  getSelectionBoxBound,
  getXYWH,
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
    const { viewport, surface } = this._edgeless;
    const [modelX, modelY] = viewport.toModelCoord(x, y);
    const selectedShape = surface.pickTop(modelX, modelY);
    return selectedShape ? selectedShape : pick(this._blocks, modelX, modelY);
  }

  private _updateFrameSelectionState(x: number, y: number) {
    if (this._frameSelectionState) {
      this._frameSelectionState.end = new DOMPoint(x, y);
    }
    if (this._hoverState) {
      this._blockSelectionState = {
        type: 'single',
        selected: this._hoverState.content,
        rect: this._hoverState.rect,
        active: false,
      };
    }
  }

  private _updateHoverState(content: Selectable | null) {
    if (content) {
      if (isTopLevelBlock(content)) {
        this._hoverState = {
          rect: getSelectionBoxBound(this._edgeless.viewport, content.xywh),
          content,
        };
      }
    } else {
      this._hoverState = null;
    }
  }

  private _handleClickOnSelected(selected: Selectable, e: SelectionEvent) {
    const { viewport } = this._edgeless;

    const xywh = getXYWH(selected);

    switch (this.blockSelectionState.type) {
      case 'none':
        this._blockSelectionState = {
          type: 'single',
          active: false,
          selected,
          rect: getSelectionBoxBound(viewport, xywh),
        };
        this._edgeless.signals.updateSelection.emit(this.blockSelectionState);
        break;
      case 'single':
        if (this.blockSelectionState.selected === selected) {
          this.blockSelectionState.active = true;
          this._edgeless.signals.updateSelection.emit(this.blockSelectionState);
        } else {
          this._blockSelectionState = {
            type: 'single',
            active: false,
            selected,
            rect: getSelectionBoxBound(viewport, xywh),
          };
          this._edgeless.signals.updateSelection.emit(this.blockSelectionState);
        }
        handleNativeRangeClick(this._page, e);
        break;
    }
  }

  onContainerClick(e: SelectionEvent): void {
    const selected = this._pick(e.x, e.y);

    if (selected) {
      this._handleClickOnSelected(selected, e);
    } else {
      this._blockSelectionState = { type: 'none' };
      this._edgeless.signals.updateSelection.emit(this.blockSelectionState);
      resetNativeSelection(null);
    }
  }

  onContainerContextMenu(e: SelectionEvent): void {
    repairContextMenuRange(e);
  }

  onContainerDblClick(_: SelectionEvent): void {
    noop();
  }

  onContainerDragStart(e: SelectionEvent): void {
    const selected = this._pick(e.x, e.y);

    if (selected) {
      this._handleClickOnSelected(selected, e);
    } else {
      this._blockSelectionState = { type: 'none' };
      this._frameSelectionState = {
        start: new DOMPoint(e.x, e.y),
        end: new DOMPoint(e.x, e.y),
      };

      this._edgeless.signals.updateSelection.emit(this.blockSelectionState);
      resetNativeSelection(null);
    }

    const [x, y] = [e.raw.clientX, e.raw.clientY];
    this._startRange = caretRangeFromPoint(x, y);
    this._dragLastPos = { x, y };
  }

  onContainerDragMove(e: SelectionEvent): void {
    switch (this.blockSelectionState.type) {
      case 'none':
        break;
      case 'single':
        if (
          !isTopLevelBlock(this.blockSelectionState.selected) &&
          this.blockSelectionState.active
        ) {
          if (!this._lock) {
            this._lock = true;
            this._page.captureSync();
          }
          const deltaX = this._dragLastPos.x - e.x;
          const deltaY = this._dragLastPos.y - e.y;
          this._edgeless.surface.setElementBound(
            this.blockSelectionState.selected.id,
            {
              x:
                this.blockSelectionState.selected.x -
                deltaX / this._edgeless.viewport.zoom,
              y:
                this.blockSelectionState.selected.y -
                deltaY / this._edgeless.viewport.zoom,
              w: this.blockSelectionState.selected.w,
              h: this.blockSelectionState.selected.h,
            }
          );
          this._blockSelectionState = {
            ...this.blockSelectionState,
            rect: getSelectionBoxBound(
              this._edgeless.viewport,
              serializeXYWH(
                this.blockSelectionState.selected.x -
                  deltaX / this._edgeless.viewport.zoom,
                this.blockSelectionState.selected.y -
                  deltaY / this._edgeless.viewport.zoom,
                this.blockSelectionState.selected.w,
                this.blockSelectionState.selected.h
              )
            ),
          };
          this._edgeless.signals.updateSelection.emit(
            this._blockSelectionState
          );
          break;
        }
        if (
          this.blockSelectionState.active
          // && !matchFlavours(this.blockSelectionState.selected, ['affine:shape'])
        ) {
          // TODO reset if drag out of frame
          handleNativeRangeDragMove(this._startRange, e);
        }
        // for inactive selection, drag move selected frame
        else if (!this._frameSelectionState) {
          const selected = this.blockSelectionState.selected;
          if (isTopLevelBlock(selected)) {
            const block = selected;
            const [modelX, modelY, modelW, modelH] = JSON.parse(
              block.xywh
            ) as XYWH;
            const { zoom } = this._edgeless.viewport;
            const xywh = JSON.stringify([
              modelX + e.delta.x / zoom,
              modelY + e.delta.y / zoom,
              modelW,
              modelH,
            ]);
            this._page.updateBlock(block, { xywh });
            this.blockSelectionState.rect = getSelectionBoxBound(
              this._edgeless.viewport,
              xywh
            );
            this._edgeless.signals.updateSelection.emit(
              this.blockSelectionState
            );
          }
        }
        break;
    }

    if (this._frameSelectionState) {
      this._updateFrameSelectionState(e.x, e.y);
    }
    this._dragLastPos = {
      x: e.x,
      y: e.y,
    };
  }

  onContainerDragEnd(e: SelectionEvent): void {
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
      showFormatQuickBar({ direction });
    } else if (this.blockSelectionState.type === 'single') {
      if (!this._frameSelectionState) {
        this._page.captureSync();
      }
    }
    this._frameSelectionState = null;
  }

  onContainerMouseMove(e: SelectionEvent): void {
    const { viewport } = this._edgeless;
    const [modelX, modelY] = viewport.toModelCoord(e.x, e.y);
    const hovered = pick(this._blocks, modelX, modelY);

    this._updateHoverState(hovered);
    this._edgeless.signals.hoverUpdated.emit();
  }

  onContainerMouseOut(_: SelectionEvent): void {
    noop();
  }

  syncBlockSelectionRect() {
    if (this.blockSelectionState.type === 'single') {
      const selected = this.blockSelectionState.selected;
      if (isTopLevelBlock(selected)) {
        const block = selected;
        const rect = getSelectionBoxBound(this._edgeless.viewport, block.xywh);
        this.blockSelectionState.rect = rect;
        this._edgeless.signals.updateSelection.emit(this.blockSelectionState);
      }
    }

    this._updateHoverState(this._hoverState?.content ?? null);
  }
}
