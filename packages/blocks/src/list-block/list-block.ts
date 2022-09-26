import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { BlockHost } from '@blocksuite/shared';
import { BLOCK_ID_ATTR } from '@blocksuite/shared';
import { ListBlockModel } from './list-model';
import { getBlockChildrenContainer } from '../__internal__/utils';
import '../__internal__/rich-text/rich-text';

@customElement('list-block-element')
export class ListBlockElement extends LitElement {
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
    this.host.selection.addChangeListener(this.model.id, selected => {
      this.selected = selected;
    });

    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  disconnectedCallback() {
    this.host.selection.removeChangeListener(this.model.id);
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

    const childrenContainer = getBlockChildrenContainer(this.model, this.host);

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
          this.selected ? 'selected' : ''
        }`}
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
    'list-block-element': ListBlockElement;
  }
}
