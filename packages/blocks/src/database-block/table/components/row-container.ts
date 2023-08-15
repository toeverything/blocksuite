import './cell-container.js';

import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { positionToVRect } from '../../../components/menu/index.js';
import { MoreHorizontalIcon, NewEditIcon } from '../../../icons/index.js';
import { DEFAULT_COLUMN_MIN_WIDTH } from '../consts.js';
import type { DataViewTableManager } from '../table-view-manager.js';
import { openDetail, popRowMenu } from './menu.js';
import type { DatabaseSelectionView } from './selection.js';

export function DataBaseRowContainer(
  view: DataViewTableManager,
  selection: DatabaseSelectionView
) {
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
        position: relative;
      }

      .affine-database-block-row.selected > .database-cell {
        background: transparent;
      }

      .database-cell {
        min-width: ${DEFAULT_COLUMN_MIN_WIDTH}px;
      }

      .row-ops {
        position: relative;
        width: 0;
        margin-top: 8px;
        height: max-content;
        visibility: hidden;
        display: flex;
        gap: 4px;
        cursor: pointer;
        justify-content: end;
      }

      .row-op:last-child {
        margin-right: 8px;
      }

      .affine-database-block-row:hover .row-ops {
        visibility: visible;
      }

      .row-op {
        display: flex;
        padding: 4px;
        border-radius: 4px;
        box-shadow: 0px 0px 4px 0px rgba(66, 65, 73, 0.14);
        background-color: var(--affine-background-primary-color);
      }

      .row-op:hover {
        background-color: var(--affine-hover-color);
      }

      .row-op svg {
        fill: var(--affine-icon-color);
        color: var(--affine-icon-color);
        width: 16px;
        height: 16px;
      }

      /*.database-cell:last-child affine-database-cell-container {*/
      /*  border-right: none;*/
      /*}*/
    </style>
    <div class="affine-database-block-rows">
      ${repeat(
        view.rows,
        id => id,
        (id, idx) => {
          const contextMenu = (e: MouseEvent) => {
            e.preventDefault();
            const ele = e.target as HTMLElement;
            const columnIndex =
              ele.closest('affine-database-cell-container')?.columnIndex ?? 0;
            selection.selection = {
              rowsSelection: {
                start: idx,
                end: idx,
              },
              focus: {
                rowIndex: idx,
                columnIndex: columnIndex,
              },
              isEditing: false,
            };
            popRowMenu(positionToVRect(e.x, e.y), id, selection);
          };
          return html`
            <div
              class="affine-database-block-row database-row"
              data-row-index="${idx}"
              data-row-id="${id}"
              @contextmenu="${contextMenu}"
            >
              ${repeat(
                view.columnManagerList,
                v => v.id,
                (column, i) => {
                  const clickDetail = () => {
                    openDetail(id, selection);
                  };
                  const openMenu = (e: MouseEvent) => {
                    const ele = e.currentTarget as HTMLElement;
                    selection.selection = {
                      focus: {
                        rowIndex: idx,
                        columnIndex: i,
                      },
                      isEditing: false,
                    };
                    popRowMenu(ele, id, selection);
                  };
                  return html`
                    <div>
                      <affine-database-cell-container
                        class="database-cell"
                        style=${styleMap({
                          width: `${column.width}px`,
                          border: i === 0 ? 'none' : undefined,
                        })}
                        .column="${column}"
                        .rowId="${id}"
                        data-row-id="${id}"
                        .rowIndex="${idx}"
                        data-row-index="${idx}"
                        .columnId="${column.id}"
                        data-column-id="${column.id}"
                        .columnIndex="${i}"
                        data-column-index="${i}"
                      >
                      </affine-database-cell-container>
                    </div>
                    ${column.isMain
                      ? html` <div class="row-ops">
                          <div class="row-op" @click="${clickDetail}">
                            ${NewEditIcon}
                          </div>
                          <div class="row-op" @click="${openMenu}">
                            ${MoreHorizontalIcon}
                          </div>
                        </div>`
                      : ''}
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
