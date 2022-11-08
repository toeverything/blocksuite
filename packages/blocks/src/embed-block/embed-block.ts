import { LitElement, html, css, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import style from './style.css';

@customElement('embed-block')
export class EmbedBlockComponent extends LitElement {
  static styles = css`
    ${unsafeCSS(style)}
  `;

  @property()
  @query('input')
  _container!: HTMLElement;
  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }
  // firstUpdated() {
  //   this.model.propsUpdated.on(() => this.requestUpdate());
  //   this.model.childrenUpdated.on(() => this.requestUpdate());
  // }

  private _inputChange(e: any) {}
  render() {
    // this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    // const childrenContainer = BlockChildrenContainer(this.model, this.host);

    // const { type, source } = this.model;

    // For the first list item, we need to add a margin-top to make it align with the text
    // const shouldAddMarginTop = index === 0 && deep === 0;
    return html`
      <div class=${`affine-embed-block-container`}>
        < class=${`affine-embed-wrapper`}>
          <slot></slot>
          <input value=${123123}>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-block': EmbedBlockComponent;
  }
}
