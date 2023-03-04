import './toolbar/tool-icon-button.js';

import { MinusIcon, PlusIcon, ViewBarIcon } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import { Bound, deserializeXYWH, getCommonBound } from '@blocksuite/phasor';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { FrameBlockModel } from '../../frame-block/index.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';

const FIT_TO_SCREEN_PADDING = 200;

@customElement('edgeless-view-control-bar')
export class EdgelessViewControlBar extends LitElement {
  static styles = css`
    :host {
      position: absolute;
      z-index: 1;
      bottom: 28px;
      right: 89px;
      display: flex;
      justify-content: center;
    }

    .edgeless-view-control-bar-container {
      display: flex;
      align-items: center;
      height: 48px;
      background: var(--affine-page-background);
      box-shadow: 0 0 12px rgba(66, 65, 73, 0.14);
      border-radius: 8px;
      fill: currentColor;
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
    }

    .zoom-percent:hover {
      color: var(--affine-primary-color);
      background-color: var(--affine-hover-background);
    }
  `;

  @property()
  edgeless!: EdgelessPageBlockComponent;

  @property()
  zoom!: number;

  private _setZoom(zoom: number) {
    this.edgeless.viewport.setZoom(zoom);
    this.edgeless.slots.viewportUpdated.emit();
  }

  private _zoomToFit() {
    const { width, height } = this.edgeless.viewport;
    const frame = this.edgeless.pageModel.children[0] as FrameBlockModel;
    const frameXYWH = deserializeXYWH(frame.xywh);
    const frameBound = new Bound(...frameXYWH);

    const surfaceElementsBound = this.edgeless.surface.getElementsBound();

    const bound = surfaceElementsBound
      ? getCommonBound([frameBound, surfaceElementsBound])
      : frameBound;
    assertExists(bound);

    const zoom = Math.min(
      (width - FIT_TO_SCREEN_PADDING) / bound.w,
      (height - FIT_TO_SCREEN_PADDING) / bound.h
    );

    const cx = bound.x + bound.w / 2;
    const cy = bound.y + bound.h / 2;
    this.edgeless.viewport.setZoom(zoom);
    this.edgeless.viewport.setCenter(cx, cy);
    this.edgeless.slots.viewportUpdated.emit();
  }

  render() {
    const formattedZoom = `${Math.round(this.zoom * 100)}%`;
    return html`
      <div class="edgeless-view-control-bar-container">
        <edgeless-tool-icon-button
          @tool.click=${() => this._setZoom(this.edgeless.viewport.zoom - 0.1)}
        >
          ${MinusIcon}
        </edgeless-tool-icon-button>
        <span class="zoom-percent" @click=${() => this._setZoom(1)}
          >${formattedZoom}</span
        >
        <edgeless-tool-icon-button
          @tool.click=${() => this._setZoom(this.edgeless.viewport.zoom + 0.1)}
        >
          ${PlusIcon}
        </edgeless-tool-icon-button>
        <edgeless-tool-icon-button @tool.click=${() => this._zoomToFit()}>
          ${ViewBarIcon}
        </edgeless-tool-icon-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-view-control-bar': EdgelessViewControlBar;
  }
}
