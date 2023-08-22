import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef } from 'lit/directives/ref.js';

import { renderUniLit } from '../../../components/uni-component/uni-component.js';
import type {
  CellRenderProps,
  DataViewCellLifeCycle,
} from '../../common/columns/manager.js';
import type { DataViewManager } from '../../common/data-view-manager.js';
import type { DataViewTableColumnManager } from '../table-view-manager.js';

@customElement('affine-database-cell-container')
export class DatabaseCellContainer extends WithDisposable(ShadowlessElement) {
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

  @state()
  public isEditing = false;

  @property({ attribute: false })
  public readonly view!: DataViewManager;
  @property({ attribute: false })
  public readonly rowId!: string;
  @property({ attribute: false })
  public readonly rowIndex!: number;
  @property({ attribute: false })
  public readonly columnId!: string;
  @property({ attribute: false })
  public readonly columnIndex!: number;

  @property({ attribute: false })
  column!: DataViewTableColumnManager;

  private get selectionView() {
    return this.closest('affine-database-table')?.selection;
  }

  private _selectCurrentCell = (editing: boolean) => {
    if (this.selectionView) {
      this.selectionView.selection = {
        focus: {
          rowIndex: this.rowIndex,
          columnIndex: this.columnIndex,
        },
        isEditing: editing,
      };
    }
  };

  private get readonly() {
    return this.column.readonly;
  }

  get table() {
    const table = this.closest('affine-database-table');
    assertExists(table);
    return table;
  }

  private _cell = createRef<DataViewCellLifeCycle>();

  public get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(this, 'click', () => {
      if (!this.isEditing) {
        this._selectCurrentCell(!this.column.readonly);
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
      selectCurrentCell: this._selectCurrentCell,
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
