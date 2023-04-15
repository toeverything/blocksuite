import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('counter-block')
export class CounterBlock extends LitElement {
  @property()
  count: number;

  constructor() {
    super();
    this.count = 0;
  }

  private async _notify() {
    this.count++;

    // https://lit.dev/docs/components/events/#dispatching-events-after-an-element-updates
    await this.updateComplete;
    const options: CustomEventInit<number> = {
      detail: this.count,
      bubbles: true,
      composed: true,
    };
    this.dispatchEvent(new CustomEvent('block-count-update', options));
  }

  override render() {
    return html` <div @click=${this._notify}>${this.count}</div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'counter-block': CounterBlock;
  }
}
