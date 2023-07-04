import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('affine-note-cut-hintline')
export class NoteCutHint extends WithDisposable(LitElement) {
  @property()
  width!: number;

  static override styles = css`
    :host {
      visibility: hidden;
      z-index: 1;
      position: absolute;
      top: 0;
      left: 0;
    }

    .hint-line {
      height: 2px;
      box-shadow: 0px 4px 11px #3ab4f7;
      border-radius: 1px;
      background-color: var(--affine-blue-500);
      transform-origin: top left;
    }
  `;

  show(rect: DOMRect, zoom: number) {
    this.width = rect.width;
    this.style.height = `${rect.height * zoom}px`;
    this.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
    this.style.visibility = 'visible';
  }

  reset() {
    this.style.removeProperty('visibility');
    this.style.removeProperty('transform');
  }

  override render() {
    return html`<div class="hint-line" style="width: ${this.width}px"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-note-cut-hintline': NoteCutHint;
  }
}
