import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { DataViewColumnManager } from '../../../common/data-view-manager.js';
import type { DataViewTableManager } from '../../table-view-manager.js';

@customElement('affine-data-view-column-preview')
export class DataViewColumnPreview extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    affine-data-view-column-preview {
      pointer-events: none;
      display: block;
      background-color: var(--affine-background-hover-color);
    }
  `;
  @property({ attribute: false })
  tableViewManager!: DataViewTableManager;
  @property({ attribute: false })
  column!: DataViewColumnManager;
  @property({ attribute: false })
  table!: HTMLElement;

  override render() {
    const rows = this.tableViewManager.rows;
    const columnIndex = this.tableViewManager.columnGetIndex(this.column.id);
    return html`
      <affine-database-header-column
        .tableViewManager="${this.tableViewManager}"
        .column="${this.column}"
      ></affine-database-header-column>
      ${repeat(rows, (id, index) => {
        const height = this.table.querySelector(
          `affine-database-cell-container[data-row-id="${id}"]`
        )?.clientHeight;
        const style = styleMap({
          height: height + 'px',
        });
        return html` <div style="${style}">
          <affine-database-cell-container
            .column="${this.column}"
            .rowId="${id}"
            .columnId="${this.column.id}"
            .rowIndex="${index}"
            .columnIndex="${columnIndex}"
          ></affine-database-cell-container>
        </div>`;
      })}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-column-preview': DataViewColumnPreview;
  }
}
