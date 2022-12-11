import type { EdgelessContainer } from './edgeless-page-block';
import {
  SelectionEvent,
  initMouseEventHandlers,
  resetNativeSelection,
  noop,
  caretRangeFromPoint,
  handleNativeRangeDragMove,
  handleNativeRangeClick,
  MouseMode,
  RootBlockModels,
  assertExists,
} from '../../__internal__';
import { getSelectionBoxBound, initWheelEventHandlers, pick } from './utils';
import {
  getNativeSelectionMouseDragInfo,
  repairContextMenuRange,
} from '../utils/cursor';
import { showFormatQuickBar } from '../../components/format-quick-bar';
interface NoneBlockSelectionState {
  type: 'none';
}

interface SingleBlockSelectionState {
  type: 'single';
  selected: RootBlockModels;
  viewport: ViewportState;
  rect: DOMRect;
  active: boolean;
}

export type BlockSelectionState =
  | NoneBlockSelectionState
  | SingleBlockSelectionState;

interface HoverState {
  rect: DOMRect;
  block: RootBlockModels;
}

export interface FrameSelectionState {
  start: DOMPoint;
  end: DOMPoint;
}

export type XYWH = [number, number, number, number];

const MIN_ZOOM = 0.3;

export class ViewportState {
  private _width = 0;
  private _height = 0;
  private _zoom = 1.0;
  private _centerX = 0.0;
  private _centerY = 0.0;

  get zoom() {
    return this._zoom;
  }

  get centerX() {
    return this._centerX;
  }

  get centerY() {
    return this._centerY;
  }

  get viewportX() {
    return this._centerX - this._width / 2 / this._zoom;
  }

  get viewportY() {
    return this._centerY - this._height / 2 / this._zoom;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  toModelCoord(viewX: number, viewY: number): [number, number] {
    return [
      this.viewportX + viewX / this._zoom,
      this.viewportY + viewY / this._zoom,
    ];
  }

  toViewCoord(modelX: number, modelY: number): [number, number] {
    return [
      (modelX - this.viewportX) * this._zoom,
      (modelY - this.viewportY) * this._zoom,
    ];
  }

  setSize(width: number, height: number) {
    this._width = width;
    this._height = height;
  }

  setZoom(val: number) {
    this._zoom = val;
  }

  applyDeltaZoom(delta: number) {
    const val = (this.zoom * (100 + delta)) / 100;
    const newZoom = Math.max(val, MIN_ZOOM);
    this.setZoom(newZoom);
  }

  applyDeltaCenter(deltaX: number, deltaY: number) {
    this._centerX += deltaX;
    this._centerY += deltaY;
  }

  setCenter(centerX: number, centerY: number) {
    this._centerX = centerX;
    this._centerY = centerY;
  }
}

export class EdgelessSelectionManager {
  private _mouseMode: MouseMode;
  private _container: EdgelessContainer;
  private _mouseDisposeCallback: () => void;
  private _wheelDisposeCallback: () => void;

  private _blockSelectionState: BlockSelectionState = {
    type: 'none',
  };
  private _startRange: Range | null = null;
  private _draggingShapeBlockId: string | null = null;
  private _hoverState: HoverState | null = null;
  private _frameSelectionState: FrameSelectionState | null = null;

  get mouseMode() {
    return this._mouseMode;
  }

  set mouseMode(mode: MouseMode) {
    this._mouseMode = mode;
  }

  get blockSelectionState() {
    return this._blockSelectionState;
  }

  get hoverRect() {
    if (!this._hoverState) return null;
    return this._hoverState.rect;
  }

  get isHoveringShape(): boolean {
    return this._hoverState?.block.flavour === 'affine:shape';
  }

  get frameSelectionRect() {
    if (!this._frameSelectionState) return null;

    const { start, end } = this._frameSelectionState;
    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);
    return new DOMRect(minX, minY, maxX - minX, maxY - minY);
  }

  constructor(container: EdgelessContainer) {
    this._mouseMode = 'default';
    this._container = container;
    this._mouseDisposeCallback = initMouseEventHandlers(
      this._container,
      this._onContainerDragStart,
      this._onContainerDragMove,
      this._onContainerDragEnd,
      this._onContainerClick,
      this._onContainerDblClick,
      this._onContainerMouseMove,
      this._onContainerMouseOut,
      this._onContainerContextMenu
    );
    this._wheelDisposeCallback = initWheelEventHandlers(container);
  }

  private get _space() {
    return this._container.page;
  }

  private get _blocks(): RootBlockModels[] {
    return (this._space.root?.children as RootBlockModels[]) ?? [];
  }

  get isActive() {
    return (
      this._blockSelectionState.type === 'single' &&
      this._blockSelectionState.active
    );
  }

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

  private _updateHoverState(hoverBlock: RootBlockModels | null) {
    if (hoverBlock) {
      this._hoverState = {
        rect: getSelectionBoxBound(this._container.viewport, hoverBlock.xywh),
        block: hoverBlock,
      };
    } else {
      this._hoverState = null;
    }
  }

  private _handleClickOnSelected(selected: RootBlockModels, e: SelectionEvent) {
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

  private _onContainerDragStart = (e: SelectionEvent) => {
    switch (this.mouseMode) {
      case 'shape': {
        const [modelX, modelY] = this._container.viewport.toModelCoord(
          e.x,
          e.y
        );
        this._draggingShapeBlockId = this._container.page.addBlock({
          flavour: 'affine:shape',
          xywh: JSON.stringify([modelX, modelY, 0, 0]),
        });
        this._frameSelectionState = {
          start: new DOMPoint(e.raw.x, e.raw.y),
          end: new DOMPoint(e.raw.x, e.raw.y),
        };
        break;
      }
      case 'default': {
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

          this._container.signals.updateSelection.emit(
            this.blockSelectionState
          );
          resetNativeSelection(null);
        }

        this._startRange = caretRangeFromPoint(e.raw.clientX, e.raw.clientY);
        break;
      }
    }
  };

  private _onContainerDragMove = (e: SelectionEvent) => {
    switch (this._mouseMode) {
      case 'default': {
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

              this._space.updateBlock(block, {
                xywh: JSON.stringify([
                  modelX + e.delta.x / zoom,
                  modelY + e.delta.y / zoom,
                  modelW,
                  modelH,
                ]),
              });
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
      case 'shape': {
        assertExists(this._draggingShapeBlockId);
        assertExists(this._frameSelectionState);
        this._frameSelectionState.end = new DOMPoint(e.raw.x, e.raw.y);
        const [x, y] = this._container.viewport.toModelCoord(
          Math.min(
            this._frameSelectionState.start.x,
            this._frameSelectionState.end.x
          ),
          Math.min(
            this._frameSelectionState.start.y,
            this._frameSelectionState.end.y
          )
        );
        const w = Math.abs(
          this._frameSelectionState.start.x - this._frameSelectionState.end.x
        );
        const h = Math.abs(
          this._frameSelectionState.start.y - this._frameSelectionState.end.y
        );
        this._container.page.updateBlockById(this._draggingShapeBlockId, {
          xywh: JSON.stringify([x, y, w, h]),
        });
      }
    }
  };

  private _onContainerDragEnd = (e: SelectionEvent) => {
    switch (this.mouseMode) {
      case 'shape': {
        this._draggingShapeBlockId = null;
        return;
      }
      case 'default': {
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
    }
  };

  private _onContainerClick = (e: SelectionEvent) => {
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
  };

  syncBlockSelectionRect() {
    if (this.blockSelectionState.type === 'single') {
      const rect = getSelectionBoxBound(
        this._container.viewport,
        this.blockSelectionState.selected.xywh
      );
      this.blockSelectionState.rect = rect;
    }

    this._updateHoverState(this._hoverState?.block || null);
    this._container.signals.updateSelection.emit(this.blockSelectionState);
  }

  private _onContainerDblClick = (e: SelectionEvent) => {
    noop();
  };

  private _onContainerMouseMove = (e: SelectionEvent) => {
    const { viewport } = this._container;
    const [modelX, modelY] = viewport.toModelCoord(e.x, e.y);
    const hovered = pick(this._blocks, modelX, modelY, this._container, e);

    this._updateHoverState(hovered);
    this._container.signals.hoverUpdated.emit();
  };

  private _onContainerMouseOut = (e: SelectionEvent) => {
    noop();
  };

  private _onContainerContextMenu = (e: SelectionEvent) => {
    repairContextMenuRange(e);
  };

  dispose() {
    this._mouseDisposeCallback();
    this._wheelDisposeCallback();
  }
}
