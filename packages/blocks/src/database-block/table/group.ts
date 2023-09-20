import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { PropertyValues } from 'lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { popFilterableSimpleMenu } from '../../components/menu/index.js';
import { PlusIcon } from '../../icons/index.js';
import type { GroupData } from '../common/group-by/helper.js';
import { renderGroupTitle } from '../common/group-by/renderGroupTitle.js';
import type { DataViewTable } from './table-view.js';
import type { DataViewTableManager } from './table-view-manager.js';

const styles = css`
  affine-data-view-table-group:hover .data-view-table-group-add-row {
    opacity: 1;
  }
  affine-data-view-table-group:hover .group-header-op {
    visibility: visible;
  }
  .data-view-table-group-add-row {
    display: flex;
    width: 100%;
    height: 28px;
    position: relative;
    z-index: 0;
    background-color: var(--affine-hover-color-filled);
    opacity: 0;
    cursor: pointer;
    transition: opacity 0.2s ease-in-out;
  }

  @media print {
    .data-view-table-group-add-row {
      display: none;
    }
  }

  .data-view-table-group-add-row:hover {
    opacity: 1;
  }

  .data-view-table-group-add-row-button {
    padding-left: 16px;
    position: sticky;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    user-select: none;
    font-size: 14px;
  }

  .data-view-table-group-add-row-button svg {
    width: 16px;
    height: 16px;
  }
`;

@customElement('affine-data-view-table-group')
export class TableGroup extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  view!: DataViewTableManager;
  @property({ attribute: false })
  viewEle!: DataViewTable;
  @property({ attribute: false })
  group?: GroupData;
  get rows() {
    return this.group?.rows ?? this.view.rows;
  }

  protected override updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties);
    this.querySelectorAll('data-view-table-row').forEach(ele => {
      ele.requestUpdate();
    });
  }

  private clickAddRow = () => {
    this.view.rowAdd('end', this.group?.key);
    requestAnimationFrame(() => {
      const selectionController = this.viewEle.selectionController;
      selectionController.selection = {
        groupKey: this.group?.key,
        focus: {
          rowIndex: this.rows.length - 1,
          columnIndex: 0,
        },
        isEditing: true,
      };
    });
  };
  private clickAddRowInStart = () => {
    this.view.rowAdd('start', this.group?.key);
    requestAnimationFrame(() => {
      const selectionController = this.viewEle.selectionController;
      selectionController.selection = {
        groupKey: this.group?.key,
        focus: {
          rowIndex: 0,
          columnIndex: 0,
        },
        isEditing: true,
      };
    });
  };
  private clickGroupOptions = (e: MouseEvent) => {
    const group = this.group;
    if (!group) {
      return;
    }
    const ele = e.currentTarget as HTMLElement;
    popFilterableSimpleMenu(ele, [
      {
        type: 'action',
        name: 'Ungroup',
        hide: () => group.value == null,
        select: () => {
          group.rows.forEach(id => {
            group.helper.removeFromGroup(id, group.key);
          });
        },
      },
      {
        type: 'action',
        name: 'Delete Cards',
        select: () => {
          this.view.rowDelete(group.rows);
        },
      },
    ]);
  };
  private renderRows(ids: string[]) {
    return html`
      <affine-database-column-header
        .tableViewManager="${this.view}"
      ></affine-database-column-header>
      <div class="affine-database-block-rows">
        ${repeat(
          ids,
          id => id,
          (id, idx) => {
            return html`<data-view-table-row
              data-row-index="${idx}"
              data-row-id="${id}"
              .view="${this.view}"
              .rowId="${id}"
              .rowIndex="${idx}"
            ></data-view-table-row>`;
          }
        )}
      </div>
      ${this.view.readonly
        ? null
        : html` <div
            class="data-view-table-group-add-row"
            @click="${this.clickAddRow}"
          >
            <div
              class="data-view-table-group-add-row-button"
              data-test-id="affine-database-add-row-button"
              role="button"
            >
              ${PlusIcon}<span>New Record</span>
            </div>
          </div>`}
    `;
  }

  override render() {
    if (!this.group) {
      return this.renderRows(this.view.rows);
    }
    return html`
      <div
        style="position: sticky;left: 0;width: max-content;padding: 6px 0;margin-bottom: 4px;display:flex;align-items:center;gap: 12px;max-width: 400px"
      >
        ${renderGroupTitle(this.group, {
          readonly: this.view.readonly,
          clickAdd: this.clickAddRowInStart,
          clickOps: this.clickGroupOptions,
        })}
      </div>
      ${this.renderRows(this.group.rows)}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-table-group': TableGroup;
  }
}
