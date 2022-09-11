import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Store } from '@building-blocks/core';

@customElement('page-block')
export class PageBlock extends LitElement {
  store = new Store();

  @property({ type: String })
  text = 'Disconnect';

  // disable shadow DOM
  createRenderRoot() {
    return this;
  }

  constructor() {
    super();

    // @ts-ignore
    window.store = this.store;
  }

  private _onToggleConnection() {
    if (this.text === 'Disconnect') {
      this.store.provider.disconnect();
      this.text = 'Connect';
    } else {
      this.store.provider.connect();
      this.text = 'Disconnect';
    }
  }

  render() {
    return html`
      <text-block .store=${this.store}></text-block>
      <button @click=${this._onToggleConnection}>${this.text}</button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-block': PageBlock;
  }
}
