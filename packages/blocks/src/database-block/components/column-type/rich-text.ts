import {
  DatabaseCellLitElement,
  defineTagSchemaRenderer,
} from '@blocksuite/global/database';
import { customElement } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';

@customElement('affine-database-rich-text-cell-preview')
class TextCellPreview extends DatabaseCellLitElement {
  static tag = literal`affine-database-rich-text-cell-preview`;
}

@customElement('affine-database-rich-text-cell-editing')
class TextCellEditing extends DatabaseCellLitElement {
  static tag = literal`affine-database-rich-text-cell-editing`;
}
@customElement('affine-database-rich-text-column-property-editing')
class TextColumnPropertyEditing extends DatabaseCellLitElement {
  static tag = literal`affine-database-rich-text-column-property-editing`;
}
export const TextTagSchemaRenderer = defineTagSchemaRenderer(
  'rich-text',
  () => ({}),
  page => new page.Text(page, ''),
  {
    CellPreview: TextCellPreview,
    CellEditing: TextCellEditing,
    ColumnPropertyEditing: TextColumnPropertyEditing,
  },
  {
    displayName: 'Text',
  }
);
