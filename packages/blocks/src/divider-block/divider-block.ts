/// <reference types="vite/client" />
import '../_common/components/block-selection.js';

import { BlockElement } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '../_common/consts.js';
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

    this.contentEditable = 'false';

    this.handleEvent('click', () => {
      this.host.selection.set([
        this.host.selection.create('block', {
          path: this.path,
        }),
      ]);
    });
  }

  override renderBlock() {
    const children = html`<div
      class="affine-block-children-container"
      style="padding-left: ${BLOCK_CHILDREN_CONTAINER_PADDING_LEFT}px"
    >
      ${this.renderChildren(this.model)}
    </div>`;

    return html`
      <div class="affine-divider-block-container">
        <hr />

        ${children}

        <affine-block-selection .block=${this}></affine-block-selection>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-divider': DividerBlockComponent;
  }
}
