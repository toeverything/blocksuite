import {
  DatabaseCellLitElement,
  defineTagSchemaRenderer,
} from '@blocksuite/global/database';
import { customElement } from 'lit/decorators.js';
import { html, literal } from 'lit/static-html.js';

@customElement('affine-database-select-cell-preview')
class SelectCellPreview extends DatabaseCellLitElement {
  static tag = literal`affine-database-select-cell-preview`;
  override render() {
    return html` <div>${this.tag?.value}</div> `;
  }
}

@customElement('affine-database-select-cell-editing')
class SelectCellEditing extends DatabaseCellLitElement {
  static tag = literal`affine-database-select-cell-editing`;
}

@customElement('affine-database-select-column-property-editing')
class SelectColumnPropertyEditing extends DatabaseCellLitElement {
  static tag = literal`affine-database-select-column-property-editing`;
}

export const SelectTagSchemaRenderer = defineTagSchemaRenderer(
  'select',
  () => ({
    selection: [],
  }),
  () => [] as string[],
  {
    CellPreview: SelectCellPreview,
    CellEditing: SelectCellEditing,
    ColumnPropertyEditing: SelectColumnPropertyEditing,
  },
  {
    displayName: 'Select',
  }
);
