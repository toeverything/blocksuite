import type { Disposable } from '@blocksuite/global/utils';
import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import { getService } from '../../../__internal__/service.js';
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
  private editingDisposable?: Disposable;

  get isEditing() {
    return this.editingDisposable != null;
  }

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

  private get readonly() {
    return this.column.readonly;
  }

  get table() {
    const table = this.closest('affine-database-table');
    assertExists(table);
    return table;
  }

  setEditing = (isEditing: boolean) => {
    const service = getService('affine:database');
    if (isEditing) {
      this.editingDisposable = service.slots.databaseSelectionUpdated.on(
        ({ selection }) => {
          if (
            !selection ||
            !selection.isEditing ||
            selection.focus.rowIndex !== this.rowIndex ||
            selection.focus.columnIndex !== this.columnIndex
          ) {
            this.editingDisposable?.dispose();
            this.editingDisposable = undefined;
          }
        }
      );
    }
    const databaseId =
      this.closest<HTMLElement>('affine-database')?.dataset.blockId;
    assertExists(databaseId);
    service.select({
      databaseId: databaseId,
      focus: { rowIndex: this.rowIndex, columnIndex: this.columnIndex },
      isEditing: isEditing,
    });
  };

  private _cell = createRef<DatabaseCellElement<unknown>>();

  public get cell() {
    return this._cell.value;
  }

  /* eslint-disable lit/binding-positions, lit/no-invalid-html */
  override render() {
    const renderer = this.column.renderer;
    const tag =
      !this.readonly &&
      this.isEditing &&
      renderer.components.CellEditing !== null
        ? renderer.components.CellEditing.tag
        : renderer.components.Cell.tag;
    const style = styleMap({
      padding: `0 ${CELL_PADDING}px`,
    });
    return html`
      <${tag}
        ${ref(this._cell)}
        style=${style}
        .column='${this.column}'
        .rowId='${this.rowId}'
        .setEditing='${this.setEditing}'
        .isEditing='${this.isEditing}'
      ></${tag}>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-cell-container': DatabaseCellContainer;
  }
}
