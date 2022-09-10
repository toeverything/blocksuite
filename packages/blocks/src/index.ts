import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('block-counter')
export class CounterBlock extends LitElement {
  render() {
    return html` <div>0</div> `;
  }
}
