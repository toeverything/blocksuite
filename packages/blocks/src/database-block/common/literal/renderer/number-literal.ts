import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { LiteralElement } from './literal-element.js';

@customElement('data-view-literal-number-view')
export class NumberLiteral extends LiteralElement<number> {
  override render() {
    return html` ${this.value || 'Empty'} `;
  }
}
@customElement('data-view-literal-number-edit')
export class NumberLiteralEdit extends LiteralElement<number> {
  override firstUpdated() {
    this.querySelector('input')?.focus();
  }
  override render() {
    return html` <input type="text" /> `;
  }
}
