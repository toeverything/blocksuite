/// <reference types="vite/client" />
import '../__internal__/rich-text/rich-text.js';

import { BLOCK_ID_ATTR } from '@blocksuite/global/config';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  BlockChildrenContainer,
  BlockHost,
  getBlockElementByModel,
  getDefaultPageBlock,
  NonShadowLitElement,
} from '../__internal__/index.js';
import type { ListBlockModel } from './list-model.js';
import { getListIcon } from './utils/get-list-icon.js';
import { getListInfo } from './utils/get-list-info.js';

function selectList(model: ListBlockModel) {
  const selectionManager = getDefaultPageBlock(model).selection;

  const blockElement = getBlockElementByModel(model);
  if (!blockElement) {
    console.error('list block model:', model, 'blockElement:', blockElement);
    throw new Error('Failed to select list! blockElement not found!');
  }
  selectionManager.resetSelectedBlockByRect(blockElement);
}

@customElement('affine-list')
export class ListBlockComponent extends NonShadowLitElement {
  static styles = css`
    .affine-list-block-container {
      box-sizing: border-box;
      border-radius: 5px;
      margin-top: 2px;
    }
    .affine-list-block-container--first {
      margin-top: var(--affine-paragraph-space);
    }
    .affine-list-block-container .affine-list-block-container {
      margin-top: 0;
    }
    .affine-list-block-container.selected {
      background-color: var(--affine-selected-color);
    }
    .affine-list-rich-text-wrapper {
      display: flex;
    }
    .affine-list-rich-text-wrapper rich-text {
      flex: 1;
    }

    .affine-list-block__prefix {
      flex-shrink: 0;
      min-width: 26px;
      height: 26px;
      margin-top: 3px;
      margin-right: 4px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      color: var(--affine-code-color);
      font-size: 14px;
      line-height: var(--affine-line-height);
      user-select: none;
    }
    .affine-list-block__todo-prefix {
      margin-top: 1px;
      cursor: pointer;
    }
    .affine-list-block__todo {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 1px solid var(--affine-icon-color);
    }
    .affine-list-block__todo.affine-list-block__todo--active {
      background: var(--affine-icon-color);
    }

    .affine-list--checked {
      color: var(--affine-icon-color);
    }
  `;

  @property({ hasChanged: () => true })
  model!: ListBlockModel;

  @property()
  host!: BlockHost;

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
    const childrenContainer = BlockChildrenContainer(
      this.model,
      this.host,
      () => this.requestUpdate()
    );
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
