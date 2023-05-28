import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { type IPoint } from '../__internal__/index.js';

@customElement('affine-selected-blocks')
export class AffineSelectedBlocks extends WithDisposable(LitElement) {
  static override styles = css`
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
      background: var(--affine-hover-color);
    }
  `;

  private _onPointerUp({ clientX, clientY, shiftKey }: PointerEvent) {
    this.removeAttribute('data-grab');
    document.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        clientX,
        clientY,
        shiftKey,
      })
    );
  }

  @property()
  mouseRoot!: HTMLElement;

  @property()
  offset: IPoint = { x: 0, y: 0 };

  @property()
  state: { rects: DOMRect[]; grab: boolean } = { rects: [], grab: false };

  override connectedCallback() {
    super.connectedCallback();
    // trigger click event on editor container
    this._disposables.addFromEvent(this, 'pointerup', this._onPointerUp);
  }

  override willUpdate() {
    const {
      rects: [firstRect],
      grab,
    } = this.state;
    if (firstRect) {
      const { x, y } = this.offset;
      this.style.top = `${firstRect.top + y}px`;
      this.style.left = `${firstRect.left + x}px`;
    }
    this.toggleAttribute('data-grab', Boolean(firstRect && grab));
  }

  override render() {
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
    'affine-selected-blocks': AffineSelectedBlocks;
  }
}
