/// <reference types="vite/client" />
import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '@blocksuite/global/config';
import { BlockElement } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { registerService } from '../__internal__/service.js';
import type { DividerBlockModel } from './divider-model.js';
import { DividerBlockService } from './divider-service.js';

@customElement('affine-divider')
export class DividerBlockComponent extends BlockElement<DividerBlockModel> {
  static override styles = css`
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

  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:divider', DividerBlockService);
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
      <div class=${`affine-divider-block-container`}>
        <hr />
        ${children}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-divider': DividerBlockComponent;
  }
}
