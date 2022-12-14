import type { XYWH } from '../selection-manager';
import type { DefaultMouseMode, SelectionEvent } from '../../../__internal__';
import { getSelectionBoxBound, pick } from '../utils';
import {
  caretRangeFromPoint,
  handleNativeRangeClick,
  handleNativeRangeDragMove,
  resetNativeSelection,
  RootBlockModel,
} from '../../../__internal__';
import {
  getNativeSelectionMouseDragInfo,
  repairContextMenuRange,
} from '../../utils/cursor';
import { showFormatQuickBar } from '../../../components/format-quick-bar';
import { SelectionController } from './index';

export class DefaultSelectionController extends SelectionController<DefaultMouseMode> {
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
        viewport: this._container.viewport,
        rect: this._hoverState.rect,
        active: false,
      };
    }
  }

  private _updateHoverState(hoverBlock: RootBlockModel | null) {
    if (hoverBlock) {
      this._hoverState = {
        rect: getSelectionBoxBound(this._container.viewport, hoverBlock.xywh),
        block: hoverBlock,
      };
    } else {
      this._hoverState = null;
    }
  }

  private _handleClickOnSelected(selected: RootBlockModel, e: SelectionEvent) {
    const { viewport } = this._container;

    switch (this.blockSelectionState.type) {
      case 'none':
        this._blockSelectionState = {
          type: 'single',
          active: false,
          viewport: this._container.viewport,
          selected,
          rect: getSelectionBoxBound(viewport, selected.xywh),
        };
        this._container.signals.updateSelection.emit(this.blockSelectionState);
        break;
      case 'single':
        if (this.blockSelectionState.selected === selected) {
          this.blockSelectionState.active = true;
          this._container.signals.updateSelection.emit(
            this.blockSelectionState
          );
        } else {
          this._blockSelectionState = {
            type: 'single',
            viewport: this._container.viewport,
            active: false,
            selected,
            rect: getSelectionBoxBound(viewport, selected.xywh),
          };
          this._container.signals.updateSelection.emit(
            this.blockSelectionState
          );
        }
        handleNativeRangeClick(this._space, e);
        break;
    }
  }

  onContainerClick(e: SelectionEvent): void {
    const { viewport } = this._container;
    const [modelX, modelY] = viewport.toModelCoord(e.x, e.y);
    const selected = pick(this._blocks, modelX, modelY, this._container, e);

    if (selected) {
      this._handleClickOnSelected(selected, e);
    } else {
      this._blockSelectionState = { type: 'none' };
      this._container.signals.updateSelection.emit(this.blockSelectionState);
      resetNativeSelection(null);
    }
  }

  onContainerContextMenu(e: SelectionEvent): void {
    repairContextMenuRange(e);
  }

  onContainerDblClick(e: SelectionEvent): void {
    // do nothing
  }

  onContainerDragStart(e: SelectionEvent): void {
    const { viewport } = this._container;
    const [modelX, modelY] = viewport.toModelCoord(e.x, e.y);
    const selected = pick(this._blocks, modelX, modelY, this._container, e);

    if (selected) {
      this._handleClickOnSelected(selected, e);
    } else {
      this._blockSelectionState = { type: 'none' };
      this._frameSelectionState = {
        start: new DOMPoint(e.raw.x, e.raw.y),
        end: new DOMPoint(e.raw.x, e.raw.y),
      };

      this._container.signals.updateSelection.emit(this.blockSelectionState);
      resetNativeSelection(null);
    }
    this._startRange = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
  }

  onContainerDragMove(e: SelectionEvent): void {
    switch (this.blockSelectionState.type) {
      case 'none':
        break;
      case 'single':
        if (this.blockSelectionState.active) {
          // TODO reset if drag out of group
          handleNativeRangeDragMove(this._startRange, e);
        }
        // for inactive selection, drag move selected group
        else if (!this._frameSelectionState) {
          const block = this.blockSelectionState.selected;
          const [modelX, modelY, modelW, modelH] = JSON.parse(
            block.xywh
          ) as XYWH;
          const { zoom } = this._container.viewport;
          const xywh = JSON.stringify([
            modelX + e.delta.x / zoom,
            modelY + e.delta.y / zoom,
            modelW,
            modelH,
          ]);
          this._space.updateBlock(block, { xywh });
          this.blockSelectionState.rect = getSelectionBoxBound(
            this._container.viewport,
            xywh
          );
          this._container.signals.updateSelection.emit(
            this.blockSelectionState
          );
        }
        break;
    }

    if (this._frameSelectionState) {
      this._updateFrameSelectionState(e.raw.x, e.raw.y);
    }
    return;
  }

  onContainerDragEnd(e: SelectionEvent): void {
    if (this.isActive) {
      const { anchor, direction, selectedType } =
        getNativeSelectionMouseDragInfo(e);
      if (selectedType === 'Caret') {
        // If nothing is selected, then we should not show the format bar
        return;
      }
      showFormatQuickBar({ anchorEl: anchor, direction });
    }
    this._frameSelectionState = null;
    return;
  }

  onContainerMouseMove(e: SelectionEvent): void {
    const { viewport } = this._container;
    const [modelX, modelY] = viewport.toModelCoord(e.x, e.y);
    const hovered = pick(this._blocks, modelX, modelY, this._container, e);

    this._updateHoverState(hovered);
    this._container.signals.hoverUpdated.emit();
    return;
  }

  onContainerMouseOut(e: SelectionEvent): void {
    // do nothing
  }

  syncBlockSelectionRect() {
    if (this.blockSelectionState.type === 'single') {
      const rect = getSelectionBoxBound(
        this._container.viewport,
        this.blockSelectionState.selected.xywh
      );
      this.blockSelectionState.rect = rect;
      this._container.signals.updateSelection.emit(this.blockSelectionState);
    }

    this._updateHoverState(this._hoverState?.block || null);
  }
}
