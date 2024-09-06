import { format } from 'date-fns/format';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { LiteralElement } from './literal-element.js';

@customElement('data-view-literal-date-view')
export class DateLiteral extends LiteralElement<number> {
  override render() {
    return this.value
      ? format(new Date(this.value), 'yyyy/MM/dd')
      : html`<span class="dv-color-2">Value</span>`;
  }
}
