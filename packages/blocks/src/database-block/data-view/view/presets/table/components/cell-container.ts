import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { SignalWatcher } from '@lit-labs/preact-signals';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';

import type {
  CellRenderProps,
  DataViewCellLifeCycle,
} from '../../../../column/index.js';
import type { DataViewManager } from '../../../data-view-manager.js';
import type { DataViewTableColumnManager } from '../table-view-manager.js';
import type { TableViewSelection } from '../types.js';

import { renderUniLit } from '../../../../utils/uni-component/index.js';

@customElement('affine-database-cell-container')
export class DatabaseCellContainer extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  private _cell = createRef<DataViewCellLifeCycle>();

  static override styles = css`
    affine-database-cell-container {
      display: flex;
      align-items: start;
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
    }

    affine-database-cell-container * {
      box-sizing: border-box;
    }

    affine-database-cell-container uni-lit > *:first-child {
      padding: 8px;
    }
  `;

  selectCurrentCell = (editing: boolean) => {
    if (this.view.readonly) {
      return;
    }
    const selectionView = this.selectionView;
    if (selectionView) {
      const selection = selectionView.selection;
      if (selection && this.isSelected(selection) && editing) {
        selectionView.selection = {
          groupKey: this.groupKey,
          focus: {
            rowIndex: this.rowIndex,
            columnIndex: this.columnIndex,
          },
          isEditing: true,
        };
      } else {
        selectionView.selection = {
          groupKey: this.groupKey,
          focus: {
            rowIndex: this.rowIndex,
            columnIndex: this.columnIndex,
          },
          isEditing: false,
        };
      }
    }
  };

  private get groupKey() {
    return this.closest('affine-data-view-table-group')?.group?.key;
  }

  private get readonly() {
    return this.column.readonly;
  }

  private get selectionView() {
    return this.closest('affine-database-table')?.selectionController;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(this, 'click', () => {
      if (!this.isEditing) {
        this.selectCurrentCell(!this.column.readonly);
      }
    });
  }

  isSelected(selection: TableViewSelection) {
    if (selection.groupKey !== this.groupKey) {
      return;
    }
    if (selection.focus.columnIndex !== this.columnIndex) {
      return;
    }
    return selection.focus.rowIndex === this.rowIndex;
  }

  /* eslint-disable lit/binding-positions, lit/no-invalid-html */
  override render() {
    const { edit, view } = this.column.renderer;

    const uni = !this.readonly && this.isEditing && edit != null ? edit : view;
    const props: CellRenderProps = {
      view: this.view,
      column: this.column,
      rowId: this.rowId,
      isEditing: this.isEditing,
      selectCurrentCell: this.selectCurrentCell,
    };

    return renderUniLit(uni, props, {
      ref: this._cell,
      style: {
        display: 'contents',
      },
    });
  }

  get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value;
  }

  get table() {
    const table = this.closest('affine-database-table');
    assertExists(table);
    return table;
  }

  @property({ attribute: false })
  accessor column!: DataViewTableColumnManager;

  @property({ attribute: false })
  accessor columnId!: string;

  @property({ attribute: false })
  accessor columnIndex!: number;

  @state()
  accessor isEditing = false;

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor rowIndex!: number;

  @property({ attribute: false })
  accessor view!: DataViewManager;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-cell-container': DatabaseCellContainer;
  }
}
