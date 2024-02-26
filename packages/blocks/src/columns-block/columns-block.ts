import { BlockElement } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { matchFlavours } from '../_common/utils/index.js';
import type { ColumnsBlockModel } from './columns-model.js';

@customElement('affine-columns')
export class ColumnsBlockComponent extends BlockElement<ColumnsBlockModel> {
  static override styles = css`
    .affine-columns-container {
      position: relative;
      width: 100%;
      display: grid;
      padding-top: 20px;
      min-height: 200px;

      affine-note {
        background-color: var(--affine-background-secondary-color);
        padding: 0px 16px;
        border-radius: 8px;
        border: 1px solid var(--affine-border-color);
      }
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      this.page.slots.blockUpdated.on(
        this._checkLastBlockIsParagraph.bind(this)
      )
    );

    this._checkLastBlockIsParagraph();
  }

  _checkLastBlockIsParagraph() {
    this.model.children.forEach(note => {
      if (matchFlavours(note, ['affine:note'])) {
        const lastChild = note.children[note.children.length - 1];
        if (!lastChild || !matchFlavours(lastChild, ['affine:paragraph'])) {
          this.page.addBlock('affine:paragraph', {}, note.id);
        }
      }
    });
  }

  override renderBlock() {
    const gridStyles =
      'grid-template-columns: repeat(' +
      this.model.columnNumber +
      ', 1fr);grid-gap: 16px;';

    const children = this.renderModelChildren(this.model);
    return html`<div class="affine-columns-container" style=${gridStyles}>
      ${children}

      <affine-block-selection .block=${this}></affine-block-selection>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-columns': ColumnsBlockComponent;
  }
}
