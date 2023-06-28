import { MinusIcon, PlusIcon, ViewBarIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '@blocksuite/phasor';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import {
  clamp,
  type EdgelessTool,
  Point,
  stopPropagation,
} from '../../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

export type ZoomAction = 'fit' | 'out' | 'reset' | 'in';

@customElement('edgeless-zoom-toolbar')
export class EdgelessZoomToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      position: fixed;
      z-index: var(--affine-z-index-popover);
      bottom: 28px;
      left: 28px;
      display: flex;
      justify-content: center;
      user-select: none;
    }

    .edgeless-zoom-toolbar-container {
      display: flex;
      align-items: center;
      flex-direction: row;
      background: transparent;
      border-radius: 8px;
      fill: currentcolor;
    }

    .edgeless-zoom-toolbar-container[level='second'] {
      position: absolute;
      bottom: 8px;
      transform: translateY(-100%);
    }

    .edgeless-zoom-toolbar-container[hidden] {
      display: none;
    }

    .zoom-percent {
      display: block;
      box-sizing: border-box;
      width: 48px;
      height: 32px;
      line-height: 22px;
      padding: 5px;
      border-radius: 5px;
      font-size: 14px;
      font-weight: 500;
      text-align: center;
      cursor: pointer;
      color: var(--affine-icon-color);
    }

    .zoom-percent:hover {
      color: var(--affine-primary-color);
      background-color: var(--affine-hover-color);
    }
  `;

  edgeless: EdgelessPageBlockComponent;

  constructor(edgeless: EdgelessPageBlockComponent) {
    super();
    this.edgeless = edgeless;
  }

  get edgelessTool() {
    return this.edgeless.edgelessTool;
  }

  get zoom() {
    return this.edgeless.surface.viewport.zoom;
  }

  private _rafId: number | null = null;

  private _setCenter(x: number, y: number) {
    this.edgeless.surface.viewport.setCenter(x, y);
    this.edgeless.slots.viewportUpdated.emit();
  }

  private _setZoom(zoom: number, focusPoint?: Point) {
    this.edgeless.surface.viewport.setZoom(zoom, focusPoint);
    this.edgeless.slots.viewportUpdated.emit();
  }

  private _setZoomByStep(step: number) {
    this._smoothZoom(clamp(this.zoom + step, ZOOM_MIN, ZOOM_MAX));
  }

  private _smoothZoom(zoom: number, focusPoint?: Point) {
    const delta = zoom - this.zoom;

    const innerSmoothZoom = () => {
      if (this._rafId) cancelAnimationFrame(this._rafId);
      this._rafId = requestAnimationFrame(() => {
        const sign = delta > 0 ? 1 : -1;
        const total = 10;
        const step = delta / total;
        const nextZoom = this._cutoff(this.zoom + step, zoom, sign);

        this._setZoom(nextZoom, focusPoint);
        if (nextZoom != zoom) innerSmoothZoom();
      });
    };
    innerSmoothZoom();
  }

  private _cutoff(value: number, ref: number, sign: number) {
    if (sign > 0 && value > ref) return ref;
    if (sign < 0 && value < ref) return ref;
    return value;
  }

  private _zoomToFit() {
    const { centerX, centerY, zoom } = this.edgeless.getFitToScreenData();
    const { viewport } = this.edgeless.surface;
    const preZoom = this.zoom;
    const newZoom = zoom;
    const cofficient = preZoom / newZoom;
    if (cofficient === 1) {
      this._smoothTranslate(centerX, centerY);
    } else {
      const center = new Point(viewport.centerX, viewport.centerY);
      const newCenter = new Point(centerX, centerY);
      const focusPoint = newCenter
        .subtract(center.scale(cofficient))
        .scale(1 / (1 - cofficient));
      this._smoothZoom(zoom, focusPoint);
    }
  }

  private _smoothTranslate(x: number, y: number) {
    const { viewport } = this.edgeless.surface;
    const delta = { x: x - viewport.centerX, y: y - viewport.centerY };
    const innerSmoothTranslate = () => {
      if (this._rafId) cancelAnimationFrame(this._rafId);
      this._rafId = requestAnimationFrame(() => {
        const rate = 10;
        const step = { x: delta.x / rate, y: delta.y / rate };
        const nextCenter = {
          x: viewport.centerX + step.x,
          y: viewport.centerY + step.y,
        };
        const signX = delta.x > 0 ? 1 : -1;
        const signY = delta.y > 0 ? 1 : -1;
        nextCenter.x = this._cutoff(nextCenter.x, x, signX);
        nextCenter.y = this._cutoff(nextCenter.y, y, signY);
        this._setCenter(nextCenter.x, nextCenter.y);
        if (nextCenter.x != x || nextCenter.y != y) innerSmoothTranslate();
      });
    };
    innerSmoothTranslate();
  }

  setEdgelessTool = (edgelessTool: EdgelessTool) => {
    this.edgeless.selection.setEdgelessTool(edgelessTool);
  };

  setZoomByAction(action: ZoomAction) {
    switch (action) {
      case 'fit':
        this._zoomToFit();
        break;
      case 'reset':
        this._smoothZoom(1.0);
        break;
      case 'in':
      case 'out':
        this._setZoomByStep(ZOOM_STEP * (action === 'in' ? 1 : -1));
    }
  }

  override firstUpdated() {
    const {
      _disposables,
      edgeless: { slots },
    } = this;
    _disposables.add(slots.edgelessToolUpdated.on(() => this.requestUpdate()));
    _disposables.add(slots.viewportUpdated.on(() => this.requestUpdate()));
  }

  override render() {
    const formattedZoom = `${Math.round(this.zoom * 100)}%`;

    return html`
      <div
        class="edgeless-zoom-toolbar-container"
        @dblclick=${stopPropagation}
        @mousedown=${stopPropagation}
        @mouseup=${stopPropagation}
        @pointerdown=${stopPropagation}
      >
        <edgeless-tool-icon-button
          .tooltip=${'Fit to screen'}
          @click=${() => this._zoomToFit()}
        >
          ${ViewBarIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .tooltip=${'Zoom out'}
          @click=${() => this._setZoomByStep(-ZOOM_STEP)}
        >
          ${MinusIcon}
        </edgeless-tool-icon-button>
        <span class="zoom-percent" @click=${() => this._smoothZoom(1)}>
          ${formattedZoom}
        </span>
        <edgeless-tool-icon-button
          .tooltip=${'Zoom in'}
          @click=${() => this._setZoomByStep(ZOOM_STEP)}
        >
          ${PlusIcon}
        </edgeless-tool-icon-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-zoom-toolbar': EdgelessZoomToolbar;
  }
}
