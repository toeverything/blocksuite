import { MinusIcon, PlusIcon, ViewBarIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '@blocksuite/phasor';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  clamp,
  type EdgelessTool,
  stopPropagation,
} from '../../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

export type ZoomAction = 'fit' | 'out' | 'reset' | 'in';

@customElement('edgeless-zoom-toolbar')
export class EdgelessZoomToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      position: absolute;
      bottom: 20px;
      left: 12px;
      z-index: var(--affine-z-index-popover);
      display: flex;
      justify-content: center;
      user-select: none;
    }

    .edgeless-zoom-toolbar-container {
      display: flex;
      align-items: center;
      background: transparent;
      border-radius: 8px;
      fill: currentcolor;
    }

    .edgeless-zoom-toolbar-container.horizantal {
      flex-direction: row;
    }

    .edgeless-zoom-toolbar-container.vertical {
      flex-direction: column;
      width: 40px;
      background-color: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border: 1px solid var(--affine-border-color);
      border-radius: 8px;
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
      border-radius: 4px;
      font-size: 12px;
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

  @property({ attribute: false })
  layout: 'horizontal' | 'vertical' = 'horizontal';

  @property({ attribute: false })
  edgeless: EdgelessPageBlockComponent;

  private _isVerticalBar() {
    return this.layout === 'vertical';
  }

  constructor(edgeless: EdgelessPageBlockComponent) {
    super();
    this.edgeless = edgeless;
  }

  get edgelessTool() {
    return this.edgeless.edgelessTool;
  }

  get zoom() {
    return this.viewport.zoom;
  }

  get viewport() {
    return this.edgeless.surface.viewport;
  }

  private _setZoomByStep(step: number) {
    this.viewport.smoothZoom(clamp(this.zoom + step, ZOOM_MIN, ZOOM_MAX));
  }

  private _zoomToFit() {
    const { centerX, centerY, zoom } = this.edgeless.getFitToScreenData();
    this.viewport.setViewport(zoom, [centerX, centerY], true);
  }

  setEdgelessTool = (edgelessTool: EdgelessTool) => {
    this.edgeless.tools.setEdgelessTool(edgelessTool);
  };

  setZoomByAction(action: ZoomAction) {
    switch (action) {
      case 'fit':
        this._zoomToFit();
        break;
      case 'reset':
        this.viewport.smoothZoom(1.0);
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
    const classes = `edgeless-zoom-toolbar-container ${this.layout}`;

    return html`
      <div
        class=${classes}
        @dblclick=${stopPropagation}
        @mousedown=${stopPropagation}
        @mouseup=${stopPropagation}
        @pointerdown=${stopPropagation}
      >
        <edgeless-tool-icon-button
          .tooltip=${'Fit to screen'}
          .tipPosition=${this._isVerticalBar() ? 'right' : 'top-end'}
          .arrow=${!this._isVerticalBar()}
          @click=${() => this._zoomToFit()}
        >
          ${ViewBarIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .tooltip=${'Zoom out'}
          .tipPosition=${this._isVerticalBar() ? 'right' : 'top'}
          .arrow=${!this._isVerticalBar()}
          @click=${() => this._setZoomByStep(-ZOOM_STEP)}
        >
          ${MinusIcon}
        </edgeless-tool-icon-button>
        <span class="zoom-percent" @click=${() => this.viewport.smoothZoom(1)}>
          ${formattedZoom}
        </span>
        <edgeless-tool-icon-button
          .tooltip=${'Zoom in'}
          .tipPosition=${this._isVerticalBar() ? 'right' : 'top'}
          .arrow=${!this._isVerticalBar()}
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
