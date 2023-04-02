import type { SelectProperty } from '@blocksuite/global/database';
import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { html, literal } from 'lit/static-html.js';

import {
  DatabaseCellLitElement,
  defineColumnSchemaRenderer,
} from '../../register.js';
import { SelectMode } from './select.js';

@customElement('affine-database-multi-select-cell')
class MultiSelectCell extends DatabaseCellLitElement<SelectProperty[]> {
  static styles = css`
    :host {
      width: 100%;
    }
  `;
  static tag = literal`affine-database-multi-select-cell`;
  override render() {
    return html`
      <affine-database-select-cell
        .rowHost=${this.rowHost}
        .databaseModel=${this.databaseModel}
        .rowModel=${this.rowModel}
        .columnSchema=${this.columnSchema}
        .column=${this.column}
      ></affine-database-select-cell>
    `;
  }
}

@customElement('affine-database-multi-select-cell-editing')
class MultiSelectCellEditing extends DatabaseCellLitElement<SelectProperty[]> {
  static tag = literal`affine-database-multi-select-cell-editing`;

  override render() {
    return html`
      <affine-database-select-cell-editing
        data-is-editing-cell="true"
        .rowHost=${this.rowHost}
        .databaseModel=${this.databaseModel}
        .rowModel=${this.rowModel}
        .columnSchema=${this.columnSchema}
        .column=${this.column}
        .mode=${SelectMode.Multi}
      ></affine-database-select-cell-editing>
    `;
  }
}

@customElement('affine-database-multi-select-column-property-editing')
class MultiSelectColumnPropertyEditing extends DatabaseCellLitElement<
  SelectProperty[]
> {
  static tag = literal`affine-database-multi-select-column-property-editing`;
}

export const MultiSelectColumnSchemaRenderer = defineColumnSchemaRenderer(
  'multi-select',
  () => ({
    selection: [] as SelectProperty[],
  }),
  () => [] as SelectProperty[],
  {
    Cell: MultiSelectCell,
    CellEditing: MultiSelectCellEditing,
    ColumnPropertyEditing: MultiSelectColumnPropertyEditing,
  },
  {
    displayName: 'Multi Select',
  }
);
