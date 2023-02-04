import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { TextElement } from '../types.js';

@customElement('virgo-line')
export class VirgoLine extends LitElement {
  @property({ attribute: false })
  elements: TextElement[] = [];

  render() {
    return html`
      <style>
        virgo-line {
          display: block;
        }
      </style>
      <div>${this.elements}</div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'virgo-line': VirgoLine;
  }
}
