import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('database-number-type')
export class DatabaseNumberType extends LitElement {
  render() {
    return html` <input /> `;
  }
}
