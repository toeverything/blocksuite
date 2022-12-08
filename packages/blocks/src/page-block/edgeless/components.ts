import { html, LitElement, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { repeat } from 'lit/directives/repeat.js';
import type { BaseBlockModel } from '@blocksuite/store';

import type { GroupBlockModel, RootBlockModels, ShapeBlockModel } from '../..'
import type {
  BlockSelectionState,
  ViewportState,
  XYWH,
} from './selection-manager';
import { BlockElement, BlockHost, getBlockById } from '../../__internal__';
import '../../__internal__';
import {
  PADDING_X,
  PADDING_Y,
  GROUP_MIN_LENGTH,
  getSelectionBoxBound,
} from './utils';

function getCommonRectStyle(rect: DOMRect, zoom: number, isShape = false) {
  return {
    position: 'absolute',
    left: rect.x + 'px',
    top: rect.y + 'px',
    width: rect.width + (isShape ? 0: PADDING_X) * zoom + 'px',
    height: rect.height + (isShape ? 0 : PADDING_Y) * zoom + 'px',
    borderRadius: `${10 * zoom}px`,
    pointerEvents: 'none',
    boxSizing: 'border-box',
  };
}

export function EdgelessHoverRect(rect: DOMRect | null, zoom: number, isShape = false) {
  if (!rect) return html`<div></div>`;

  const style = {
    ...getCommonRectStyle(rect, zoom, isShape),
    border: '1px solid var(--affine-primary-color)',
  };

  return html`
    <div class="affine-edgeless-hover-rect" style=${styleMap(style)}></div>
  `;
}

enum HandleDirection {
  Left = 'left',
  Right = 'right',
  LeftTop='left-top',
  LeftBottom='left-bottom',
  RightTop='right-top',
  RightBottom = 'right-bottom'
}

const directionCursors = {
  [HandleDirection.Right]: 'ew-resize',
  [HandleDirection.Left]: 'ew-resize',
  [HandleDirection.LeftTop]: 'nw-resize',
  [HandleDirection.RightTop]: 'ne-resize',
  [HandleDirection.LeftBottom]: 'sw-resize',
  [HandleDirection.RightBottom]: 'se-resize'
} as const

function Handle(
  centerX: number,
  centerY: number,
  handleDirection: HandleDirection,
  onMouseDown?: (e: MouseEvent, direction: HandleDirection) => void
) {
  const style = {
    position: 'absolute',
    left: centerX - 6 + 'px',
    top: centerY - 6 + 'px',
    width: '12px',
    height: '12px',
    boxSizing: 'border-box',
    borderRadius: '6px',
    zIndex: '10',
    border: '2px var(--affine-primary-color) solid',
    background: 'white',
    cursor: directionCursors[handleDirection],
  };

  const handlerMouseDown = (e: MouseEvent) => {
    onMouseDown && onMouseDown(e, handleDirection);
  };

  return html`
    <div
      aria-label=${`handle-${handleDirection}`}
      style=${styleMap(style)}
      @mousedown=${handlerMouseDown}
    ></div>
  `;
}

export function EdgelessFrameSelectionRect(rect: DOMRect | null) {
  if (rect === null) return html``;

  const style = {
    left: rect.left + 'px',
    top: rect.top + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
  };
  return html`
    <style>
      .affine-edgeless-frame-selection-rect {
        position: absolute;
        background: var(--affine-selected-color);
        z-index: 1;
        pointer-events: none;
      }
    </style>
    <div
      class="affine-edgeless-frame-selection-rect"
      style=${styleMap(style)}
    ></div>
  `;
}

function EdgelessBlockChild(
  model: RootBlockModels,
  host: BlockHost,
  viewport: ViewportState
) {
  const { xywh, flavour } = model;
  const { zoom, viewportX, viewportY } = viewport;
  const [modelX, modelY, modelW, modelH] = JSON.parse(xywh) as XYWH;
  const translateX = (modelX - viewportX) * zoom;
  const translateY = (modelY - viewportY) * zoom;

  const isShape = flavour === 'affine:shape'

  const style = {
    position: 'absolute',
    transform: `translate(${translateX}px, ${translateY}px) scale(${zoom})`,
    transformOrigin: '0 0',
    width: modelW + (isShape ? 0 : PADDING_X) + 'px',
    height: modelH + (isShape ? 0 : PADDING_Y) + 'px',
    padding: isShape ? '0px': `${PADDING_X / 2}px`,
    background: isShape ? 'transparent': 'white',
  };

  return html`
    <div
      test-id=${model.id}
      class="affine-edgeless-block-child"
      style=${styleMap(style)}
    >
      ${BlockElement(model, host, true)}
    </div>
  `;
}

export function EdgelessBlockChildrenContainer(
  model: BaseBlockModel,
  host: BlockHost,
  viewport: ViewportState
) {
  const { zoom, viewportX, viewportY } = viewport;
  const translateX = -viewportX * zoom;
  const translateY = -viewportY * zoom;

  const gridStyle = {
    backgroundImage:
      'linear-gradient(#cccccc66 1px, transparent 1px),linear-gradient(90deg, #cccccc66 1px, transparent 1px)',
  };
  const defaultStyle = {};
  const USE_GRID = location.href.includes('grid');
  const style = USE_GRID ? gridStyle : defaultStyle;

  return html`
    <style>
      .affine-block-children-container.edgeless {
        padding-left: 0;
        position: relative;
        overflow: hidden;
        height: 100%;

        /* background-image: linear-gradient(#cccccc66 1px, transparent 1px),
          linear-gradient(90deg, #cccccc66 1px, transparent 1px); */
        background-size: ${20 * viewport.zoom}px ${20 * viewport.zoom}px;
        background-position: ${translateX}px ${translateY}px;
        background-color: #fff;
      }
    </style>
    <div
      class="affine-block-children-container edgeless"
      style=${styleMap(style)}
    >
      ${repeat(
        model.children,
        child => child.id,
        child => EdgelessBlockChild(child as (GroupBlockModel | ShapeBlockModel), host, viewport)
      )}
    </div>
  `;
}

@customElement('edgeless-selected-rect')
export class EdgelessSelectedRect extends LitElement {
  @property({ type: Boolean })
  lock!: boolean;

  @property({ type: Number })
  zoom!: number;

  @property({ type: Object })
  state!: BlockSelectionState;

  @property({ type: Object })
  rect!: DOMRect;

  private _dragStartInfo: {
    startMouseLeft: number,
    absoluteLeft: number
    width: number
    direction: HandleDirection
  } = {
    startMouseLeft: 0,
    absoluteLeft: 0,
    width: 0,
    direction: HandleDirection.Left,
  };

  private _getHandles(rect: DOMRect, isShape: boolean) {
    if (isShape) {
      // todo: four corners
      const leftTop = [
        rect.x,
        rect.y
      ];
      const rightTop = [
        rect.x + rect.width,
        rect.y
      ]
      const leftBottom = [
        rect.x,
        rect.y + rect.height
      ]
      const rightBottom = [
        rect.x + rect.width,
        rect.y + rect.height
      ]
      return html`
        ${Handle(leftTop[0], leftTop[1], HandleDirection.LeftTop)}
        ${Handle(rightTop[0], rightTop[1], HandleDirection.RightTop)}
        ${Handle(leftBottom[0], leftBottom[1], HandleDirection.LeftBottom)}
        ${Handle(rightBottom[0], rightBottom[1], HandleDirection.RightBottom)}
      `
    } else {
      let handles: TemplateResult | null = null;
      if (this.state.type === 'none') return handles;
      if (!this.state.active) {
        const leftCenter = [
          rect.x,
          rect.y + rect.height / 2 + (PADDING_Y * this.zoom) /
          2,
        ];
        const rightCenter = [
          rect.x + rect.width + PADDING_X * this.zoom,
          rect.y + rect.height / 2 + (PADDING_Y * this.zoom) /
          2,
        ];
        const handleLeft = Handle(
          leftCenter[0],
          leftCenter[1],
          HandleDirection.Left,
          this._onHandleMouseDown
        );
        const handleRight = Handle(
          rightCenter[0],
          rightCenter[1],
          HandleDirection.Right,
          this._onHandleMouseDown
        );
        handles = html` ${handleLeft}${handleRight} `;
      }
      return handles;
    }
  }

  private _onHandleMouseDown = (e: MouseEvent, direction: HandleDirection) => {
    // prevent selection action being fired
    e.stopPropagation();
    if (this.state?.type !== 'none') {
      const {
        rect,
        selected: { xywh },
      } = this.state;
      const [x] = JSON.parse(xywh) as XYWH;
      this._dragStartInfo = {
        startMouseLeft: e.clientX,
        absoluteLeft: x,
        // the width of the selected group may 0 after init use rect.width instead
        width: rect.width,
        direction,
      };
      // parent ele is the edgeless block container
      this.parentElement?.addEventListener('mousemove', this._onDragMove);
      this.parentElement?.addEventListener('mouseup', this._onDragEnd);
    }
  };

  private _onDragMove = (e: MouseEvent) => {
    let newX = 0;
    let newW = 0;
    if (this.state.type === 'single') {
      const { selected, viewport } = this.state;
      const { xywh } = selected;
      const [x, y, w] = JSON.parse(xywh) as XYWH;
      const minus = this._dragStartInfo.startMouseLeft - e.clientX;
      switch (this._dragStartInfo.direction) {
        case HandleDirection.Left: {
          newX = this._dragStartInfo.absoluteLeft - minus / this.zoom;
          newW = (this._dragStartInfo.width + minus) / this.zoom;
          break;
        }
        case HandleDirection.Right: {
          newX = x;
          newW = (this._dragStartInfo.width - minus) / this.zoom;
          break
        }
      }
      // limit the width of the selected group
      if (newW < GROUP_MIN_LENGTH) {
        newW = GROUP_MIN_LENGTH;
        newX = x;
      }
      // if xywh do not change, no need to update
      if (newW === w && newX === x) {
        return;
      }
      const groupBlock = getBlockById<'div'>(selected.id);
      const groupContainer = groupBlock?.parentElement;
      // first change container`s x/w directly for get groups real height
      if (groupContainer) {
        groupContainer.style.width = newW + 'px';
        groupContainer.style.translate = `translate(${newX}px, ${y}px) scale(${this.zoom})`;
      }
      // reset the width of the container may trigger animation
      requestAnimationFrame(() => {
        // refresh xywh by model
        if (!this.lock) {
          selected.page.captureSync();
          this.lock = true;
        }
        if (this.state.type !== 'none') {
          this.state.rect = getSelectionBoxBound(viewport, selected.xywh);
        } else {
          console.error('unexpected state.type:', this.state.type);
        }
        const newXywh = JSON.stringify([
          newX,
          y,
          newW,
          (groupBlock?.getBoundingClientRect().height || 0) / this.zoom,
        ]);
        selected.xywh = newXywh;
        selected.page.updateBlock(selected, { xywh: newXywh });
      });
    }
  };

  private _onDragEnd = (_: MouseEvent) => {
    this.lock = false;
    this.parentElement?.removeEventListener('mousemove', this._onDragMove);
    this.parentElement?.removeEventListener('mouseup', this._onDragEnd);
  };

  render() {
    if (this.state.type === 'none') return html``;
    const isShape = this.state.selected.flavour === 'affine:shape';
    const style = {
      border: `${
        this.state.active ? 2 : 1
      }px solid var(--affine-primary-color)`,
      ...getCommonRectStyle(this.rect, this.zoom, isShape),
    };

    return html`
      ${this._getHandles(this.rect, isShape)}
      <div class="affine-edgeless-selected-rect" style=${styleMap(style)}></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-selected-rect': EdgelessSelectedRect;
  }
}
