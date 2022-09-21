import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { BaseBlockModel, Store } from '@building-blocks/store';
import { PageBlockModel } from './page-model';
import { TextBlockModel, ListBlockModel } from '../';
import { BLOCK_ID_ATTR, SelectionManager } from '../../../editor';

// TODO support dynamic block types
function getBlockElement(
  model: BaseBlockModel,
  store: Store,
  selectionManager: SelectionManager
) {
  switch (model.flavour) {
    case 'text':
      return html`
        <text-block-element
          .model=${model as TextBlockModel}
          .store=${store}
          .selectionManager=${selectionManager}
        ></text-block-element>
      `;
    case 'list':
      return html`
        <list-block-element
          .model=${model as ListBlockModel}
          .store=${store}
          .selectionManager=${selectionManager}
        ></list-block-element>
      `;
  }
  return html`<div>Unknown block type: ${model.flavour}</div>`;
}

@customElement('page-block-element')
export class PageBlockElement extends LitElement {
  @property()
  store!: Store;

  @property()
  selectionManager!: SelectionManager;

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

    const childBlocks = html`
      ${repeat(
        this.model.elements,
        child => child.id,
        child => getBlockElement(child, this.store, this.selectionManager)
      )}
    `;

    return html` <div class="page-block-container">${childBlocks}</div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-block-element': PageBlockElement;
  }
}
