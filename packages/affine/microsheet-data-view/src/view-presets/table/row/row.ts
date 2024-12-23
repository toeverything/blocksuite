import {
  menu,
  popMenu,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { type BlockStdScope, ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import {
  AddCursorIcon,
  CenterPeekIcon,
  DeleteIcon,
  MoreHorizontalIcon,
} from '@blocksuite/icons/lit';
import { css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { DataViewRenderer } from '../../../core/data-view.js';
import type { TableSingleView } from '../table-view-manager.js';

import { DEFAULT_COLUMN_MIN_WIDTH } from '../consts.js';
import { TableRowSelection, type TableViewSelection } from '../types.js';

export class TableRow extends SignalWatcher(WithDisposable(ShadowlessElement)) {
  static override styles = css`
    .affine-microsheet-block-row:has(.microsheet-row-select-checkbox.selected) {
      background: var(--affine-primary-color-04);
    }
    .affine-microsheet-block-row:has(.microsheet-row-select-checkbox.selected)
      .row-selected-bg {
      position: relative;
    }
    .affine-microsheet-block-row:has(.microsheet-row-select-checkbox.selected)
      .row-selected-bg:before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      background: var(--affine-primary-color-04);
    }
    .affine-microsheet-block-row {
      width: 100%;
      display: flex;
      flex-direction: row;
      /* border-bottom: 1px solid var(--affine-border-color); */
      position: relative;
    }

    .affine-microsheet-block-row.selected > .microsheet-cell {
      background: transparent;
    }

    .microsheet-cell {
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

    .affine-microsheet-block-row:hover .show-on-hover-row {
      visibility: visible;
      opacity: 1;
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
    .data-view-table-view-drag-handler {
      width: 4px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      background-color: var(--affine-background-primary-color);
    }
    .microsheet-data-view-table-left-bar {
      padding-left: 16px;
      display: flex;
      align-items: center;
      position: sticky;
      left: 0;
      width: 24px;
      flex-shrink: 0;
      visibility: hidden;
      z-index: 9;
      background-color: var(--affine-background-primary-color);
    }
    .microsheet-data-view-table-view-drag-handler {
      width: 8px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      background-color: #eee;
    }
    .microsheet-data-view-table-view-drag-handler:hover {
      background-color: blue;
    }
    .microsheet-data-view-table-view-add-icon {
      position: absolute;
      left: 0px;
      top: -10px;
      z-index: 9;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .microsheet-data-view-table-view-add-not-active-icon {
      margin-left: -2px;
      width: 4px;
      height: 4px;
      border-radius: 4px;
      background: #ddd;
    }
    .microsheet-data-view-table-view-bottom-add-icon {
      top: unset;
      bottom: -10px;
    }
    .microsheet-data-view-table-view-add-icon svg {
      width: 20px;
      height: 20px;
      border-radius: 100px;
      background: #4949fe;
      color: white;
      display: none;
    }
    .microsheet-data-view-table-view-add-icon:hover svg {
      display: block;
    }
  `;

  private _clickDragHandler = (e: MouseEvent) => {
    if (this.view.readonly$.value) {
      return;
    }
    this.selectionController?.toggleRow(this.rowId, this.groupKey);
    this.popMenu(e.currentTarget as HTMLElement);
  };

  private rowAdd = (before: boolean) => {
    this.view.rowAdd({
      id: this.rowId,
      before: before,
    });
  };

  contextMenu = (e: MouseEvent) => {
    if (this.view.readonly$.value) {
      return;
    }
    const selection = this.selectionController;
    if (!selection) {
      return;
    }
    e.preventDefault();
    const row = { id: this.rowId, groupKey: this.groupKey };
    if (!TableRowSelection.includes(selection.selection, row)) {
      selection.selection = TableRowSelection.create({
        rows: [row],
      });
    }
  };

  setSelection = (selection?: TableViewSelection) => {
    if (this.selectionController) {
      this.selectionController.selection = selection;
    }
  };

  get groupKey() {
    return this.closest('affine-microsheet-data-view-table-group')?.group?.key;
  }

  get selectionController() {
    return this.closest('affine-microsheet-table')?.selectionController;
  }

  private popMenu(ele?: HTMLElement) {
    popMenu(popupTargetFromElement(ele ?? this), {
      options: {
        items: [
          menu.group({
            items: [
              menu.action({
                name: 'Delete',
                prefix: DeleteIcon(),
                select: () => {
                  const selection = this.selectionController;
                  if (selection) {
                    selection.deleteRow(this.rowId);
                  }
                },
                class: { 'delete-item': true },
              }),
            ],
          }),
        ],
      },
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    this.disposables.addFromEvent(this, 'contextmenu', this.contextMenu);

    this.classList.add('affine-microsheet-block-row', 'microsheet-row');
  }

  protected override render(): unknown {
    const view = this.view;
    return html`
      ${view.readonly$.value
        ? nothing
        : html`<div
            class="microsheet-data-view-table-left-bar"
            style="min-height: 44px"
          >
            <div
              class="microsheet-data-view-table-view-drag-handler show-on-hover-row row-selected-bg"
              @click=${this._clickDragHandler}
            ></div>
            <div
              class="microsheet-data-view-table-view-add-icon"
              @click="${() => this.rowAdd(true)}"
            >
              <div
                class="microsheet-data-view-table-view-add-not-active-icon"
              ></div>
              ${AddCursorIcon()}
            </div>
            <div
              class="microsheet-data-view-table-view-add-icon microsheet-data-view-table-view-bottom-add-icon"
              @click="${() => this.rowAdd(false)}"
            >
              <div
                class="microsheet-data-view-table-view-add-not-active-icon"
              ></div>
              ${AddCursorIcon()}
            </div>
          </div> `}
      ${repeat(
        view.properties$.value,
        v => v.id,
        (column, i) => {
          const clickDetail = () => {
            if (!this.selectionController) {
              return;
            }
            this.setSelection(
              TableRowSelection.create({
                rows: [{ id: this.rowId, groupKey: this.groupKey }],
              })
            );
          };
          const openMenu = () => {
            if (!this.selectionController) {
              return;
            }
            const row = { id: this.rowId, groupKey: this.groupKey };
            this.setSelection(
              TableRowSelection.create({
                rows: [row],
              })
            );
          };
          return html`
            <div>
              <affine-microsheet-cell-container
                class="microsheet-cell"
                style=${styleMap({
                  width: `${column.width$.value}px`,
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
                .std="${this.std}"
                contenteditable="${true}"
              >
              </affine-microsheet-cell-container>
            </div>
            ${!column.readonly$.value &&
            column.view.mainProperties$.value.titleColumn === column.id
              ? html`<div class="row-ops show-on-hover-row">
                  <div class="row-op" @click="${clickDetail}">
                    ${CenterPeekIcon()}
                  </div>
                  ${!view.readonly$.value
                    ? html`<div class="row-op" @click="${openMenu}">
                        ${MoreHorizontalIcon()}
                      </div>`
                    : nothing}
                </div>`
              : nothing}
          `;
        }
      )}
      <!-- <div class="microsheet-cell add-column-button"></div> -->
    `;
  }

  @property({ attribute: false })
  accessor dataViewEle!: DataViewRenderer;

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor rowIndex!: number;

  @property({ attribute: false })
  accessor std!: BlockStdScope;

  @property({ attribute: false })
  accessor view!: TableSingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'microsheet-data-view-table-row': TableRow;
  }
}
