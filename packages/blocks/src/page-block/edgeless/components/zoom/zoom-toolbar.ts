import { WithDisposable } from '@blocksuite/lit';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
  MinusIcon,
  PlusIcon,
  ViewBarIcon,
} from '../../../../_common/icons/index.js';
import {
  type EdgelessTool,
  stopPropagation,
} from '../../../../_common/utils/index.js';
import { ZOOM_STEP } from '../../../../surface-block/index.js';
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
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    }

    .zoom-percent:hover {
      color: var(--affine-primary-color);
      background-color: var(--affine-hover-color);
    }
  `;

  @state()
  private _hide = false;

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

  get edgelessService() {
    return this.edgeless.service;
  }

  get zoom() {
    return this.viewport.zoom;
  }

  get viewport() {
    return this.edgelessService.viewport;
  }

  setEdgelessTool = (edgelessTool: EdgelessTool) => {
    this.edgeless.tools.setEdgelessTool(edgelessTool);
  };

  override firstUpdated() {
    const {
      _disposables,
      edgeless: { slots },
    } = this;
    _disposables.add(
      slots.edgelessToolUpdated.on(tool => {
        if (tool.type !== 'frameNavigator') {
          this._hide = false;
        }
        this.requestUpdate();
      })
    );
    _disposables.add(
      this.edgeless.service.viewport.viewportUpdated.on(() =>
        this.requestUpdate()
      )
    );
    _disposables.add(
      slots.navigatorSettingUpdated.on(({ hideToolbar }) => {
        if (hideToolbar !== undefined) {
          this._hide = hideToolbar;
        }
      })
    );
  }

  override render() {
    const formattedZoom = `${Math.round(this.zoom * 100)}%`;
    const classes = `edgeless-zoom-toolbar-container ${this.layout}`;
    if (this._hide) return nothing;

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
          @click=${() => this.edgelessService.zoomToFit()}
        >
          ${ViewBarIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .tooltip=${'Zoom out'}
          .tipPosition=${this._isVerticalBar() ? 'right' : 'top'}
          .arrow=${!this._isVerticalBar()}
          @click=${() => this.edgelessService.setZoomByStep(-ZOOM_STEP)}
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
          @click=${() => this.edgelessService.setZoomByStep(ZOOM_STEP)}
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
