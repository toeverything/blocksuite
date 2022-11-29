/// <reference types="vite/client" />
import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BLOCK_ID_ATTR, BlockHost } from '../__internal__';

import type { DividerBlockModel } from './divider-model';

import { BlockChildrenContainer } from '../__internal__';
import style from './style.css';

@customElement('divider-block')
export class DividerBlockComponent extends LitElement {
  static styles = css`
    ${unsafeCSS(style)}
  `;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: DividerBlockModel;

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
    const childrenContainer = BlockChildrenContainer(this.model, this.host);
    // For the first list item, we need to add a margin-top to make it align with the text

    return html`
      <div class=${`affine-divider-block-container`}>
        <div class=${`affine-divider-rich-text-wrapper`}>
          <rich-text .host=${this.host} .model=${this.model}></rich-text>
        </div>
        ${childrenContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'divider-block': DividerBlockComponent;
  }
}
