import type { XYWH } from '../selection-manager.js';
import type {
  DefaultMouseMode,
  SelectionEvent,
} from '../../../__internal__/index.js';
import { getSelectionBoxBound, pick } from '../utils.js';
import {
  handleNativeRangeClick,
  handleNativeRangeDragMove,
  noop,
  resetNativeSelection,
  RootBlockModel,
} from '../../../__internal__/index.js';
import {
  getNativeSelectionMouseDragInfo,
  repairContextMenuRange,
} from '../../utils/position.js';
import { showFormatQuickBar } from '../../../components/format-quick-bar/index.js';
import { MouseModeController } from './index.js';
import { caretRangeFromPoint } from '@blocksuite/global/utils';

export class DefaultModeController extends MouseModeController<DefaultMouseMode> {
  readonly mouseMode = <DefaultMouseMode>{
    type: 'default',
  };

  private _startRange: Range | null = null;

  private _updateFrameSelectionState(x: number, y: number) {
    if (this._frameSelectionState) {
      this._frameSelectionState.end = new DOMPoint(x, y);
    }
    if (this._hoverState) {
      this._blockSelectionState = {
        type: 'single',
        selected: this._hoverState.block,
        rect: this._hoverState.rect,
        active: false,
      };
    }
  }

  private _updateHoverState(hoverBlock: RootBlockModel | null) {
    if (hoverBlock) {
      this._hoverState = {
        rect: getSelectionBoxBound(this._edgeless.viewport, hoverBlock.xywh),
        block: hoverBlock,
      };
    } else {
      this._hoverState = null;
    }
  }

  private _handleClickOnSelected(selected: RootBlockModel, e: SelectionEvent) {
    const { viewport } = this._edgeless;

    switch (this.blockSelectionState.type) {
      case 'none':
        this._blockSelectionState = {
          type: 'single',
          active: false,
          selected,
          rect: getSelectionBoxBound(viewport, selected.xywh),
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
            rect: getSelectionBoxBound(viewport, selected.xywh),
          };
          this._edgeless.signals.updateSelection.emit(this.blockSelectionState);
        }
        handleNativeRangeClick(this._page, e);
        break;
    }
  }

  onContainerClick(e: SelectionEvent): void {
    const { viewport } = this._edgeless;
    const [modelX, modelY] = viewport.toModelCoord(e.x, e.y);
    const selected = pick(this._blocks, modelX, modelY, this._edgeless, e);

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

  onContainerDblClick(e: SelectionEvent): void {
    noop();
  }

  onContainerDragStart(e: SelectionEvent): void {
    const { viewport } = this._edgeless;
    const [modelX, modelY] = viewport.toModelCoord(e.x, e.y);
    const selected = pick(this._blocks, modelX, modelY, this._edgeless, e);

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
    this._startRange = caretRangeFromPoint(e.x, e.y);
  }

  onContainerDragMove(e: SelectionEvent): void {
    switch (this.blockSelectionState.type) {
      case 'none':
        break;
      case 'single':
        if (
          this.blockSelectionState.active
          // && !matchFlavours(this.blockSelectionState.selected, ['affine:shape'])
        ) {
          // TODO reset if drag out of frame
          handleNativeRangeDragMove(this._startRange, e);
        }
        // for inactive selection, drag move selected frame
        else if (!this._frameSelectionState) {
          const block = this.blockSelectionState.selected;
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
          this._edgeless.signals.updateSelection.emit(this.blockSelectionState);
        }
        break;
    }

    if (this._frameSelectionState) {
      this._updateFrameSelectionState(e.x, e.y);
    }
  }

  onContainerDragEnd(e: SelectionEvent): void {
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
    const hovered = pick(this._blocks, modelX, modelY, this._edgeless, e);

    this._updateHoverState(hovered);
    this._edgeless.signals.hoverUpdated.emit();
  }

  onContainerMouseOut(e: SelectionEvent): void {
    noop();
  }

  syncBlockSelectionRect() {
    if (this.blockSelectionState.type === 'single') {
      const rect = getSelectionBoxBound(
        this._edgeless.viewport,
        this.blockSelectionState.selected.xywh
      );
      this.blockSelectionState.rect = rect;
      this._edgeless.signals.updateSelection.emit(this.blockSelectionState);
    }

    this._updateHoverState(this._hoverState?.block || null);
  }
}
