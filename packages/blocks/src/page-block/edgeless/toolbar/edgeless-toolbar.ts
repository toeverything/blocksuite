import '../components/tool-icon-button.js';
import './shape-tool/shape-tool-button.js';
import './brush-tool/brush-tool-button.js';
import './connector-tool/connector-tool-button.js';
import './note-tool/note-tool-button.js';
import './image-tool-button.js';
import './eraser-tool-button.js';

import { HandIcon, NewTextIcon, SelectIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '@blocksuite/phasor';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { clamp, type MouseMode, Point } from '../../../__internal__/index.js';
import { getTooltipWithShortcut } from '../components/utils.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { stopPropagation } from '../utils.js';

export type ZoomAction = 'fit' | 'out' | 'reset' | 'in';

@customElement('edgeless-toolbar')
export class EdgelessToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      position: absolute;
      z-index: 3;
      bottom: 28px;
      left: calc(50%);
      display: flex;
      justify-content: center;
      transform: translateX(-50%);
      user-select: none;
    }

    .edgeless-toolbar-container {
      display: flex;
      align-items: center;
      flex-direction: row;
      padding: 0 20px;
      height: 64px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 40px;
      fill: currentcolor;
    }

    .edgeless-toolbar-container[level='second'] {
      position: absolute;
      bottom: 8px;
      transform: translateY(-100%);
    }

    .edgeless-toolbar-container[hidden] {
      display: none;
    }

    .short-divider {
      width: 1px;
      height: 24px;
      margin: 0 7px;
      background-color: var(--affine-border-color);
    }

    .full-divider {
      width: 1px;
      height: 100%;
      margin: 0 7px;
      background-color: var(--affine-border-color);
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

  get mouseMode() {
    return this.edgeless.mouseMode;
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

  setMouseMode = (mouseMode: MouseMode) => {
    this.edgeless.selection.setMouseMode(mouseMode);
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

  private iconButtonStyles = `
    --hover-color: var(--affine-hover-color);
    --active-color: var(--affine-primary-color);
  `;

  override firstUpdated() {
    const {
      _disposables,
      edgeless: { slots },
    } = this;
    _disposables.add(slots.mouseModeUpdated.on(() => this.requestUpdate()));
    _disposables.add(slots.viewportUpdated.on(() => this.requestUpdate()));
  }

  override render() {
    const { type } = this.mouseMode;

    return html`
      <div
        class="edgeless-toolbar-container"
        @dblclick=${stopPropagation}
        @mousedown=${stopPropagation}
        @mouseup=${stopPropagation}
        @pointerdown=${stopPropagation}
      >
        <edgeless-tool-icon-button
          style=${this.iconButtonStyles}
          .tooltip=${getTooltipWithShortcut('Select', 'V')}
          .active=${type === 'default'}
          @click=${() => this.setMouseMode({ type: 'default' })}
        >
          ${SelectIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          style=${this.iconButtonStyles}
          .tooltip=${getTooltipWithShortcut('Hand', 'H')}
          .active=${type === 'pan'}
          @click=${() => this.setMouseMode({ type: 'pan', panning: false })}
        >
          ${HandIcon}
        </edgeless-tool-icon-button>
        <div class="short-divider"></div>
        <edgeless-note-tool-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
          .setMouseMode=${this.setMouseMode}
        ></edgeless-note-tool-button>
        <div class="full-divider"></div>
        <edgeless-brush-tool-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
          .setMouseMode=${this.setMouseMode}
        ></edgeless-brush-tool-button>
        <edgeless-eraser-tool-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
          .setMouseMode=${this.setMouseMode}
        >
        </edgeless-eraser-tool-button>
        <edgeless-text-icon-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
          .setMouseMode=${this.setMouseMode}
        ></edgeless-text-icon-button>
        <edgeless-shape-tool-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
          .setMouseMode=${this.setMouseMode}
        ></edgeless-shape-tool-button>
        <edgeless-image-tool-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
          .setMouseMode=${this.setMouseMode}
        >
        </edgeless-image-tool-button>
        <edgeless-connector-tool-button
          .mouseMode=${this.mouseMode}
          .edgeless=${this.edgeless}
          .setMouseMode=${this.setMouseMode}
        ></edgeless-connector-tool-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-toolbar': EdgelessToolbar;
  }
}
