import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('note-cut-indicator')
export class NoteCutIndicator extends WithDisposable(LitElement) {
  @property({ attribute: false })
  width!: number;

  static override styles = css`
    :host {
      visibility: hidden;
      z-index: 1;
      width: 1px;
      transition: width 0.1s ease-in-out;
    }

    .indicator-line {
      height: 2px;
      box-shadow: 0px 4px 11px #3ab4f7;
      border-radius: 1px;
      background-color: var(--affine-blue-500);
    }
  `;

  show() {
    requestAnimationFrame(() => {
      this.style.visibility = 'visible';

      requestAnimationFrame(() => {
        this.style.width = `${this.width}px`;
      });
    });
  }

  reset() {
    this.style.removeProperty('visibility');
    this.style.removeProperty('transform');
    this.style.removeProperty('width');
  }

  override render() {
    return html`<div class="indicator-line"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'note-cut-indicator': NoteCutIndicator;
  }
}
