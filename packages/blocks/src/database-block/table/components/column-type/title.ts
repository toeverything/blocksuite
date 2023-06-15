import { css } from 'lit';
import { html, literal } from 'lit/static-html.js';

import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';

export class TitleCell extends DatabaseCellElement<string> {
  static override tag = literal`affine-database-title-cell`;

  static override styles = css`
    .affine-database-block-row-cell-content {
      display: flex;
      align-items: center;
      height: 100%;
      min-height: 44px;
      transform: translateX(0);
    }

    .affine-database-block-row-cell-content > [data-block-id] {
      width: 100%;
    }

    .affine-database-block-row-cell-content > affine-paragraph {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
    }

    .affine-database-block-row-cell-content > affine-paragraph > .text {
      width: 100%;
      margin-top: unset;
    }
  `;

  override render() {
    if (!this.value) {
      return;
    }
    const model = this.page.getBlockById(this.value);
    if (!model) {
      return;
    }
    return html`
      <div class="affine-database-block-row-cell-content">
        ${this.root.renderModel(model)}
      </div>
    `;
  }
}

export class TitleCellEditing extends DatabaseCellElement<string> {
  static override tag = literal`affine-database-title-cell-editing`;

  override render() {
    if (!this.value) {
      return;
    }
    const model = this.page.getBlockById(this.value);
    if (!model) {
      return;
    }
    return html`
      <div class="affine-database-block-row-cell-content">
        ${this.root.renderModel(model)}
      </div>
    `;
  }
}

export const TitleColumnRenderer = defineColumnRenderer(
  'title',
  {
    Cell: TitleCell,
    //TODO
    CellEditing: null,
  },
  {
    displayName: 'Title',
  }
);
