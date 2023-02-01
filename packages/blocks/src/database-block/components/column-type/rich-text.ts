import {
  DatabaseCellLitElement,
  defineTagSchemaRenderer,
} from '@blocksuite/global/database';
import { customElement } from 'lit/decorators.js';
import { html, literal } from 'lit/static-html.js';
import { VEditor } from '@blocksuite/virgo';

@customElement('affine-database-rich-text-cell-preview')
class TextCellPreview extends DatabaseCellLitElement {
  vEditor: VEditor | null = null;
  static tag = literal`affine-database-rich-text-cell-preview`;

  constructor() {
    super();
  }

  protected firstUpdated() {
    if (this.tag) {
      console.log(this.tag.value);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.vEditor = new VEditor(this.tag.value as any);
      this.vEditor.mount(this);
    }
  }

  render() {
    return html``;
  }
}

@customElement('affine-database-rich-text-cell-editing')
class TextCellEditing extends DatabaseCellLitElement {
  static tag = literal`affine-database-rich-text-cell-editing`;
}
@customElement('affine-database-rich-text-column-property-editing')
class TextColumnPropertyEditing extends DatabaseCellLitElement {
  static tag = literal`affine-database-rich-text-column-property-editing`;
}
export const RichTextTagSchemaRenderer = defineTagSchemaRenderer(
  'rich-text',
  () => ({}),
  page => new page.YText(''),
  {
    CellPreview: TextCellPreview,
    CellEditing: TextCellEditing,
    ColumnPropertyEditing: TextColumnPropertyEditing,
  },
  {
    displayName: 'Rich Text',
  }
);
