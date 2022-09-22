import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Store } from '@building-blocks/store';
import { PageBlockModel, BLOCK_ID_ATTR } from '../';
import { PageContainer } from '../types';
import { getChildBlocks } from '../__internal__/utils';

@customElement('page-block-element')
export class PageBlockElement extends LitElement {
  @property()
  store!: Store;

  @property()
  page!: PageContainer;

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
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childBlocks = getChildBlocks(this.model, this.page);

    return html` <div class="page-block-container">${childBlocks}</div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-block-element': PageBlockElement;
  }
}
