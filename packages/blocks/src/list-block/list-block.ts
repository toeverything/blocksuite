/// <reference types="vite/client" />
import '../__internal__/rich-text/rich-text.js';

import { BLOCK_ID_ATTR } from '@blocksuite/global/config';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  asyncFocusRichText,
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

  @property()
  placeholder?: string;

  private get pageAwarenessStore() {
    return this.host.page.awarenessStore;
  }
  private get isToggleEnabled() {
    return this.pageAwarenessStore.getFlag('enable_toggle_block');
  }
  private get blocksWithHiddenChildrenOnPage() {
    return [...this.model.page.blocksWithHiddenChildren];
  }
  private get hasChildren() {
    return !!this.model.children.length;
  }
  private get hasHiddenChildren() {
    return this.blocksWithHiddenChildren?.includes(this.model.id);
  }

  firstUpdated() {
    // this.pageAwarenessStore.awareness.on('change', () => {
    //   this.requestUpdate();
    // });
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => {
      if (this.isToggleEnabled) {
        if (!this.model.children.length) {
          this.toggleHiddenChildren('hide'); // if there are no children set to hide (so we get a closed disabled arrow)
        } else {
          this.toggleHiddenChildren('show');
        }
      } else {
        this.requestUpdate();
      }
    });
  }
  toggleHiddenChildren = (overRide?: 'show' | 'hide') => {
    if (!this.isToggleEnabled) return;

    const currentBlockID = this.model.id;
    const hiddenBlockListWithoutThis = this.blocksWithHiddenChildren.filter(
      (eachBlockID: string) => eachBlockID !== currentBlockID
    );

    if (
      !(overRide === 'hide') &&
      this.hasChildren &&
      (overRide === 'show' || this.hasHiddenChildren)
    ) {
      this.pageAwarenessStore.setFlag(
        'blocks_with_hidden_children',
        hiddenBlockListWithoutThis // remove current block from the hiddenChildren list
      );
    } else {
      this.model.page.blocksWithHiddenChildren = [
        ...hiddenBlockListWithoutThis,
        currentBlockID,
      ]; // ensure current block is in the hiddenChildren list

      // attempt to avoid mouse move / selection errors
      // for (const eachChildBlock of this.model.children) {
      //   eachChildBlock.selection.dispose();
      // }
    }
    asyncFocusRichText(this.model.page, this.model.id);
    this.requestUpdate();
  };

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    const { deep, index } = getListInfo(this.host, this.model);
    const listIcon = getListIcon({
      model: this.model,
      deep,
      index,
      onClick: evt => {
        // evt.preventDefault();
        // evt.stopPropagation();
        if (this.model.type === 'toggle') {
          // this.host.page.captureSync();
          this.toggleHiddenChildren();
          return;
        } else if (this.model.type === 'todo') {
          this.host.page.captureSync();
          const checkedPropObj = { checked: !this.model.checked };
          this.host.page.updateBlock(this.model, checkedPropObj);
          return;
        }
        selectList(this.model);
      },
    });
    const childrenContainer =
      this.model.type === 'toggle' && this.hasHiddenChildren
        ? null
        : BlockChildrenContainer(this.model, this.host, () =>
            this.requestUpdate()
          );
    // For the first list item, we need to add a margin-top to make it align with the text
    const shouldAddMarginTop = index === 0 && deep === 0;
    const placeholder = this.placeholder ?? '';

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
          <rich-text
            .host=${this.host}
            .model=${this.model}
            .placeholder=${placeholder}
          ></rich-text>
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
