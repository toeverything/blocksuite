import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  BLOCK_ID_ATTR,
  commonTextActiveHandler,
  type BlockHost,
} from '@blocksuite/shared';
import type { ParagraphBlockModel } from './paragraph-model';

import { BlockChildrenContainer } from '../__internal__';
import style from './style.css';

@customElement('paragraph-block')
export class ParagraphBlockComponent extends LitElement {
  static styles = css`
    ${unsafeCSS(style)}
  `;
  @property({
    hasChanged() {
      return true;
    },
  })
  model!: ParagraphBlockModel;

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
      selectionOptions => {
        const selectionInfo = this.host.selection.selectionInfo;
        if (selectionInfo.type === 'Block') {
          this.selected = selectionInfo.blocks.some(
            block => block.id === this.model.id
          );
        }
        if (this.selected && selectionInfo.type !== 'Block') {
          this.selected = false;
        }
        if (selectionOptions?.needFocus) {
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
    const { type } = this.model;

    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = BlockChildrenContainer(this.model, this.host);

    return html`
      <div
        class="affine-paragraph-block-container ${type} ${this.selected
          ? 'selected'
          : ''}"
      >
        <rich-text .host=${this.host} .model=${this.model}></rich-text>
        ${childrenContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'paragraph-block': ParagraphBlockComponent;
  }
}
