import './components/column-stats.js';
import './components/column-stats-cell.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import type { PropertyValues } from 'lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { popFilterableSimpleMenu } from '../../../../../_common/components/index.js';
import { GroupTitle } from '../../../common/group-by/group-title.js';
import type { GroupData } from '../../../common/group-by/helper.js';
import { PlusIcon } from '../../../common/icons/index.js';
import type { DataViewRenderer } from '../../../data-view.js';
import { LEFT_TOOL_BAR_WIDTH } from './consts.js';
import type { DataViewTable } from './table-view.js';
import type { DataViewTableManager } from './table-view-manager.js';

const styles = css`
  affine-data-view-table-group .group-header-op {
    visibility: visible;
  }
  .data-view-table-group-add-row {
    display: flex;
    width: 100%;
    height: 28px;
    position: relative;
    z-index: 0;
    cursor: pointer;
    transition: opacity 0.2s ease-in-out;
    padding: 4px 8px;
    border-bottom: 1px solid var(--affine-border-color);
  }

  @media print {
    .data-view-table-group-add-row {
      display: none;
    }
  }

  .data-view-table-group-add-row-button {
    position: sticky;
    left: ${8 + LEFT_TOOL_BAR_WIDTH}px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    user-select: none;
    font-size: 12px;
    line-height: 20px;
    color: var(--affine-text-secondary-color);
  }
`;

@customElement('affine-data-view-table-group')
export class TableGroup extends WithDisposable(ShadowlessElement) {
  get rows() {
    return this.group?.rows ?? this.view.rows;
  }

  static override styles = styles;

  @property({ attribute: false })
  accessor dataViewEle!: DataViewRenderer;

  @property({ attribute: false })
  accessor view!: DataViewTableManager;

  @property({ attribute: false })
  accessor viewEle!: DataViewTable;

  @property({ attribute: false })
  accessor group: GroupData | undefined = undefined;

  private clickAddRow = () => {
    this.view.rowAdd('end', this.group?.key);
    requestAnimationFrame(() => {
      const selectionController = this.viewEle.selectionController;
      const index = this.view.columnManagerList.findIndex(
        v => v.type === 'title'
      );
      selectionController.selection = {
        groupKey: this.group?.key,
        focus: {
          rowIndex: this.rows.length - 1,
          columnIndex: index,
        },
        isEditing: true,
      };
    });
  };

  private clickAddRowInStart = () => {
    this.view.rowAdd('start', this.group?.key);
    requestAnimationFrame(() => {
      const selectionController = this.viewEle.selectionController;
      const index = this.view.columnManagerList.findIndex(
        v => v.type === 'title'
      );
      selectionController.selection = {
        groupKey: this.group?.key,
        focus: {
          rowIndex: 0,
          columnIndex: index,
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

  private renderGroupHeader = () => {
    if (!this.group) {
      return null;
    }
    return html`
      <div
        style="position: sticky;left: 0;width: max-content;padding: 6px 0;margin-bottom: 4px;display:flex;align-items:center;gap: 12px;max-width: 400px"
      >
        ${GroupTitle(this.group, {
          readonly: this.view.readonly,
          clickAdd: this.clickAddRowInStart,
          clickOps: this.clickGroupOptions,
        })}
      </div>
    `;
  };

  private renderRows(ids: string[]) {
    return html`
      <affine-database-column-header
        .renderGroupHeader="${this.renderGroupHeader}"
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
              .dataViewEle="${this.dataViewEle}"
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
            class="data-view-table-group-add-row dv-hover"
            @click="${this.clickAddRow}"
          >
            <div
              class="data-view-table-group-add-row-button dv-icon-16"
              data-test-id="affine-database-add-row-button"
              role="button"
            >
              ${PlusIcon}<span>New Record</span>
            </div>
          </div>`}
      ${this.dataViewEle.config.getFlag?.('enable_database_statistics')
        ? html`
            <affine-database-column-stats
              .view="${this.view}"
              .group=${this.group}
            >
            </affine-database-column-stats>
          `
        : null}
    `;
  }

  protected override updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties);
    this.querySelectorAll('data-view-table-row').forEach(ele => {
      ele.requestUpdate();
    });
  }

  override render() {
    return this.renderRows(this.rows);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-table-group': TableGroup;
  }
}
