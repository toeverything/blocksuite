/// <reference types="vite/client" />
import { html, css, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { GroupBlockModel } from './group-model.js';
import {
  BlockChildrenContainer,
  BLOCK_ID_ATTR,
  type BlockHost,
  NonShadowLitElement,
} from '../__internal__/index.js';
import style from './style.css?inline';

@customElement('affine-group')
export class GroupBlockComponent extends NonShadowLitElement {
  static styles = css`
    ${unsafeCSS(style)}
  `;

  @property({
    hasChanged() {
      return true;
    },
  })
  model!: GroupBlockModel;

  @property()
  host!: BlockHost;

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);

    const childrenContainer = BlockChildrenContainer(this.model, this.host);

    return html`
      <div class="affine-group-block-container">${childrenContainer}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-group': GroupBlockComponent;
  }
}
