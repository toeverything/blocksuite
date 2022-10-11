import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type BlockHost, commonTextActiveHandler } from '@blocksuite/shared';
import { BLOCK_ID_ATTR } from '@blocksuite/shared';
import type { ListBlockModel } from './list-model';
import { getListIcon } from './utils/get-list-icon';

import style from './style.css';

import { BlockChildrenContainer } from '../__internal__';
import '../__internal__';

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
    this.host.selection.addBlockSelectedListener(this.model.id, selected => {
      this.selected = selected;
    });

    this.host.selection.addBlockActiveListener(this.model.id, position => {
      const editableContainer = this.querySelector('[contenteditable]');
      if (editableContainer) {
        commonTextActiveHandler(position, editableContainer);
      }
    });

    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  disconnectedCallback() {
    this.host.selection.removeBlockSelectedListener(this.model.id);
    this.host.selection.removeBlockActiveListener(this.model.id);
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const listIcon = getListIcon(this.host, this.model);
    const childrenContainer = BlockChildrenContainer(this.model, this.host);

    return html`
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
    'list-block': ListBlockComponent;
  }
}
