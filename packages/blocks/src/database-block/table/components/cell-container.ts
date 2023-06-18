import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { html } from 'lit/static-html.js';

import type { DatabaseCellElement } from '../register.js';
import { selectCurrentCell } from '../selection-manager/cell.js';
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
      padding: 0 ${CELL_PADDING}px;
      border-right: 1px solid var(--affine-border-color);
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
  private _isEditing = false;

  @property()
  rowId!: string;

  @property()
  column!: ColumnManager;

  private get readonly() {
    return this.column.readonly;
  }

  setEditing = (isEditing: boolean) => {
    this._isEditing = isEditing;
    selectCurrentCell(this, isEditing);
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
      this._isEditing &&
      renderer.components.CellEditing !== null
        ? renderer.components.CellEditing.tag
        : renderer.components.Cell.tag;
    return html`
      <${tag}
        ${ref(this._cell)}
        .column='${this.column}'
        .rowId='${this.rowId}'
        .setEditing='${this.setEditing}'
        .isEditing='${this._isEditing}'
      ></${tag}>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-cell-container': DatabaseCellContainer;
  }
}
