// related component
import { popMenu } from '@blocksuite/affine-components/context-menu';
import {
  insertPositionToIndex,
  type InsertToPosition,
} from '@blocksuite/affine-shared/utils';
import { AddCursorIcon } from '@blocksuite/icons/lit';
import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type { GroupManager } from '../../core/common/group-by/helper.js';
import type { TableSingleView } from './table-view-manager.js';

import { renderUniLit } from '../../core/utils/uni-component/uni-component.js';
import { DataViewBase } from '../../core/view/data-view-base.js';
import './cell.js';
import { LEFT_TOOL_BAR_WIDTH } from './consts.js';
import { TableClipboardController } from './controller/clipboard.js';
import { TableDragController } from './controller/drag.js';
import { TableHotkeysController } from './controller/hotkeys.js';
import { TableSelectionController } from './controller/selection.js';
import './group.js';
import './header/column-header.js';
import './row/row.js';
import {
  TableAreaSelection,
  type TableViewSelectionWithType,
} from './types.js';

const styles = css`
  affine-database-table {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  affine-database-table * {
    box-sizing: border-box;
  }
  .affine-database-table {
    overflow-y: auto;
  }

  .affine-database-block-title-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    margin: 2px 0 2px;
  }

  .affine-database-block-table {
    position: relative;
    width: 100%;
    padding-bottom: 4px;
    z-index: 1;
    overflow-x: scroll;
    overflow-y: hidden;
  }

  .affine-database-block-table:hover {
    padding-bottom: 0px;
  }

  .affine-database-block-table::-webkit-scrollbar {
    -webkit-appearance: none;
    display: block;
  }

  .affine-database-block-table::-webkit-scrollbar:horizontal {
    height: 4px;
  }

  .affine-database-block-table::-webkit-scrollbar-thumb {
    border-radius: 2px;
    background-color: transparent;
  }

  .affine-database-block-table:hover::-webkit-scrollbar:horizontal {
    height: 8px;
  }

  .affine-database-block-table:hover::-webkit-scrollbar-thumb {
    border-radius: 16px;
    background-color: var(--affine-black-30);
  }

  .affine-database-block-table:hover::-webkit-scrollbar-track {
    background-color: var(--affine-hover-color);
  }

  .affine-database-table-container {
    position: relative;
    width: fit-content;
    min-width: 100%;
  }

  .affine-database-block-tag-circle {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
  }

  .affine-database-block-tag {
    display: inline-flex;
    border-radius: 11px;
    align-items: center;
    padding: 0 8px;
    cursor: pointer;
  }

  .database-cell {
    border-left: 1px solid var(--affine-border-color);
  }
  .data-view-table-left-bar {
    display: flex;
    align-items: center;
    position: sticky;
    z-index: 1;
    left: 0;
    width: ${LEFT_TOOL_BAR_WIDTH}px;
    flex-shrink: 0;
  }
  .affine-database-block-rows {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
  }
`;

@customElement('affine-database-table')
export class DataViewTable extends DataViewBase<
  TableSingleView,
  TableViewSelectionWithType
> {
  static override styles = styles;

  private _addRow = (
    tableViewManager: TableSingleView,
    position: InsertToPosition | number
  ) => {
    if (this.readonly) return;

    const index =
      typeof position === 'number'
        ? position
        : insertPositionToIndex(
            position,
            this.view.rows$.value.map(id => ({ id }))
          );
    tableViewManager.rowAdd(position);
    requestAnimationFrame(() => {
      this.selectionController.selection = TableAreaSelection.create({
        focus: {
          rowIndex: index,
          columnIndex: 0,
        },
        isEditing: true,
      });
    });
  };

  clipboardController = new TableClipboardController(this);

  dragController = new TableDragController(this);

  getSelection = () => {
    return this.selectionController.selection;
  };

  hotkeysController = new TableHotkeysController(this);

  onWheel = (event: WheelEvent) => {
    if (event.metaKey || event.ctrlKey) {
      return;
    }
    const ele = event.currentTarget;
    if (ele instanceof HTMLElement) {
      if (ele.scrollWidth === ele.clientWidth) {
        return;
      }
      event.stopPropagation();
    }
  };

  renderAddGroup = (groupHelper: GroupManager) => {
    const addGroup = groupHelper.addGroup;
    if (!addGroup) {
      return;
    }
    const add = (e: MouseEvent) => {
      const ele = e.currentTarget as HTMLElement;
      popMenu(ele, {
        options: {
          input: {
            onComplete: text => {
              const column = groupHelper.column$.value;
              if (column) {
                column.updateData(
                  () => addGroup(text, column.data$.value) as never
                );
              }
            },
          },
          items: [],
        },
      });
    };
    return html` <div style="display:flex;">
      <div
        class="dv-hover dv-round-8"
        style="display:flex;align-items:center;gap: 10px;padding: 6px 12px 6px 8px;color: var(--affine-text-secondary-color);font-size: 12px;line-height: 20px;position: sticky;left: ${LEFT_TOOL_BAR_WIDTH}px;"
        @click="${add}"
      >
        <div class="dv-icon-16" style="display:flex;">${AddCursorIcon()}</div>
        <div>New Group</div>
      </div>
    </div>`;
  };

  selectionController = new TableSelectionController(this);

  private get readonly() {
    return this.view.readonly$.value;
  }

  private renderTable() {
    const groups = this.view.groupManager.groupsDataList$.value;
    if (groups) {
      return html`
        <div style="display:flex;flex-direction: column;gap: 16px;">
          ${groups.map(group => {
            return html`<affine-data-view-table-group
              data-group-key="${group.key}"
              .dataViewEle="${this.dataViewEle}"
              .view="${this.view}"
              .viewEle="${this}"
              .group="${group}"
            ></affine-data-view-table-group>`;
          })}
          ${this.renderAddGroup(this.view.groupManager)}
        </div>
      `;
    }
    return html`<affine-data-view-table-group
      .dataViewEle="${this.dataViewEle}"
      .view="${this.view}"
      .viewEle="${this}"
    ></affine-data-view-table-group>`;
  }

  override addRow(position: InsertToPosition) {
    this._addRow(this.view, position);
  }

  focusFirstCell(): void {
    this.selectionController.focusFirstCell();
  }

  hideIndicator(): void {
    this.dragController.dropPreview.remove();
  }

  moveTo(id: string, evt: MouseEvent): void {
    const result = this.dragController.getInsertPosition(evt);
    if (result) {
      this.view.rowMove(id, result.position, undefined, result.groupKey);
    }
  }

  override render() {
    return html`
      ${renderUniLit(this.headerWidget, {
        view: this.view,
        viewMethods: this,
      })}
      <div class="affine-database-table">
        <div class="affine-database-block-table" @wheel="${this.onWheel}">
          <div class="affine-database-table-container">
            ${this.renderTable()}
          </div>
        </div>
      </div>
    `;
  }

  showIndicator(evt: MouseEvent): boolean {
    return this.dragController.showIndicator(evt) != null;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-table': DataViewTable;
  }
}
