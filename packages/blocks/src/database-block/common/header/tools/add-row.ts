import { DisposableGroup } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { PlusIcon } from '../../../../icons/index.js';
import type { TableViewSelection } from '../../../../index.js';
import type { DataViewTableManager } from '../../../table/table-view-manager.js';
import type { InsertPosition } from '../../../types.js';
import type { DataViewExpose } from '../../data-view.js';
import type { DatabaseSelection } from '../../selection.js';
import { initAddNewRecordHandlers } from './new-record-preview.js';

const styles = css`
  .affine-database-toolbar-item.new-record {
    margin-left: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    width: 120px;
    height: 32px;
    padding: 6px 8px;
    border-radius: 8px;
    font-size: 14px;
    background: var(--affine-white);
    box-shadow: 0px 0px 0px 0.5px rgba(0, 0, 0, 0.1);
    cursor: grab;
  }

  .new-record > tool-tip {
    max-width: 280px;
  }
  .new-record svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-icon-color);
  }

  .edgeless .new-record > tool-tip {
    display: none;
  }
`;

@customElement('data-view-header-tools-add-row')
export class DataViewHeaderToolsAddRow extends WithDisposable(
  ShadowlessElement
) {
  static override styles = styles;

  @property({ attribute: false })
  viewMethod!: DataViewExpose;
  @property({ attribute: false })
  view!: DataViewTableManager;
  @property({ attribute: false })
  getSelection!: () => DatabaseSelection;

  @query('.new-record')
  private _newRecord!: HTMLDivElement;

  private _recordAddDisposables = new DisposableGroup();

  @state()
  public showToolBar = false;

  private get readonly() {
    return this.view.readonly;
  }

  override firstUpdated() {
    if (!this.readonly) {
      this._initAddRecordHandlers();
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    if (!this.readonly) {
      this._initAddRecordHandlers();
    }
  }

  addRow = (position: InsertPosition | number) => {
    this.viewMethod.addRow?.(position);
  };

  private _initAddRecordHandlers() {
    // remove previous handlers
    this._recordAddDisposables.dispose();
    if (!this._newRecord) {
      return;
    }
    const disposables = initAddNewRecordHandlers(
      this._newRecord,
      this,
      this.addRow
    );
    if (disposables) {
      // bind new handlers
      this._recordAddDisposables = disposables;
    }
  }

  private _onAddNewRecord = () => {
    if (this.readonly) return;
    const selection = this.getSelection();
    if (!selection) {
      this.addRow('start');
    } else {
      const { rowsSelection, columnsSelection, focus } =
        selection.viewSelection as TableViewSelection;
      let index = 0;
      if (rowsSelection && !columnsSelection) {
        // rows
        index = rowsSelection.end;
      } else if (rowsSelection && columnsSelection) {
        // multiple cells
        index = rowsSelection.end;
      } else if (!rowsSelection && !columnsSelection && focus) {
        // single cell
        index = focus.rowIndex;
      }

      this.addRow(index + 1);
    }
  };

  override render() {
    return html` <div
      class="has-tool-tip affine-database-toolbar-item new-record"
      draggable="true"
      @click="${this._onAddNewRecord}"
    >
      ${PlusIcon}<span>New Record</span>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools-add-row': DataViewHeaderToolsAddRow;
  }
}
