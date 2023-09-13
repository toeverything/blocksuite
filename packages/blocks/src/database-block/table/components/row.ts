import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { TableViewSelection } from '../../../__internal__/index.js';
import { positionToVRect } from '../../../components/menu/index.js';
import { MoreHorizontalIcon, NewEditIcon } from '../../../icons/index.js';
import { DEFAULT_COLUMN_MIN_WIDTH } from '../consts.js';
import type { DataViewTableManager } from '../table-view-manager.js';
import { openDetail, popRowMenu } from './menu.js';

@customElement('data-view-table-row')
export class TableRow extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .data-view-table-row {
      width: 100%;
    }
    .affine-database-block-row {
      width: 100%;
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
    .affine-database-block-row .show-on-hover-row {
      visibility: hidden;
    }
    .affine-database-block-row:hover .show-on-hover-row {
      visibility: visible;
    }

    .row-op {
      display: flex;
      padding: 4px;
      border-radius: 4px;
      box-shadow: 0px 0px 4px 0px rgba(66, 65, 73, 0.14);
      background-color: var(--affine-background-primary-color);
      position: relative;
    }

    .row-op:hover:before {
      content: '';
      border-radius: 4px;
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      background-color: var(--affine-hover-color);
    }

    .row-op svg {
      fill: var(--affine-icon-color);
      color: var(--affine-icon-color);
      width: 16px;
      height: 16px;
    }
  `;
  get selection() {
    return this.closest('affine-database-table')?.selectionController;
  }
  @property({ attribute: false })
  view!: DataViewTableManager;
  @property({ attribute: false })
  rowIndex!: number;
  @property({ attribute: false })
  rowId!: string;

  setSelection = (selection?: Omit<TableViewSelection, 'viewId' | 'type'>) => {
    if (this.selection) {
      this.selection.selection = selection;
    }
  };
  contextMenu = (e: MouseEvent) => {
    const selection = this.selection;
    if (!selection) {
      return;
    }
    e.preventDefault();
    const ele = e.target as HTMLElement;
    const columnIndex =
      ele.closest('affine-database-cell-container')?.columnIndex ?? 0;
    selection.selection = {
      rowsSelection: {
        start: this.rowIndex,
        end: this.rowIndex,
      },
      focus: {
        rowIndex: this.rowIndex,
        columnIndex: columnIndex,
      },
      isEditing: false,
    };
    popRowMenu(positionToVRect(e.x, e.y), this.rowId, selection);
  };

  public override connectedCallback() {
    super.connectedCallback();
    this.disposables.addFromEvent(this, 'contextmenu', this.contextMenu);
    // eslint-disable-next-line wc/no-self-class
    this.classList.add('affine-database-block-row', 'database-row');
  }

  protected override render(): unknown {
    const view = this.view;
    return html`
      <div class="data-view-table-left-bar">
        <div
          class="data-view-table-view-drag-handler"
          style="width: 8px;height: 100%;display:flex;align-items:center;justify-content:center;cursor:grab;"
        >
          <div
            class="show-on-hover-row"
            style="width: 4px;
            border-radius: 2px;
            height: 12px;
            background-color: var(--affine-placeholder-color);
"
          ></div>
        </div>
      </div>
      ${repeat(
        view.columnManagerList,
        v => v.id,
        (column, i) => {
          const clickDetail = () => {
            if (!this.selection) {
              return;
            }
            this.setSelection({
              rowsSelection: {
                start: this.rowIndex,
                end: this.rowIndex,
              },
              focus: {
                rowIndex: this.rowIndex,
                columnIndex: i,
              },
              isEditing: false,
            });
            openDetail(this.rowId, this.selection);
          };
          const openMenu = (e: MouseEvent) => {
            if (!this.selection) {
              return;
            }
            const ele = e.currentTarget as HTMLElement;
            this.setSelection({
              rowsSelection: {
                start: this.rowIndex,
                end: this.rowIndex,
              },
              focus: {
                rowIndex: this.rowIndex,
                columnIndex: i,
              },
              isEditing: false,
            });
            popRowMenu(ele, this.rowId, this.selection);
          };
          return html`
            <div>
              <affine-database-cell-container
                class="database-cell"
                style=${styleMap({
                  width: `${column.width}px`,
                  border: i === 0 ? 'none' : undefined,
                })}
                .view="${view}"
                .column="${column}"
                .rowId="${this.rowId}"
                data-row-id="${this.rowId}"
                .rowIndex="${this.rowIndex}"
                data-row-index="${this.rowIndex}"
                .columnId="${column.id}"
                data-column-id="${column.id}"
                .columnIndex="${i}"
                data-column-index="${i}"
              >
              </affine-database-cell-container>
            </div>
            ${column.dataViewManager.header.titleColumn === column.id &&
            !view.readonly
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-table-row': TableRow;
  }
}
