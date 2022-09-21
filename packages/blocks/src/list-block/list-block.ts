import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Store } from '@building-blocks/store';
import '../__internal__/rich-text/rich-text';
import { ListBlockModel } from './list-model';
import { BLOCK_ID_ATTR, SelectionManager } from '../../../editor';

@customElement('list-block-element')
export class ListBlockElement extends LitElement {
  @property()
  store!: Store;

  @property()
  model!: ListBlockModel;

  @property()
  selectionManager!: SelectionManager;

  @state()
  isSelected = false;

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const listIcon = html`
      <svg
        style="width: 24px; height: 24px;"
        focusable="false"
        aria-hidden="true"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="2"></circle>
      </svg>
    `;

    return html`
      <style>
        .list-block-container {
          display: flex;
          height: 30px;
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'list-block-element': ListBlockElement;
  }
}
