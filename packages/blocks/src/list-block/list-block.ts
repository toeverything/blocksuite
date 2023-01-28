/// <reference types="vite/client" />
import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  BlockChildrenContainer,
  BlockHost,
  getBlockElementByModel,
  getDefaultPageBlock,
  NonShadowLitElement,
} from '../__internal__/index.js';
import '../__internal__/rich-text/rich-text.js';

import type { ListBlockModel } from './list-model.js';
import { getListIcon } from './utils/get-list-icon.js';
import { getListInfo } from './utils/get-list-info.js';
import { BLOCK_ID_ATTR } from '@blocksuite/global/config';

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
export class ListBlockComponent extends NonShadowLitElement {
  static styles = css`
    .affine-list-block__prefix svg {
      width: 40px;
      height: 40px;
    }

    .affine-list-block__prefix:hover svg {
      transition: transform 0.2s ease-in-out;
      transform: scale(1.7);
    }

    .affine-list-block-container {
      box-sizing: border-box;
      border-radius: 5px;
      margin-top: var(--affine-paragraph-space);
      position: relative;
    }

    .affine-list-block-container--first .affine-list-block-container::before {
      content: '';
      position: absolute;
      left: -9px;
      top: 10%;
      width: 4px;
      height: 100%;
      background: linear-gradient(to bottom, #555, #fff);
      border-radius: 2px;
      animation: pulse 2s ease-in-out infinite;
      transition: background-color 0.3s ease-in-out;
    }

    .affine-list-block-container--first
      .affine-list-block-container:hover::before {
      background: linear-gradient(
        to bottom,
        var(--ls-block-bullet-active-color),
        #fff
      );
    }

    .affine-list-block__toggle-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      font-size: 14px;
      font-weight: bold;
      color: var(--affine-icon-color);
      background: none;
      border: none;
      cursor: pointer;
      margin-left: auto;
      padding-left: 0px;
      padding-right: 0px;
    }

    .affine-list-block__toggle-button.collapsed {
      transform: rotate(45deg);
    }

    .affine-list-block-container--first::after {
      content: '';
      position: absolute;
      left: -10px;
      top: 50%;
      width: calc(100% + 40px);
      height: 1px;
      background-color: #ccc;
      z-index: -1;
      transition: background-color 0.3s ease-in-out;
    }

    .affine-list-block-container--first:hover::after {
      background-color: var(--ls-block-bullet-active-color);
    }

    .affine-list-block-container .affine-list-block-container {
      margin-top: 0;
    }

    .affine-list-block-container.selected {
      background-color: var(--affine-selected-color);
      animation: pulse 0.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
      100% {
        transform: scale(1);
      }
    }

    .affine-list-rich-text-wrapper {
      display: flex;
    }

    .affine-list-rich-text-wrapper rich-text {
      flex: 1;
    }

    .affine-list-block__prefix {
      display: flex;
      align-items: center;
      min-width: 26px;
      height: 26px;
      margin-top: 3px;
      margin-right: 4px;
      color: var(--affine-code-color);
      font-size: 14px;
      line-height: var(--affine-line-height-base);
      cursor: pointer;
    }

    .affine-list-block__todo-prefix {
      cursor: pointer;
      margin-left: auto; /* Add this line to move the todo prefix to the right */
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

  toggleCollapse(e: MouseEvent) {
    e.stopPropagation();
    const toggleButton = e.currentTarget;
    (toggleButton as HTMLElement)?.classList.toggle('collapsed');
    const container = (toggleButton as HTMLElement)?.closest(
      '.affine-list-block-container'
    ) as HTMLElement;
    container.classList.toggle('collapsed');
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
          <button
            class="affine-list-block__toggle-button"
            @click=${this.toggleCollapse}
          >
            +
          </button>
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
