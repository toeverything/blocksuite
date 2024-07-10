import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';

import type {
  CellRenderProps,
  DataViewCellLifeCycle,
} from '../../../../column/index.js';
import { renderUniLit } from '../../../../utils/uni-component/index.js';
import type { DataViewManager } from '../../../data-view-manager.js';
import type { DataViewTableColumnManager } from '../table-view-manager.js';

@customElement('affine-database-cell-container')
export class DatabaseCellContainer extends WithDisposable(ShadowlessElement) {
  private get selectionView() {
    return this.closest('affine-database-table')?.selectionController;
  }

  private get groupKey() {
    return this.closest('affine-data-view-table-group')?.group?.key;
  }

  private get readonly() {
    return this.column.readonly;
  }

  get table() {
    const table = this.closest('affine-database-table');
    assertExists(table);
    return table;
  }

  get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value;
  }

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

  private _cell = createRef<DataViewCellLifeCycle>();

  @state()
  accessor isEditing = false;

  @property({ attribute: false })
  accessor view!: DataViewManager;

  @property({ attribute: false })
  accessor rowId!: string;

  @property({ attribute: false })
  accessor rowIndex!: number;

  @property({ attribute: false })
  accessor columnId!: string;

  @property({ attribute: false })
  accessor columnIndex!: number;

  @property({ attribute: false })
  accessor column!: DataViewTableColumnManager;

  selectCurrentCell = (editing: boolean) => {
    if (this.selectionView) {
      this.selectionView.selection = {
        groupKey: this.groupKey,
        focus: {
          rowIndex: this.rowIndex,
          columnIndex: this.columnIndex,
        },
        isEditing: editing,
      };
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(this, 'click', () => {
      if (!this.isEditing) {
        this.selectCurrentCell(!this.column.readonly);
      }
    });
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
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-cell-container': DatabaseCellContainer;
  }
}
