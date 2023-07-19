import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { UniLit } from '../../../components/uni-component/uni-component.js';
import { columnManager } from '../../common/column-manager.js';
import type { DatabaseCellElement } from '../register.js';
import type { ColumnManager } from '../table-view-manager.js';

/** affine-database-cell-container padding */
const CELL_PADDING = 8;

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
      border-right: 1px solid var(--affine-border-color) !important;
    }

    affine-database-cell-container * {
      box-sizing: border-box;
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
  column!: ColumnManager;
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

  private _cell = createRef<UniLit<DatabaseCellElement<unknown>>>();

  public get cell(): DatabaseCellElement<unknown> | undefined {
    return this._cell.value?.expose;
  }

  /* eslint-disable lit/binding-positions, lit/no-invalid-html */
  override render() {
    const column = columnManager.getColumn(this.column.type);
    assertExists(column);

    const uni =
      !this.readonly && this.isEditing && column.cellRenderer.edit !== null
        ? column.cellRenderer.edit
        : column.cellRenderer.view;
    const style = styleMap({
      display: 'contents',
    });
    const props = {
      column: this.column,
      rowId: this.rowId,
      isEditing: this.isEditing,
      selectCurrentCell: this._selectCurrentCell,
    };
    return html`${keyed(
      this.isEditing,
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
