import { BlockElement } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { ColumnsBlockModel } from './columns-model.js';

@customElement('affine-columns')
export class ColumnsBlockComponent extends BlockElement<ColumnsBlockModel> {
  static override styles = css`
    .affine-columns-container {
      position: relative;
      width: 100%;
      display: grid;
      min-height: 200px;

      > * {
        background-color: var(--affine-background-secondary-color);
        padding: 8px;
        border-radius: 8px;
        border: 1px solid var(--affine-border-color);
      }
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
  }

  override renderBlock() {
    const gridStyles =
      'grid-template-columns: repeat(' +
      this.model.columnNumber +
      ', 1fr);grid-gap: 16px;';

    const children = this.renderModelChildren(this.model);
    return html`<div
      class="affine-columns-container"
      contenteditable="false"
      style=${gridStyles}
    >
      ${children}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-columns': ColumnsBlockComponent;
  }
}
