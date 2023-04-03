/// <reference types="vite/client" />
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { type BlockHost, ShadowlessElement } from '../__internal__/index.js';
import { BlockChildrenContainer } from '../__internal__/service/components.js';
import type { DividerBlockModel } from './divider-model.js';

@customElement('affine-divider')
export class DividerBlockComponent extends ShadowlessElement {
  static styles = css`
    .affine-divider-block-container {
      width: 100%;
      height: 20px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin-top: calc(var(--affine-paragraph-space) + 8px);
      margin-bottom: calc(var(--affine-paragraph-space) + 8px);
    }
    hr {
      width: 100%;
    }
  `;

  @property()
  model!: DividerBlockModel;

  @property()
  host!: BlockHost;

  firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  render() {
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
