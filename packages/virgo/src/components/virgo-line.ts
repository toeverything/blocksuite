import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { BaseTextAttributes } from '../utils/index.js';
import type { VirgoText } from './virgo-text.js';

@customElement('virgo-line')
export class VirgoLine<
  TextAttributes extends BaseTextAttributes = BaseTextAttributes
> extends LitElement {
  @property({ attribute: false })
  elements: VirgoText<TextAttributes>[] = [];

  get textLength() {
    return this.elements.reduce((acc, el) => acc + el.delta.insert.length, 0);
  }

  get textContent() {
    return this.elements.reduce((acc, el) => acc + el.delta.insert, '');
  }

  render() {
    return html`<style>
        virgo-line {
          display: block;
        }
      </style>
      <div>${this.elements}</div>`;
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
