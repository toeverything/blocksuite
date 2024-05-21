import { WidgetElement } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { PageRootBlockComponent, RootBlockModel } from '../../index.js';

export const AFFINE_VIEWPORT_OVERLAY_WIDGET = 'affine-viewport-overlay-widget';

@customElement(AFFINE_VIEWPORT_OVERLAY_WIDGET)
export class AffineViewportOverlayWidget extends WidgetElement<
  RootBlockModel,
  PageRootBlockComponent
> {
  static override styles = css`
    .affine-viewport-overlay-widget {
      position: absolute;
      top: 0;
      left: 0;
      background: transparent;
      pointer-events: none;
      z-index: calc(var(--affine-z-index-popover) - 1);
    }

    .affine-viewport-overlay-widget.lock {
      pointer-events: auto;
    }
  `;

  @state()
  private accessor _lockViewport = false;

  lock() {
    this._lockViewport = true;
  }

  unlock() {
    this._lockViewport = false;
  }

  toggleLock() {
    this._lockViewport = !this._lockViewport;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent(
      'dragStart',
      () => {
        return this._lockViewport;
      },
      { global: true }
    );
    this.handleEvent(
      'pointerDown',
      () => {
        return this._lockViewport;
      },
      { global: true }
    );
    this.handleEvent(
      'click',
      () => {
        return this._lockViewport;
      },
      { global: true }
    );
  }

  override render() {
    const classes = classMap({
      'affine-viewport-overlay-widget': true,
      lock: this._lockViewport,
    });
    const style = styleMap({
      width: `${this._lockViewport ? '100vw' : '0'}`,
      height: `${this._lockViewport ? '100%' : '0'}`,
    });
    return html` <div class=${classes} style=${style}></div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_VIEWPORT_OVERLAY_WIDGET]: AffineViewportOverlayWidget;
  }
}
