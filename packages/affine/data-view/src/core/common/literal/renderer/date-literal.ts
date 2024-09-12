import { format } from 'date-fns/format';
import { html } from 'lit';

import { LiteralElement } from './literal-element.js';

export class DateLiteral extends LiteralElement<number> {
  override render() {
    return this.value
      ? format(new Date(this.value), 'yyyy/MM/dd')
      : html`<span class="dv-color-2">Value</span>`;
  }
}
