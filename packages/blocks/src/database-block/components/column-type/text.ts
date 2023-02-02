import {
  DatabaseCellLitElement,
  defineTagSchemaRenderer,
} from '../../register.js';
import { customElement } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';

@customElement('affine-database-text-cell')
class TextCell extends DatabaseCellLitElement {
  static tag = literal`affine-database-text-cell`;
}

@customElement('affine-database-text-cell-editing')
class TextCellEditing extends DatabaseCellLitElement {
  static tag = literal`affine-database-text-cell-editing`;
}

@customElement('affine-database-text-column-property-editing')
class TextColumnPropertyEditing extends DatabaseCellLitElement {
  static tag = literal`affine-database-text-column-property-editing`;
}
export const TextTagSchemaRenderer = defineTagSchemaRenderer(
  'text',
  () => ({}),
  () => '',
  {
    Cell: TextCell,
    CellEditing: TextCellEditing,
    ColumnPropertyEditing: TextColumnPropertyEditing,
  },
  {
    displayName: 'Text',
  }
);
