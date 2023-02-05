import {
  DatabaseCellLitElement,
  defineTagSchemaRenderer,
} from '../../register.js';
import { customElement, query } from 'lit/decorators.js';
import { html, literal } from 'lit/static-html.js';
import {
  BaseArrtiubtes,
  BaseText,
  DeltaInsert,
  InlineCode,
  InlineCodeAttributes,
  TextAttributes,
  TextElement,
  VEditor,
} from '@blocksuite/virgo';
import { css } from 'lit';

function renderElement(delta: DeltaInsert<TextAttributes>): TextElement {
  switch (delta.attributes.type) {
    case 'base': {
      const baseText = new BaseText();
      baseText.delta = delta as DeltaInsert<BaseArrtiubtes>;
      return baseText;
    }
    case 'inline-code': {
      const inlineCode = new InlineCode();
      inlineCode.delta = delta as DeltaInsert<InlineCodeAttributes>;
      return inlineCode;
    }

    default:
      throw new Error(`Unknown text type: ${delta.attributes.type}`);
  }
}

const baseStyle: Array<Exclude<keyof BaseArrtiubtes, 'type'>> = [
  'bold',
  'italic',
  'underline',
  'strikethrough',
];
function toggleStyle(
  vEditor: VEditor,
  type: Exclude<keyof BaseArrtiubtes, 'type'> | 'inline-code'
): void {
  const vRange = vEditor.getVRange();
  if (!vRange) {
    return;
  }

  const root = vEditor.getRootElement();
  if (!root) {
    return;
  }

  const deltas = vEditor.getDeltasByVRange(vRange);

  if (baseStyle.includes(type as Exclude<keyof BaseArrtiubtes, 'type'>)) {
    vEditor.formatText(
      vRange,
      {
        type: 'base',
        [type]: deltas.every(
          ([d]) =>
            d.attributes.type === 'base' &&
            d.attributes[type as Exclude<keyof BaseArrtiubtes, 'type'>]
        )
          ? null
          : true,
      },
      {
        mode: 'merge',
      }
    );
    root.blur();
  } else if (type === 'inline-code') {
    vEditor.formatText(
      vRange,
      {
        type: deltas.every(([d]) => d.attributes.type === 'inline-code')
          ? 'base'
          : 'inline-code',
      },
      {
        mode: 'merge',
      }
    );
    root.blur();
  }

  vEditor.syncVRange();
}

@customElement('affine-database-rich-text-cell')
class TextCell extends DatabaseCellLitElement {
  static styles = css`
    :host {
      width: 100%;
      height: 100%;
    }
  `;

  vEditor: VEditor | null = null;
  static tag = literal`affine-database-rich-text-cell`;

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
      this.vEditor = new VEditor(yText, {
        renderElement,
        onKeyDown: this._handleKeyDown,
      });
      this.vEditor.mount(this._container);
      this.vEditor.focusEnd();
    }
  }

  private _handleKeyDown = (event: KeyboardEvent) => {
    if (!this.vEditor) {
      return;
    }
    const vEditor = this.vEditor;

    switch (event.key) {
      // bold ctrl+b
      case 'B':
      case 'b':
        if (event.metaKey || event.ctrlKey) {
          event.preventDefault();
          toggleStyle(vEditor, 'bold');
        }
        break;
      // italic ctrl+i
      case 'I':
      case 'i':
        if (event.metaKey || event.ctrlKey) {
          event.preventDefault();
          toggleStyle(vEditor, 'italic');
        }
        break;
      // underline ctrl+u
      case 'U':
      case 'u':
        if (event.metaKey || event.ctrlKey) {
          event.preventDefault();
          toggleStyle(vEditor, 'underline');
        }
        break;
      // strikethrough ctrl+shift+s
      case 'S':
      case 's':
        if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
          event.preventDefault();
          toggleStyle(vEditor, 'strikethrough');
        }
        break;
      // inline code ctrl+shift+e
      case 'E':
      case 'e':
        if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
          event.preventDefault();
          toggleStyle(vEditor, 'inline-code');
        }
        break;
      default:
        break;
    }
  };

  protected update(changedProperties: Map<string, unknown>) {
    super.update(changedProperties);
    if (this.tag && !this.vEditor) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.vEditor = new VEditor(this.tag.value as any, {
        renderElement,
        onKeyDown: this._handleKeyDown,
      });

      this.vEditor.mount(this._container);
    } else if (!this.tag && this.vEditor) {
      this.vEditor.unmount();
      this.vEditor = null;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this._handleClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._handleClick);
    this.vEditor?.unmount();
    this.vEditor = null;
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
    Cell: TextCell,
    CellEditing: false,
    ColumnPropertyEditing: TextColumnPropertyEditing,
  },
  {
    displayName: 'Rich Text',
  }
);
