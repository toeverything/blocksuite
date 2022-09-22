import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Store } from '@building-blocks/store';
import { BLOCK_ID_ATTR } from '../..';
import { ListBlockModel } from './list-model';
import { PageContainer } from '../types';
import { getChildBlocks } from '../__internal__/utils';
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

  protected firstUpdated(): void {
    this.page.selection.onBlockSelectChange(this.model.id, isSelected => {
      this.isSelected = isSelected;
    });
  }

  public disconnectedCallback(): void {
    this.page.selection.offBlockSelectChange(this.model.id);
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const listIcon = html`
      <svg
        style="width: 24px; height: 24px; flex-shrink: 0;"
        focusable="false"
        aria-hidden="true"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="2"></circle>
      </svg>
    `;

    const childBlocks = getChildBlocks(this.model, this.page);

    return html`
      <style>
        .list-block-container {
          display: flex;
          box-sizing: border-box;
          align-items: center;
        }
        .list-block-container.selected {
          background-color: rgba(152, 172, 189, 0.1);
        }
      </style>
      <div class=${`list-block-container${this.isSelected ? ' selected' : ''}`}>
        ${listIcon}
        <rich-text
          style="flex:1;"
          .store=${this.store}
          .model=${this.model}
        ></rich-text>
      </div>

      <div style="margin-left: 10px">${childBlocks}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'list-block-element': ListBlockElement;
  }
}
