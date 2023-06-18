import './cell-container.js';

import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { DEFAULT_COLUMN_MIN_WIDTH } from '../consts.js';
import type { TableViewManager } from '../table-view-manager.js';

export function DataBaseRowContainer(view: TableViewManager) {
  return html`
    <style>
      .affine-database-block-rows {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
      }

      .affine-database-block-row {
        width: 100%;
        min-height: 44px;
        display: flex;
        flex-direction: row;
        border-bottom: 1px solid var(--affine-border-color);
      }

      .affine-database-block-row.selected > .database-cell {
        background: transparent;
      }

      .affine-database-block-row > .affine-database-block-row-cell:first-child {
        background: var(--affine-hover-color);
      }

      .affine-database-block-row > .database-cell {
        background: var(--affine-white);
      }

      .database-cell {
        min-width: ${DEFAULT_COLUMN_MIN_WIDTH}px;
      }

      .database-cell:last-child affine-database-cell-container {
        border-right: none;
      }
    </style>
    <div class="affine-database-block-rows">
      ${repeat(
        view.rows,
        id => id,
        (id, idx) => {
          return html`
            <div
              class="affine-database-block-row database-row"
              data-row-index="${idx}"
              data-row-id="${id}"
            >
              ${repeat(
                view.columns,
                v => v.id,
                (column, i) => {
                  return html`
                    <div
                      class="database-cell"
                      style=${styleMap({
                        width: `${column.width}px`,
                      })}
                    >
                      <affine-database-cell-container
                        .rowId="${id}"
                        .column="${column}"
                        data-row-id=${id}
                        data-row-index=${idx}
                        data-column-id=${column.id}
                        data-column-index=${i}
                      >
                      </affine-database-cell-container>
                    </div>
                  `;
                }
              )}
              <div class="database-cell add-column-button"></div>
            </div>
          `;
        }
      )}
    </div>
  `;
}
