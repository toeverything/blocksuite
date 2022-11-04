/// <reference types="vite/client" />
import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BLOCK_ID_ATTR, type BlockHost } from '../__internal__';
import type { ParagraphBlockModel } from './paragraph-model';

import { BlockChildrenContainer } from '../__internal__';
import style from './style.css';

const getPlaceholder = (model: ParagraphBlockModel) => {
  const { type } = model;
  switch (type) {
    case 'h1':
      return 'Heading 1';
    case 'h2':
      return 'Heading 2';
    case 'h3':
      return 'Heading 3';
    case 'h4':
      return 'Heading 4';
    case 'h5':
      return 'Heading 5';
    case 'h6':
      return 'Heading 6';
    default:
      return '';
  }
};

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

    const { type } = this.model;
    const childrenContainer = BlockChildrenContainer(this.model, this.host);
    const placeholder = getPlaceholder(this.model);

    return html`
      <div class="affine-paragraph-block-container ${type}">
        <rich-text
          .host=${this.host}
          .model=${this.model}
          .placeholder=${placeholder}
        ></rich-text>
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
