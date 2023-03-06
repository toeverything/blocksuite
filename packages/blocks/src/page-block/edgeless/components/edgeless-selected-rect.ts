import type { SurfaceViewport } from '@blocksuite/phasor';
import {
  deserializeXYWH,
  serializeXYWH,
  SurfaceManager,
} from '@blocksuite/phasor';
import { Page } from '@blocksuite/store';
import { html, LitElement, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { getBlockById } from '../../../__internal__/index.js';
import type { EdgelessSelectionState } from '../selection-manager.js';
import {
  FRAME_MIN_LENGTH,
  getSelectionBoxBound,
  getXYWH,
  isTopLevelBlock,
  PADDING_X,
  PADDING_Y,
} from '../utils.js';
import { HandleDirection, SelectedHandle } from './selected-handle.js';
import { getCommonRectStyle } from './utils.js';

@customElement('edgeless-selected-rect')
export class EdgelessSelectedRect extends LitElement {
  @property({ type: Page })
  page!: Page;

  @property({ type: SurfaceManager })
  surface!: SurfaceManager;

  @property({ type: Boolean })
  lock!: boolean;

  @property()
  viewport!: SurfaceViewport;

  @property({ type: Number })
  zoom!: number;

  @property({ type: Object })
  state!: EdgelessSelectionState;

  @property({ type: Object })
  rect!: DOMRect;

  private _dragStartInfo: {
    startMouseX: number;
    startMouseY: number;
    absoluteX: number;
    absoluteY: number;
    width: number;
    height: number;
    direction: HandleDirection;
  } = {
    startMouseX: 0,
    startMouseY: 0,
    absoluteX: 0,
    absoluteY: 0,
    width: 0,
    height: 0,
    direction: HandleDirection.Left,
  };

  private _getHandles(rect: DOMRect, isSurfaceElement: boolean) {
    if (isSurfaceElement) {
      const leftTop = [rect.x, rect.y];
      const rightTop = [rect.x + rect.width, rect.y];
      const leftBottom = [rect.x, rect.y + rect.height];
      const rightBottom = [rect.x + rect.width, rect.y + rect.height];
      return html`
        ${SelectedHandle(
          leftTop[0],
          leftTop[1],
          HandleDirection.LeftTop,
          this._onHandleMouseDown
        )}
        ${SelectedHandle(
          rightTop[0],
          rightTop[1],
          HandleDirection.RightTop,
          this._onHandleMouseDown
        )}
        ${SelectedHandle(
          leftBottom[0],
          leftBottom[1],
          HandleDirection.LeftBottom,
          this._onHandleMouseDown
        )}
        ${SelectedHandle(
          rightBottom[0],
          rightBottom[1],
          HandleDirection.RightBottom,
          this._onHandleMouseDown
        )}
      `;
    } else {
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
        const handleLeft = SelectedHandle(
          leftCenter[0],
          leftCenter[1],
          HandleDirection.Left,
          this._onHandleMouseDown
        );
        const handleRight = SelectedHandle(
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
    if (this.state?.type === 'single') {
      const { rect, selected } = this.state;
      const [x, y] = deserializeXYWH(getXYWH(selected));

      this._dragStartInfo = {
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        absoluteX: x,
        absoluteY: y,
        // the width of the selected frame may 0 after init use rect.width instead
        width: rect.width,
        height: rect.height,
        direction,
      };
      // parent ele is the edgeless block container
      this.parentElement?.addEventListener('mousemove', this._onDragMove);
      this.parentElement?.addEventListener('mouseup', this._onDragEnd);
    }
  };

  private _onDragMove = (e: MouseEvent) => {
    if (this.state.type === 'single') {
      const { viewport } = this;
      const { selected } = this.state;

      const xywh = getXYWH(selected);
      const [x, y, w, h] = deserializeXYWH(xywh);
      let newX = x;
      let newY = y;
      let newW = w;
      let newH = h;
      const deltaX = this._dragStartInfo.startMouseX - e.clientX;
      const deltaY = this._dragStartInfo.startMouseY - e.clientY;
      const direction = this._dragStartInfo.direction;
      switch (direction) {
        case HandleDirection.RightTop:
          newY = this._dragStartInfo.absoluteY - deltaY / this.zoom;
          newW = (this._dragStartInfo.width - deltaX) / this.zoom;
          newH = (this._dragStartInfo.height + deltaY) / this.zoom;
          break;
        case HandleDirection.LeftBottom:
          newX = this._dragStartInfo.absoluteX - deltaX / this.zoom;
          newW = (this._dragStartInfo.width + deltaX) / this.zoom;
          newH = (this._dragStartInfo.height - deltaY) / this.zoom;
          break;
        case HandleDirection.RightBottom:
          newW = (this._dragStartInfo.width - deltaX) / this.zoom;
          newH = (this._dragStartInfo.height - deltaY) / this.zoom;
          break;
        case HandleDirection.LeftTop: {
          newY = this._dragStartInfo.absoluteY - deltaY / this.zoom;
          newX = this._dragStartInfo.absoluteX - deltaX / this.zoom;
          newW = (this._dragStartInfo.width + deltaX) / this.zoom;
          newH = (this._dragStartInfo.height + deltaY) / this.zoom;
          break;
        }
        case HandleDirection.Left: {
          newX = this._dragStartInfo.absoluteX - deltaX / this.zoom;
          newW = (this._dragStartInfo.width + deltaX) / this.zoom;
          break;
        }
        case HandleDirection.Right: {
          newX = x;
          newW = (this._dragStartInfo.width - deltaX) / this.zoom;
          break;
        }
      }
      // limit the width of the selected frame
      if (newW < FRAME_MIN_LENGTH) {
        newW = FRAME_MIN_LENGTH;
        newX = x;
      }
      // limit the height of the selected frame
      if (newH < FRAME_MIN_LENGTH) {
        newH = FRAME_MIN_LENGTH;
        newY = y;
      }

      // if xywh do not change, no need to update
      if (newW === w && newX === x && newY === y && newW === w) {
        return;
      }

      if (!isTopLevelBlock(selected)) {
        if (!this.lock) {
          this.page.captureSync();
          this.lock = true;
        }
        this.surface.setElementBound(selected.id, {
          x: newX,
          y: newY,
          w: newW,
          h: newH,
        });
        this.state.rect = getSelectionBoxBound(
          viewport,
          serializeXYWH(newX, newY, newW, newH)
        );
        return;
      }

      const frameBlock = getBlockById<'div'>(selected.id);
      const frameContainer = frameBlock?.parentElement;
      // first change container`s x/w directly for get frames real height
      if (frameContainer) {
        frameContainer.style.width = newW + 'px';
        frameContainer.style.translate = `translate(${newX}px, ${newY}px) scale(${this.zoom})`;
      }
      // reset the width of the container may trigger animation
      requestAnimationFrame(() => {
        // refresh xywh by model
        if (!this.lock) {
          this.page.captureSync();
          this.lock = true;
        }
        if (this.state.type === 'single') {
          this.state.rect = getSelectionBoxBound(viewport, selected.xywh);
        } else {
          console.error('unexpected state.type:', this.state.type);
        }
        const newXywh = JSON.stringify([
          newX,
          newY,
          newW,
          (frameBlock?.getBoundingClientRect().height || 0) / this.zoom,
        ]);
        selected.xywh = newXywh;
        this.page.updateBlock(selected, { xywh: newXywh });
      });
    }
  };

  private _onDragEnd = (_: MouseEvent) => {
    this.lock = false;
    if (this.state.type === 'single') {
      this.page.captureSync();
    } else {
      console.error('unexpected state.type:', this.state.type);
    }
    this.parentElement?.removeEventListener('mousemove', this._onDragMove);
    this.parentElement?.removeEventListener('mouseup', this._onDragEnd);
  };

  render() {
    if (this.state.type === 'none') return null;

    const isSurfaceElement = !isTopLevelBlock(this.state.selected);
    // const isSurfaceElement = this.state.selected.flavour === 'affine:shape';
    const style = {
      border: `${
        this.state.active ? 2 : 1
      }px solid var(--affine-primary-color)`,
      ...getCommonRectStyle(this.rect, this.zoom, isSurfaceElement, true),
    };
    const handlers = this._getHandles(this.rect, isSurfaceElement);
    return html`
      ${this.page.readonly ? null : handlers}
      <div class="affine-edgeless-selected-rect" style=${styleMap(style)}></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-selected-rect': EdgelessSelectedRect;
  }
}
