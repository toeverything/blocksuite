import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { UniLit } from '../../../components/uni-component/uni-component.js';
import type { DataViewCellLifeCycle } from '../register.js';
import type { DataViewTableColumnManager } from '../table-view-manager.js';

@customElement('affine-database-cell-container')
export class DatabaseCellContainer extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    affine-database-cell-container {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
    }

    affine-database-cell-container * {
      box-sizing: border-box;
    }

    affine-database-cell-container uni-lit > *:first-child {
      padding: 0 8px;
    }

    affine-database-multi-select-cell,
    affine-database-select-cell {
      cursor: pointer;
      width: 100%;
      height: 100%;
    }
  `;

  @state()
  public isEditing = false;

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
  private _selectCurrentCell = (editing: boolean) => {
    const selection = this.closest('affine-database-table')?.selection;
    if (selection) {
      selection.selection = {
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

  private _cell = createRef<UniLit<DataViewCellLifeCycle>>();

  public get cell(): DataViewCellLifeCycle | undefined {
    return this._cell.value?.expose;
  }

  /* eslint-disable lit/binding-positions, lit/no-invalid-html */
  override render() {
    const { edit, view } = this.column.renderer;

    const uni = !this.readonly && this.isEditing && edit != null ? edit : view;
    const style = styleMap({
      display: 'contents',
    });
    const props = {
      column: this.column,
      rowId: this.rowId,
      isEditing: this.isEditing,
      selectCurrentCell: this._selectCurrentCell,
    };
    const isEditView = view === uni;
    return html`${keyed(
      `${isEditView} ${this.column.type}`,
      html` <uni-lit
        ${ref(this._cell)}
        style=${style}
        .uni="${uni}"
        .props="${props}"
      ></uni-lit>`
    )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-cell-container': DatabaseCellContainer;
  }
}
