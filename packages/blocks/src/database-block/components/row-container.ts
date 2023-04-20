import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { BlockElementWithService } from '../../__internal__/service/components.js';
import { DEFAULT_COLUMN_MIN_WIDTH } from '../consts.js';
import type { DatabaseBlockComponent } from '../database-block.js';
import { SearchState } from '../types.js';

export function DataBaseRowContainer(
  databaseBlock: DatabaseBlockComponent,
  filteredRowIds: string[],
  searchState: SearchState
) {
  const databaseModel = databaseBlock.model;
  const columns = databaseModel.columns;

  const filteredChildren =
    searchState === SearchState.Searching
      ? databaseModel.children.filter(
          child => filteredRowIds.indexOf(child.id) > -1
        )
      : databaseModel.children;

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
      .affine-database-block-row > .affine-database-block-row-cell:first-child {
        background: var(--affine-hover-color);
      }
      .affine-database-block-row > .database-cell {
        background: var(--affine-white);
      }

      .affine-database-block-row-cell-content {
        display: flex;
        align-items: center;
        min-height: 44px;
        padding: 0 8px;
        transform: translateX(0);
      }
      .affine-database-block-row-cell-content > affine-paragraph > .text {
        margin-top: unset;
      }
      .database-cell {
        min-width: ${DEFAULT_COLUMN_MIN_WIDTH}px;
        border-right: 1px solid var(--affine-border-color);
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
                  ${BlockElementWithService(child, databaseBlock, () => {
                    databaseBlock.requestUpdate();
                  })}
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
                      .databaseModel=${databaseModel}
                      .rowModel=${child}
                      .column=${column}
                      .columnRenderer=${databaseBlock.columnRenderer}
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
