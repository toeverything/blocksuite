import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { LiteralElement } from './literal-element.js';

@customElement('data-view-literal-string-view')
export class StringLiteral extends LiteralElement<string> {
  override render() {
    return html` ${this.value || 'Empty'} `;
  }
}
@customElement('data-view-literal-string-edit')
export class StringLiteralEdit extends LiteralElement<string> {
  override firstUpdated() {
    this.querySelector('input')?.focus();
  }
  override render() {
    return html` <input type="text" /> `;
  }
}
