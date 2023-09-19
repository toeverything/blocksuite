// related component
import './components/column-header/column-header.js';
import './components/column-header/column-width-drag-bar.js';
import './components/cell-container.js';
import './components/row.js';
import './group.js';

import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import type { TableViewSelection } from '../../__internal__/index.js';
import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import { renderUniLit } from '../../components/uni-component/uni-component.js';
import { BaseDataView } from '../common/base-data-view.js';
import type { InsertPosition } from '../types.js';
import { insertPositionToIndex } from '../utils/insert.js';
import { LEFT_TOOL_BAR_WIDTH } from './consts.js';
import { TableClipboardController } from './controller/clipboard.js';
import { TableDragController } from './controller/drag.js';
import { TableHotkeysController } from './controller/hotkeys.js';
import { TableSelectionController } from './controller/selection.js';
import type { DataViewTableManager } from './table-view-manager.js';

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
    left: 0;
    width: ${LEFT_TOOL_BAR_WIDTH}px;
    flex-shrink: 0;
    background-color: var(--affine-background-primary-color);
  }
  .affine-database-block-rows {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
  }
  ${tooltipStyle}
`;

@customElement('affine-database-table')
export class DataViewTable extends BaseDataView<
  DataViewTableManager,
  TableViewSelection
> {
  static override styles = styles;

  dragController = new TableDragController(this);
  selectionController = new TableSelectionController(this);
  hotkeysController = new TableHotkeysController(this);
  clipboardController = new TableClipboardController(this);
  private get readonly() {
    return this.view.readonly;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.view.slots.update.on(() => {
        this.requestUpdate();
        this.querySelectorAll('affine-data-view-table-group').forEach(v => {
          v.requestUpdate();
        });
      })
    );

    if (this.readonly) return;
  }

  public override addRow(position: InsertPosition) {
    this._addRow(this.view, position);
  }

  private _addRow = (
    tableViewManager: DataViewTableManager,
    position: InsertPosition | number
  ) => {
    if (this.readonly) return;

    const index =
      typeof position === 'number'
        ? position
        : insertPositionToIndex(
            position,
            this.view.rows.map(id => ({ id }))
          );
    tableViewManager.rowAdd(position);
    requestAnimationFrame(() => {
      this.selectionController.selection = {
        focus: {
          rowIndex: index,
          columnIndex: 0,
        },
        isEditing: true,
      };
    });
  };

  private _renderColumnWidthDragBar = () => {
    let left = LEFT_TOOL_BAR_WIDTH;
    return repeat(
      this.view.columnManagerList,
      v => v.id,
      column => {
        left += column.width;
        return html` <affine-database-column-width-drag-bar
          .left="${left}"
          .column="${column}"
        ></affine-database-column-width-drag-bar>`;
      }
    );
  };
  private renderTable() {
    const groupHelper = this.view.groupHelper;
    if (groupHelper) {
      return groupHelper.groups.map(group => {
        return html`<affine-data-view-table-group
          data-group-key="${group.key}"
          .view="${this.view}"
          .viewEle="${this}"
          .group="${group}"
        ></affine-data-view-table-group>`;
      });
    }
    return html`<affine-data-view-table-group
      .view="${this.view}"
      .viewEle="${this}"
    ></affine-data-view-table-group>`;
  }
  onWheel = (event: WheelEvent) => {
    const ele = event.currentTarget;
    if (ele instanceof HTMLElement) {
      if (ele.scrollWidth === ele.clientWidth) {
        return;
      }
      event.stopPropagation();
    }
  };

  public hideIndicator(): void {
    this.dragController.dropPreview.remove();
  }

  public moveTo(id: string, evt: MouseEvent): void {
    const result = this.dragController.getInsertPosition(evt);
    if (result) {
      this.view.rowMove(id, result.position, undefined, result.groupKey);
    }
  }

  public showIndicator(evt: MouseEvent): boolean {
    return this.dragController.showIndicator(evt) != null;
  }

  override render() {
    return html`
      ${renderUniLit(this.header, { view: this.view, viewMethods: this })}
      <div class="affine-database-table">
        <div class="affine-database-block-table" @wheel="${this.onWheel}">
          <div class="affine-database-table-container">
            ${this.renderTable()} ${this._renderColumnWidthDragBar()}
          </div>
        </div>
      </div>
    `;
  }

  focusFirstCell(): void {
    this.selectionController.focusFirstCell();
  }

  getSelection = () => {
    return this.selectionController.selection;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-table': DataViewTable;
  }
}
