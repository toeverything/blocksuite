import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { DataViewColumnManager } from '../../../../data-view-manager.js';
import type { DataViewTableManager } from '../../table-view-manager.js';

@customElement('affine-data-view-column-preview')
export class DataViewColumnPreview extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    affine-data-view-column-preview {
      pointer-events: none;
      display: block;
    }
  `;

  private renderGroup(rows: string[]) {
    const columnIndex = this.tableViewManager.columnGetIndex(this.column.id);
    return html`
      <div
        style="background-color: var(--affine-background-primary-color);border-top: 1px solid var(--affine-border-color);box-shadow: var(--affine-shadow-2);"
      >
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
          return html`<div
            style="border-top: 1px solid var(--affine-border-color)"
          >
            <div style="${style}">
              <affine-database-cell-container
                .column="${this.column}"
                .view="${this.tableViewManager}"
                .rowId="${id}"
                .columnId="${this.column.id}"
                .rowIndex="${index}"
                .columnIndex="${columnIndex}"
              ></affine-database-cell-container>
            </div>
          </div>`;
        })}
      </div>
      <div style="height: 45px;"></div>
    `;
  }

  override render() {
    const groupHelper = this.tableViewManager.groupHelper;
    if (!groupHelper) {
      const rows = this.tableViewManager.rows;
      return this.renderGroup(rows);
    }
    return groupHelper.groups.map(group => {
      return html`
        <div style="height: 44px;"></div>
        ${this.renderGroup(group.rows)}
      `;
    });
  }

  @property({ attribute: false })
  accessor column!: DataViewColumnManager;

  @property({ attribute: false })
  accessor table!: HTMLElement;

  @property({ attribute: false })
  accessor tableViewManager!: DataViewTableManager;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-column-preview': DataViewColumnPreview;
  }
}
