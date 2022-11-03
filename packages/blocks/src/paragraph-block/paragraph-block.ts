/// <reference types="vite/client" />
import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BLOCK_ID_ATTR, type BlockHost } from '../__internal__';
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

    return html`
      <div class="affine-paragraph-block-container ${type}">
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
