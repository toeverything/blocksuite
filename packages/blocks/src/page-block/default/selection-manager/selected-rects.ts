import { DisposableGroup } from '@blocksuite/global/utils';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { PageViewport } from './selection-state.js';

@customElement('affine-page-selected-rects')
export class PageSelectedRects extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      pointer-events: auto;
    }

    :host([enable]:hover) {
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
    this.style.pointerEvents = 'none';
    this.mouseRoot.dispatchEvent(
      new MouseEvent('mouseup', {
        bubbles: true,
        clientX,
        clientY,
      })
    );
  }

  @property()
  draggingArea: DOMRect | null = null;

  @property()
  mouseRoot!: HTMLElement;

  @property()
  viewport!: PageViewport;

  @property()
  rects: DOMRect[] = [];

  connectedCallback() {
    super.connectedCallback();

    const disposables = this._disposables;
    // trigger editor click
    disposables.addFromEvent(this, 'mouseup', this._onMouseUp);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
  }

  protected willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('draggingArea')) {
      this.toggleAttribute('enable', !this.draggingArea);
    }
    if (changedProperties.has('rects')) {
      const firstRect = this.rects[0];
      if (firstRect) {
        const { left, top, scrollLeft, scrollTop } = this.viewport;
        const startTop = firstRect.top - top + scrollTop;
        const startLeft = firstRect.left - left + scrollLeft;
        this.style.top = `${startTop}px`;
        this.style.left = `${startLeft}px`;
      } else {
        this.draggingArea = null;
        this.setAttribute('enable', '');
        this.style.pointerEvents = 'auto';
      }
    }
  }

  override render() {
    const firstRect = this.rects[0];
    return firstRect
      ? repeat(
          this.rects,
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
    'affine-page-selected-rects': PageSelectedRects;
  }
}
