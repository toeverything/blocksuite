import {
  DatabaseCellLitElement,
  defineTagSchemaRenderer,
} from '@blocksuite/global/database';
import { customElement, query } from 'lit/decorators.js';
import { html, literal } from 'lit/static-html.js';
import { VEditor } from '@blocksuite/virgo';

@customElement('affine-database-rich-text-cell-preview')
class TextCellPreview extends DatabaseCellLitElement {
  vEditor: VEditor | null = null;
  static tag = literal`affine-database-rich-text-cell-preview`;

  @query('.rich-text-container')
  private _container!: HTMLDivElement;

  constructor() {
    super();
  }

  protected firstUpdated() {
    if (this.tag) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.vEditor = new VEditor(this.tag.value as any);
      this.vEditor.mount(this._container);
    }
  }

  render() {
    return html`
      <style>
        .rich-text-container {
          width: 100%;
          height: 100%;
          outline: none;
        }
      </style>
      <div class="rich-text-container"></div>
    `;
  }
}

@customElement('affine-database-rich-text-cell-editing')
class TextCellEditing extends DatabaseCellLitElement {
  static tag = literal`affine-database-rich-text-cell-editing`;
  vEditor: VEditor | null = null;

  @query('.rich-text-container')
  private _container!: HTMLDivElement;

  constructor() {
    super();
  }

  protected firstUpdated() {
    if (this.tag) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.vEditor = new VEditor(this.tag.value as any);
      this.vEditor.mount(this._container);
    }
  }

  render() {
    return html`
      <style>
        .rich-text-container {
          width: 100%;
          height: 100%;
          outline: none;
        }
      </style>
      <div class="rich-text-container"></div>
    `;
  }
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
    Cell: TextCellPreview,
    CellEditing: TextCellEditing,
    ColumnPropertyEditing: TextColumnPropertyEditing,
  },
  {
    displayName: 'Rich Text',
  }
);
