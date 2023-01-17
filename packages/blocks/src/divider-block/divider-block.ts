/// <reference types="vite/client" />
import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  BLOCK_ID_ATTR,
  BlockChildrenContainer,
  BlockHost,
  NonShadowLitElement,
} from '../__internal__/index.js';

import type { DividerBlockModel } from './divider-model.js';

@customElement('affine-divider')
export class DividerBlockComponent extends NonShadowLitElement {
  static styles = css`
    .affine-divider-block-container {
      width: 100%;
      height: 20px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin-top: var(--affine-paragraph-space);
    }
    hr {
      width: 100%;
    }
  `;

  @property({ hasChanged: () => true })
  model!: DividerBlockModel;

  @property()
  host!: BlockHost;

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  render() {
    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
    const childrenContainer = BlockChildrenContainer(
      this.model,
      this.host,
      () => this.requestUpdate()
    );

    return html`
      <div class=${`affine-divider-block-container`}>
        <hr />
        ${childrenContainer}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-divider': DividerBlockComponent;
  }
}
