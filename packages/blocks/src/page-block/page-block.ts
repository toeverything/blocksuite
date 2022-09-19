import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { Store } from '@building-blocks/framework';
import { TextBlockModel } from '../text-block/text-block';
import { BaseBlockModel } from '@building-blocks/framework/src/model/base';

export class PageBlockModel extends BaseBlockModel {
  flavour = 'page';
  children: BaseBlockModel[] = [];

  constructor(store: Store) {
    super(store, { id: '0' });
  }
}

@customElement('page-block-element')
export class PageBlockElement extends LitElement {
  @property()
  store!: Store;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: PageBlockModel;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  render() {
    this.setAttribute('data-block-id', this.model.id);

    const childBlocks = html`
      ${repeat(
        this.model.children,
        child => child.id,
        child =>
          html`
            <text-block-element
              .store=${this.store}
              .model=${child as TextBlockModel}
            >
            </text-block-element>
          `
      )}
    `;

    return html` <div class="page-container">${childBlocks}</div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-block-element': PageBlockElement;
  }
}
