import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Store } from '@building-blocks/store';
import { BLOCK_ID_ATTR } from '@building-blocks/shared';
import { ListBlockModel } from './list-model';
import { PageContainer } from '../types';
import { getBlockChildrenContainer } from '../__internal__/utils';
import '../__internal__/rich-text/rich-text';

@customElement('list-block-element')
export class ListBlockElement extends LitElement {
  @property()
  store!: Store;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: ListBlockModel;

  @property()
  page!: PageContainer;

  @state()
  isSelected = false;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.page.selection.onBlockSelectChange(this.model.id, isSelected => {
      this.isSelected = isSelected;
    });

    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  disconnectedCallback() {
    this.page.selection.offBlockSelectChange(this.model.id);
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const listIcon = html`
      <svg
        style="width: 24px; height: 24px; position: absolute; left: 0; top: 0;"
        focusable="false"
        aria-hidden="true"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="2"></circle>
      </svg>
    `;

    const childrenContainer = getBlockChildrenContainer(this.model, this.page);

    return html`
      <style>
        .affine-list-block-container {
          box-sizing: border-box;
          align-items: center;
          margin: 5px 0;
        }
        .affine-list-rich-text-wrapper {
          position: relative;
        }
        .affine-list-block-container.selected {
          background-color: rgba(152, 172, 189, 0.1);
        }
        .affine-list-rich-text-wrapper
          > rich-text
          > .affine-rich-text
          > .ql-editor {
          padding: 2px;
          padding-left: 20px;
        }
      </style>
      <div
        class=${`affine-list-block-container ${
          this.isSelected ? 'selected' : ''
        }`}
      >
        <div class="affine-list-rich-text-wrapper">
          ${listIcon}
          <rich-text .store=${this.store} .model=${this.model}></rich-text>
        </div>
        ${childrenContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'list-block-element': ListBlockElement;
  }
}
