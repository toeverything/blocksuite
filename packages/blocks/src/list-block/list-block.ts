import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Store } from '@building-blocks/store';
import '../__internal__/rich-text/rich-text';
import { ListBlockModel } from './list-model';

@customElement('list-block-element')
export class ListBlockElement extends LitElement {
  @property()
  store!: Store;

  @property()
  model!: ListBlockModel;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  render() {
    this.setAttribute('data-block-id', this.model.id);

    const listIcon = html`
      <svg
        style="width: 24px; height: 24px;"
        focusable="false"
        aria-hidden="true"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="2"></circle>
      </svg>
    `;

    return html`
      <style>
        .list-block-container {
          display: flex;
          height: 30px;
          box-sizing: border-box;
          align-items: center;
        }
      </style>
      <div class="list-block-container">
        ${listIcon}
        <rich-text
          style="flex:1;"
          .store=${this.store}
          .model=${this.model}
        ></rich-text>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'list-block-element': ListBlockElement;
  }
}
