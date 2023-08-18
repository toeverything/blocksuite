/// <reference types="vite/client" />
import { BlockElement } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '../__internal__/consts.js';
import type { DividerBlockModel } from './divider-model.js';

@customElement('affine-divider')
export class DividerBlockComponent extends BlockElement<DividerBlockModel> {
  static override styles = css`
    .affine-divider-block-container {
      position: relative;
      width: 100%;
      height: 1px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 18px 8px;
      margin-top: var(--affine-paragraph-space);
    }
    hr {
      border: none;
      border-top: 1px solid var(--affine-divider-color);
      width: 100%;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
  }

  override firstUpdated() {
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.model.childrenUpdated.on(() => this.requestUpdate());
  }

  override render() {
    const children = html`<div
      class="affine-block-children-container"
      style="padding-left: ${BLOCK_CHILDREN_CONTAINER_PADDING_LEFT}px"
    >
      ${this.content}
    </div>`;

    return html`
      <div class="affine-divider-block-container">
        <hr />
        ${children}
        ${this.selected?.is('block')
          ? html`<affine-block-selection></affine-block-selection>`
          : null}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-divider': DividerBlockComponent;
  }
}
