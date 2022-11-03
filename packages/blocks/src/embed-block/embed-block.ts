import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BLOCK_ID_ATTR, BlockHost } from '../__internal__';

import type { EmbedBlockModel } from './embed-model';
import { BlockChildrenContainer } from '../__internal__';
import style from './style.css';

@customElement('embed-block')
export class EmbedBlockComponent extends LitElement {
  static styles = css`
    ${unsafeCSS(style)}
  `;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: EmbedBlockModel;

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
    // const { deep, index } = getListInfo(this.host, this.model);

    const childrenContainer = BlockChildrenContainer(this.model, this.host);
    // For the first list item, we need to add a margin-top to make it align with the text
    // const shouldAddMarginTop = index === 0 && deep === 0;

    return html`
      <div class=${`affine-embed-block-container`}>
        <div class=${`affine-list-rich-text-wrapper`}>
          <img src=${this.model.source} />
        </div>
        ${childrenContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-block': EmbedBlockComponent;
  }
}
