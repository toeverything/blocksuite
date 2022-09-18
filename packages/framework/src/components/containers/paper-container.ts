import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Store, SelectionManager, MouseManager } from '../..';
import { noop } from '../../model/utils/utils';
import { RichText } from '../rich-text/rich-text';

// avoid being tree-shaked
noop(RichText);

const room =
  new URLSearchParams(location.search).get('room') || 'virgo-default';

@customElement('paper-container')
export class PaperContainer extends LitElement {
  @property()
  store = new Store(room);

  @property()
  mouse = new MouseManager(this.addEventListener.bind(this));

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
        .paper-container {
          position: relative;
        }
      </style>
      <div class="paper-container">
        <selection-rect .mouse=${this.mouse}></selection-rect>
        <page-block-element .store=${this.store}></page-block-element>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'paper-container': PaperContainer;
  }
}
