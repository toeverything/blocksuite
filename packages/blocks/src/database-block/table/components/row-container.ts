import './cell-container.js';

import type { BlockSuiteRoot } from '@blocksuite/lit';
import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { TableViewColumn } from '../../common/view-manager.js';
import { DEFAULT_COLUMN_MIN_WIDTH } from '../consts.js';
import type { DatabaseTable } from '../table-view.js';
import type { SearchState } from '../types.js';

export function DataBaseRowContainer(
  databaseBlock: DatabaseTable,
  columns: TableViewColumn[],
  filter: (index: number) => boolean,
  searchState: SearchState,
  root: BlockSuiteRoot
) {
  const databaseModel = databaseBlock.model;
  const filteredChildren = databaseModel.children.filter((_, i) => filter(i));

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

      .affine-database-block-row.selected {
        background: var(--affine-secondary-color);
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

      .affine-database-block-row-cell-content {
        display: flex;
        align-items: center;
        height: 100%;
        min-height: 44px;
        padding: 0 8px;
        border-right: 1px solid var(--affine-border-color);
        transform: translateX(0);
      }

      .affine-database-block-row-cell-content > .affine-block-element {
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

      .database-cell {
        min-width: ${DEFAULT_COLUMN_MIN_WIDTH}px;
      }

      .database-cell:last-child affine-database-cell-container {
        border-right: none;
      }
    </style>
    <div class="affine-database-block-rows">
      ${repeat(
        filteredChildren,
        child => child.id,
        (child, idx) => {
          const style = styleMap({
            width: `${databaseModel.titleColumnWidth}px`,
          });
          return html`
            <div
              class="affine-database-block-row database-row"
              data-row-id="${idx}"
            >
              <div
                class="affine-database-block-row-cell database-cell"
                style=${style}
              >
                <div class="affine-database-block-row-cell-content">
                  ${root.renderModel(child)}
                </div>
              </div>
              ${repeat(columns, column => {
                return html`
                  <div
                    class="database-cell"
                    style=${styleMap({
                      width: `${column.width}px`,
                    })}
                  >
                    <affine-database-cell-container
                      .databaseModel="${databaseModel}"
                      .rowModel="${child}"
                      .column="${column}"
                      .columnRenderer="${databaseBlock.columnRenderer}"
                    >
                    </affine-database-cell-container>
                  </div>
                `;
              })}
              <div class="database-cell add-column-button"></div>
            </div>
          `;
        }
      )}
    </div>
  `;
}
