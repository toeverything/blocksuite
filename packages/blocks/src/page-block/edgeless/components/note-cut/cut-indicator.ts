import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('note-cut-indicator')
export class NoteCutIndicator extends WithDisposable(LitElement) {
  @property()
  width!: number;

  static override styles = css`
    :host {
      visibility: hidden;
      z-index: 1;
    }

    .indicator-line {
      height: 2px;
      box-shadow: 0px 4px 11px #3ab4f7;
      border-radius: 1px;
      background-color: var(--affine-blue-500);
      transform-origin: top left;
    }
  `;

  show(width: number) {
    this.width = width;
    this.style.visibility = 'visible';
  }

  reset() {
    this.style.removeProperty('visibility');
  }

  override render() {
    return html`<div
      class="indicator-line"
      style="width: ${this.width}px"
    ></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'note-cut-indicator': NoteCutIndicator;
  }
}
