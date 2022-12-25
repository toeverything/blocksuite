/// <reference types="vite/client" />
import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  BLOCK_ID_ATTR,
  BlockHost,
  getBlockElementByModel,
  getDefaultPageBlock,
} from '../__internal__/index.js';

import type { ListBlockModel } from './list-model.js';
import { getListIcon } from './utils/get-list-icon.js';
import { getListInfo } from './utils/get-list-info.js';
import { BlockChildrenContainer } from '../__internal__/index.js';
import style from './style.css?inline';

function selectList(model: ListBlockModel) {
  const selectionManager = getDefaultPageBlock(model).selection;

  const blockElement = getBlockElementByModel(model);
  if (!blockElement) {
    console.error('list block model:', model, 'blockElement:', blockElement);
    throw new Error('Failed to select list! blockElement not found!');
  }
  const blockRect = blockElement.getBoundingClientRect();
  selectionManager.resetSelectedBlockByRect(blockRect);
}

@customElement('affine-list')
export class ListBlockComponent extends LitElement {
  static styles = css`
    ${unsafeCSS(style)}
  `;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: ListBlockModel;

  @property()
  host!: BlockHost;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    const { deep, index } = getListInfo(this.host, this.model);
    const listIcon = getListIcon({
      model: this.model,
      deep,
      index,
      onClick: () => {
        if (this.model.type !== 'todo') {
          selectList(this.model);
          return;
        }
        this.host.page.captureSync();
        this.host.page.updateBlock(this.model, {
          checked: !this.model.checked,
        });
      },
    });
    const childrenContainer = BlockChildrenContainer(this.model, this.host);
    // For the first list item, we need to add a margin-top to make it align with the text
    const shouldAddMarginTop = index === 0 && deep === 0;

    return html`
      <div
        class=${`affine-list-block-container ${
          shouldAddMarginTop ? 'affine-list-block-container--first' : ''
        }`}
      >
        <div
          class=${`affine-list-rich-text-wrapper ${
            this.model.checked ? 'affine-list--checked' : ''
          }`}
        >
          ${listIcon}
          <rich-text .host=${this.host} .model=${this.model}></rich-text>
        </div>
        ${childrenContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-list': ListBlockComponent;
  }
}
