import { customElement } from 'lit/decorators.js';
import { html, literal } from 'lit/static-html.js';

import {
  DatabaseCellLitElement,
  defineColumnSchemaRenderer,
} from '../../register.js';
import { SelectMode } from './select.js';

@customElement('affine-database-single-select-cell')
class MultiSelectCell extends DatabaseCellLitElement {
  static tag = literal`affine-database-single-select-cell`;
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

@customElement('affine-database-single-select-cell-editing')
class MultiSelectCellEditing extends DatabaseCellLitElement {
  static tag = literal`affine-database-single-select-cell-editing`;

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

@customElement('affine-database-single-select-column-property-editing')
class MultiSelectColumnPropertyEditing extends DatabaseCellLitElement {
  static tag = literal`affine-database-single-select-column-property-editing`;
}

export const MultiSelectColumnSchemaRenderer = defineColumnSchemaRenderer(
  'multi-select',
  () => ({
    selection: [] as string[],
  }),
  () => [] as string[],
  {
    Cell: MultiSelectCell,
    CellEditing: MultiSelectCellEditing,
    ColumnPropertyEditing: MultiSelectColumnPropertyEditing,
  },
  {
    displayName: 'Multi Select',
  }
);
