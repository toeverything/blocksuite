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

  private _handleClick() {
    this.databaseModel.page.captureSync();
    if (!this.tag) {
      const yText = new this.databaseModel.page.YText();
      this.databaseModel.page.updateBlockTag(this.rowModel.id, {
        schemaId: this.column.id,
        value: yText,
      });
      this.vEditor = new VEditor(yText);
      this.vEditor.mount(this._container);
    }
  }

  protected firstUpdated() {
    if (this.tag) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.vEditor = new VEditor(this.tag.value as any);
      this.vEditor.mount(this._container);
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this._handleClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._handleClick);
    super.disconnectedCallback();
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
    CellEditing: false,
    ColumnPropertyEditing: TextColumnPropertyEditing,
  },
  {
    displayName: 'Rich Text',
  }
);
