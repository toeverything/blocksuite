import { WithDisposable } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  MinusIcon,
  PlusIcon,
  ViewBarIcon,
} from '../../../_common/icons/edgeless.js';
import { stopPropagation } from '../../../_common/utils/event.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { EdgelessTool } from '../../edgeless/types.js';
import { ZOOM_STEP } from '../../edgeless/utils/viewport.js';

@customElement('edgeless-zoom-toolbar')
export class EdgelessZoomToolbar extends WithDisposable(LitElement) {
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

  get locked() {
    return this.edgelessService.locked;
  }

  static override styles = css`
    :host {
      display: flex;
    }

    .edgeless-zoom-toolbar-container {
      display: flex;
      align-items: center;
      background: transparent;
      border-radius: 8px;
      fill: currentcolor;
      padding: 4px;
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
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 32px;
      border: none;
      box-sizing: border-box;
      padding: 4px;
      color: var(--affine-icon-color);
      background-color: transparent;
      border-radius: 4px;
      cursor: pointer;
      white-space: nowrap;
      font-size: 12px;
      font-weight: 500;
      text-align: center;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    }

    .zoom-percent:hover {
      color: var(--affine-primary-color);
      background-color: var(--affine-hover-color);
    }

    .zoom-percent[disabled] {
      pointer-events: none;
      cursor: not-allowed;
      color: var(--affine-text-disable-color);
    }
  `;

  @property({ attribute: false })
  accessor layout: 'horizontal' | 'vertical' = 'horizontal';

  @property({ attribute: false })
  accessor edgeless: EdgelessRootBlockComponent;

  constructor(edgeless: EdgelessRootBlockComponent) {
    super();
    this.edgeless = edgeless;
  }

  private _isVerticalBar() {
    return this.layout === 'vertical';
  }

  setEdgelessTool = (edgelessTool: EdgelessTool) => {
    this.edgeless.tools.setEdgelessTool(edgelessTool);
  };

  override firstUpdated() {
    const { disposables } = this;
    disposables.add(
      this.edgeless.service.viewport.viewportUpdated.on(() =>
        this.requestUpdate()
      )
    );
    disposables.add(
      this.edgeless.slots.edgelessToolUpdated.on(() => this.requestUpdate())
    );
    disposables.add(
      this.edgeless.slots.readonlyUpdated.on(() => {
        this.requestUpdate();
      })
    );
  }

  override render() {
    if (this.edgeless.doc.readonly) {
      return nothing;
    }

    const formattedZoom = `${Math.round(this.zoom * 100)}%`;
    const classes = `edgeless-zoom-toolbar-container ${this.layout}`;
    const locked = this.locked;

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
          .iconContainerPadding=${4}
          .disabled=${locked}
        >
          ${ViewBarIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button
          .tooltip=${'Zoom out'}
          .tipPosition=${this._isVerticalBar() ? 'right' : 'top'}
          .arrow=${!this._isVerticalBar()}
          @click=${() => this.edgelessService.setZoomByStep(-ZOOM_STEP)}
          .iconContainerPadding=${4}
          .disabled=${locked}
        >
          ${MinusIcon}
        </edgeless-tool-icon-button>
        <button
          class="zoom-percent"
          @click=${() => this.viewport.smoothZoom(1)}
          .disabled=${locked}
        >
          ${formattedZoom}
        </button>
        <edgeless-tool-icon-button
          .tooltip=${'Zoom in'}
          .tipPosition=${this._isVerticalBar() ? 'right' : 'top'}
          .arrow=${!this._isVerticalBar()}
          @click=${() => this.edgelessService.setZoomByStep(ZOOM_STEP)}
          .iconContainerPadding=${4}
          .disabled=${locked}
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
