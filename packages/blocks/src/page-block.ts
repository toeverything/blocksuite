import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Store } from '@building-blocks/core';

@customElement('page-block')
export class PageBlock extends LitElement {
  store = new Store();

  // disable shadow DOM
  createRenderRoot() {
    return this;
  }

  constructor() {
    super();

    // @ts-ignore
    window.store = this.store;
  }

  render() {
    return html` <text-block .store=${this.store}></text-block> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-block': PageBlock;
  }
}
