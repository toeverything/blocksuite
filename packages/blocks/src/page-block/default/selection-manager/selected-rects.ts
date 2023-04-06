import { DisposableGroup } from '@blocksuite/global/utils';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { PageViewport } from './selection-state.js';

@customElement('affine-page-selected-rects')
export class AffinePageSelectedRects extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      pointer-events: none;
    }

    :host([data-grab]) {
      pointer-events: auto;
    }

    :host([data-grab]:hover) {
      cursor: grab;
    }

    :host > div {
      position: absolute;
      border-radius: 5px;
      background: var(--affine-selected-color);
    }
  `;

  private _disposables: DisposableGroup = new DisposableGroup();

  private _onMouseUp({ clientX, clientY }: MouseEvent) {
    this.removeAttribute('data-grab');
    this.mouseRoot.dispatchEvent(
      new MouseEvent('mouseup', {
        bubbles: true,
        clientX,
        clientY,
      })
    );
  }

  @property()
  mouseRoot!: HTMLElement;

  @property()
  viewport!: PageViewport;

  @property()
  state: { rects: DOMRect[]; grab: boolean } = { rects: [], grab: false };

  connectedCallback() {
    super.connectedCallback();

    // trigger click of editor container
    this._disposables.addFromEvent(this, 'mouseup', this._onMouseUp);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
  }

  protected willUpdate() {
    const { rects, grab } = this.state;
    const firstRect = rects[0];
    if (firstRect) {
      const { left, top, scrollLeft, scrollTop } = this.viewport;
      const startTop = firstRect.top - top + scrollTop;
      const startLeft = firstRect.left - left + scrollLeft;
      this.style.top = `${startTop}px`;
      this.style.left = `${startLeft}px`;
    }
    this.toggleAttribute('data-grab', grab);
  }

  render() {
    const { rects } = this.state;
    const firstRect = rects[0];
    return firstRect
      ? repeat(
          rects,
          rect => html`<div
            style=${styleMap({
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              top: `${rect.top - firstRect.top}px`,
              left: `${rect.left - firstRect.left}px`,
            })}
          ></div>`
        )
      : nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-page-selected-rects': AffinePageSelectedRects;
  }
}
