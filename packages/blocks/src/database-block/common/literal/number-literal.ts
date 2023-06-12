import { html } from 'lit';
import { query } from 'lit/decorators.js';

import { LiteralElement } from './literal-element.js';

export class NumberLiteral extends LiteralElement<number> {
  @query('input')
  private _inputEle!: HTMLInputElement;

  override doneValue(): number {
    return Number.parseFloat(this._inputEle.value);
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
      <input
        type="number"
        .value=${this.value ?? ''}
        @keydown=${this._keydown}
      />
    `;
  }
}
