import { html } from 'lit';
import { query } from 'lit/decorators.js';

import { LiteralElement } from './literal-element.js';

export class StringLiteral extends LiteralElement<string> {
  @query('input')
  private _inputEle!: HTMLInputElement;

  override doneValue(): string {
    return this._inputEle.value;
  }
  override firstUpdated() {
    this._inputEle?.focus();
  }

  private _keydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.done();
    }
  }

  override edit() {
    return html`
      <input .value="${this.value ?? ''}" @keydown=${this._keydown} />
    `;
  }
}
