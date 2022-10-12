import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BlockHost, commonTextActiveHandler } from '@blocksuite/shared';
import { BLOCK_ID_ATTR } from '@blocksuite/shared';

import type { ListBlockModel } from './list-model';
import { getListIcon } from './utils/get-list-icon';
import { getListInfo } from './utils/get-list-info';
import { BlockChildrenContainer } from '../__internal__';
import style from './style.css';

@customElement('list-block')
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

  @state()
  selected = false;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.host.selection.addBlockSelectedListener(
      this.model.id,
      selectOptions => {
        const selectionInfo = this.host.selection.selectionInfo;
        if (selectionInfo.type === 'Block') {
          this.selected = selectionInfo.blocks.some(
            block => block.id === this.model.id
          );
        }
        if (this.selected && selectionInfo.type !== 'Block') {
          this.selected = false;
        }
        if (selectOptions?.needFocus) {
          const editableContainer = this.querySelector('[contenteditable]');
          if (editableContainer) {
            commonTextActiveHandler(
              this.host.selection.lastSelectionPosition,
              editableContainer
            );
          }
        }
      }
    );

    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  disconnectedCallback() {
    this.host.selection.removeBlockSelectedListener(this.model.id);
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    const { deep, index } = getListInfo(this.host, this.model);
    const listIcon = getListIcon({
      model: this.model,
      deep,
      index,
    });
    const childrenContainer = BlockChildrenContainer(this.model, this.host);
    // For the first list item, we need to add a margin-top to make it align with the text
    const shouldAddMarginTop = index === 0 && deep === 0;
    return html`
      <div
        class=${`affine-list-block-container ${
          this.selected ? 'selected' : ''
        } ${shouldAddMarginTop ? 'affine-list-block-container--first' : ''}`}
      >
        <div class="affine-list-rich-text-wrapper">
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
    'list-block': ListBlockComponent;
  }
}
