import './toolbar/tool-icon-button.js';

import { MinusIcon, PlusIcon, ViewBarIcon } from '@blocksuite/global/config';
import { Bound, deserializeXYWH } from '@blocksuite/phasor';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { FrameBlockModel } from '../../frame-block/index.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';

const FIT_TO_SCREEN_PADDING = 100;

function getExpandedBound(a: Bound, b: Bound): Bound {
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxX = Math.max(a.x + a.w, b.x + b.w);
  const maxY = Math.max(a.y + a.h, b.y + b.h);
  const width = Math.abs(maxX - minX);
  const height = Math.abs(maxY - minY);

  return new Bound(minX, minY, width, height);
}

function getCommonBound(bounds: Bound[]) {
  if (bounds.length < 2) return bounds[0];

  let result = bounds[0];

  for (let i = 1; i < bounds.length; i++) {
    result = getExpandedBound(result, bounds[i]);
  }

  return result;
}

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
    this.edgeless.signals.viewportUpdated.emit();
  }

  private _zoomToFit() {
    const { width, height } = this.edgeless.viewport;
    const frame = this.edgeless.pageModel.children[0] as FrameBlockModel;
    const frameXYWH = deserializeXYWH(frame.xywh);

    const bound = getCommonBound([
      new Bound(...frameXYWH),
      ...this.edgeless.surface.elements,
    ]);
    const zoom = Math.min(
      (width - FIT_TO_SCREEN_PADDING) / bound.w,
      (height - FIT_TO_SCREEN_PADDING) / bound.h
    );
    const cx = bound.x + bound.w / 2;
    const cy = bound.y + bound.h / 2;
    this.edgeless.viewport.setZoom(zoom);
    this.edgeless.viewport.setCenter(cx, cy);
    this.edgeless.signals.viewportUpdated.emit();
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
