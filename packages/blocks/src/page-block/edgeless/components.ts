import { html, LitElement, PropertyValueMap, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { repeat } from 'lit/directives/repeat.js';
import type { BaseBlockModel } from '@blocksuite/store';

import type { GroupBlockModel } from '../..';
import type {
  BlockSelectionState,
  ViewportState,
  XYWH,
} from './selection-manager';
import { BlockElement, BlockHost, getBlockById } from '../../__internal__';
import '../../__internal__';
import { PADDING_X, PADDING_Y, GROUP_MIN_LENGTH } from './utils';

function getCommonRectStyle(rect: DOMRect, zoom: number) {
  return {
    position: 'absolute',
    left: rect.x + 'px',
    top: rect.y + 'px',
    width: rect.width + PADDING_X * zoom + 'px',
    height: rect.height + PADDING_Y * zoom + 'px',
    borderRadius: `${10 * zoom}px`,
    pointerEvents: 'none',
    boxSizing: 'border-box',
  };
}

export function EdgelessHoverRect(rect: DOMRect | null, zoom: number) {
  if (!rect) return html`<div></div>`;

  const style = {
    ...getCommonRectStyle(rect, zoom),
    border: '1px solid var(--affine-primary-color)',
  };

  return html`
    <div class="affine-edgeless-hover-rect" style=${styleMap(style)}></div>
  `;
}

function Handle(
  centerX: number,
  centerY: number,
  handleType: 'left' | 'right',
  onMouseDown?: (e: MouseEvent, type: 'left' | 'right') => void
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
    cursor: 'ew-resize',
  };

  const handlerMouseDown = (e: MouseEvent) => {
    onMouseDown && onMouseDown(e, handleType);
  };

  return html`
    <div style=${styleMap(style)} @mousedown=${handlerMouseDown}></div>
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
  model: GroupBlockModel,
  host: BlockHost,
  viewport: ViewportState
) {
  const { xywh } = model;
  const { zoom, viewportX, viewportY } = viewport;
  const [modelX, modelY, modelW, modelH] = JSON.parse(xywh) as XYWH;
  const translateX = (modelX - viewportX) * zoom;
  const translateY = (modelY - viewportY) * zoom;

  const style = {
    position: 'absolute',
    transform: `translate(${translateX}px, ${translateY}px) scale(${zoom})`,
    transformOrigin: '0 0',
    width: modelW + PADDING_X + 'px',
    height: modelH + PADDING_Y + 'px',
    padding: `${PADDING_X / 2}px`,
    background: 'white',
  };

  return html`
    <div class="affine-edgeless-block-child" style=${styleMap(style)}>
      ${BlockElement(model, host)}
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
        child => EdgelessBlockChild(child as GroupBlockModel, host, viewport)
      )}
    </div>
  `;
}

@customElement('edgeless-selected-rect')
export class EdgelessSelectedRect extends LitElement {
  @property({ type: Number })
  zoom!: number;

  @property({ type: Object })
  state!: BlockSelectionState;

  @property({ type: Object })
  rect!: DOMRect;

  private _dragStartInfo = {
    startMouseLeft: 0,
    absoluteLeft: 0,
    width: 0,
    direction: 'left',
  };

  private getHandles(rect: DOMRect) {
    let handles: TemplateResult | null = null;
    if (this.state.type === 'none') return handles;
    if (!this.state.active) {
      const leftCenter = [
        rect.x,
        rect.y + rect.height / 2 + (PADDING_Y * this.zoom) / 2,
      ];
      const rightCenter = [
        rect.x + rect.width + PADDING_X * this.zoom,
        rect.y + rect.height / 2 + (PADDING_Y * this.zoom) / 2,
      ];
      const handleLeft = Handle(
        leftCenter[0],
        leftCenter[1],
        'left',
        this._onHandleMouseDown
      );
      const handleRight = Handle(
        rightCenter[0],
        rightCenter[1],
        'right',
        this._onHandleMouseDown
      );
      handles = html` ${handleLeft}${handleRight} `;
    }
    return handles;
  }

  private _onHandleMouseDown = (e: MouseEvent, type: 'left' | 'right') => {
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
        direction: type,
      };
      // parent ele is the edgeless block container
      this.parentElement?.addEventListener('mousemove', this._onDrag);
      this.parentElement?.addEventListener('mouseup', this._onDragEnd);
    }
  };

  private _onDrag = (e: MouseEvent) => {
    let newX = 0;
    let newW = 0;
    if (this.state.type !== 'none') {
      const {
        selected,
        selected: { space, xywh },
      } = this.state;
      const [x, y, w, h] = JSON.parse(xywh) as XYWH;
      const minus = this._dragStartInfo.startMouseLeft - e.clientX;
      if (this._dragStartInfo.direction === 'left') {
        newX = this._dragStartInfo.absoluteLeft - minus / this.zoom;
        newW = (this._dragStartInfo.width + minus) / this.zoom;
      } else {
        newX = x;
        newW = (this._dragStartInfo.width - minus) / this.zoom;
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
      // refresh xywh by model
      space.updateBlock(selected, {
        xywh: JSON.stringify([
          newX,
          y,
          newW,
          (groupBlock?.getBoundingClientRect().height || 0) / this.zoom,
        ]),
      });
    }
  };

  private _onDragEnd = (e: MouseEvent) => {
    this.parentElement?.removeEventListener('mousemove', this._onDrag);
    this.parentElement?.removeEventListener('mouseup', this._onDragEnd);
  };

  render() {
    if (this.state.type === 'none') return html``;
    const style = {
      border: `${
        this.state.active ? 2 : 1
      }px solid var(--affine-primary-color)`,
      ...getCommonRectStyle(this.rect, this.zoom),
    };

    return html`
      ${this.getHandles(this.rect)}
      <div class="affine-edgeless-selected-rect" style=${styleMap(style)}></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-selected-rect': EdgelessSelectedRect;
  }
}
