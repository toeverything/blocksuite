import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SelectionManager } from '../../managers';
import { Mouse } from '../../managers/mouse';
import { Store } from '../../model/store';

const room =
  new URLSearchParams(location.search).get('room') || 'virgo-default';

@customElement('page-container')
export class PageContainer extends LitElement {
  @property()
  store = new Store(room);

  @property()
  mouse = new Mouse(this.addEventListener.bind(this));

  @property()
  selectionManager = new SelectionManager(this);

  // disable shadow DOM
  createRenderRoot() {
    return this;
  }

  constructor() {
    super();
    // @ts-ignore
    window.store = this.store;
  }

  protected render() {
    return html`
      <style>
        .page-container {
          position: relative;
        }
      </style>
      <div class="page-container">
        <selection-rect .mouse=${this.mouse}></selection-rect>
        <page-block-element .store=${this.store}></page-block-element>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-container': PageContainer;
  }
}
