import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { css } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { Property } from '../../../core/view-manager/property.js';
import type { TableSingleView } from '../table-view-manager.js';

export class DataViewColumnPreview extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    affine-data-view-column-preview {
      pointer-events: none;
      display: block;
    }
  `;

  private renderGroup(rows: string[]) {
    const columnIndex = this.tableViewManager.propertyIndexGet(this.column.id);
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
    const groups = this.tableViewManager.groupManager.groupsDataList$.value;
    if (!groups) {
      const rows = this.tableViewManager.rows$.value;
      return this.renderGroup(rows);
    }
    return groups.map(group => {
      return html`
        <div style="height: 44px;"></div>
        ${this.renderGroup(group.rows)}
      `;
    });
  }

  @property({ attribute: false })
  accessor column!: Property;

  @property({ attribute: false })
  accessor table!: HTMLElement;

  @property({ attribute: false })
  accessor tableViewManager!: TableSingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-column-preview': DataViewColumnPreview;
  }
}
