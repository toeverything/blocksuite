import { assertExists } from '@blocksuite/global/utils';
import type { Y } from '@blocksuite/store';
import { Text } from '@blocksuite/store';
import { VEditor } from '@blocksuite/virgo';
import { css } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { html, literal } from 'lit/static-html.js';

import type {
  AffineTextAttributes,
  AffineVEditor,
} from '../../../__internal__/rich-text/virgo/types.js';
import { setupVirgoScroll } from '../../../__internal__/utils/virgo.js';
import {
  DatabaseCellLitElement,
  defineColumnSchemaRenderer,
} from '../../register.js';

function toggleStyle(
  vEditor: AffineVEditor,
  attrs: AffineTextAttributes
): void {
  const vRange = vEditor.getVRange();
  if (!vRange) {
    return;
  }

  const root = vEditor.rootElement;
  if (!root) {
    return;
  }

  const deltas = vEditor.getDeltasByVRange(vRange);
  let oldAttributes: AffineTextAttributes = {};

  for (const [delta] of deltas) {
    const attributes = delta.attributes;

    if (!attributes) {
      continue;
    }

    oldAttributes = { ...attributes };
  }

  const newAttributes = Object.fromEntries(
    Object.entries(attrs).map(([k, v]) => {
      if (
        typeof v === 'boolean' &&
        v === (oldAttributes as { [k: string]: unknown })[k]
      ) {
        return [k, !v];
      } else {
        return [k, v];
      }
    })
  );

  vEditor.formatText(vRange, newAttributes, {
    mode: 'merge',
  });
  root.blur();

  vEditor.syncVRange();
}

@customElement('affine-database-rich-text-cell')
class TextCell extends DatabaseCellLitElement<Y.Text> {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
    }
  `;

  vEditor: AffineVEditor | null = null;
  static tag = literal`affine-database-rich-text-cell`;

  @query('.rich-text-container')
  private _container!: HTMLDivElement;

  constructor() {
    super();
  }

  private _handleClick() {
    this.databaseModel.page.captureSync();
    if (!this.column) {
      const yText = new this.databaseModel.page.YText();
      this.databaseModel.page.updateBlockColumn(this.rowModel.id, {
        schemaId: this.columnSchema.id,
        value: yText,
      });
      this.vEditor = new VEditor(yText);
      setupVirgoScroll(this.databaseModel.page, this.vEditor);
      this.vEditor.mount(this._container);
      this.vEditor.bindHandlers({
        keydown: this._handleKeyDown,
      });
      this.vEditor.focusEnd();
    }
  }

  private _handleKeyDown = (event: KeyboardEvent) => {
    if (!this.vEditor) return;
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // soft enter
        this._onSoftEnter();
      } else {
        // exit editing
        this.rowHost.setEditing(false);
        this._container.blur();
      }
      event.preventDefault();
      return;
    }

    const vEditor = this.vEditor;

    switch (event.key) {
      // bold ctrl+b
      case 'B':
      case 'b':
        if (event.metaKey || event.ctrlKey) {
          event.preventDefault();
          toggleStyle(this.vEditor, { bold: true });
        }
        break;
      // italic ctrl+i
      case 'I':
      case 'i':
        if (event.metaKey || event.ctrlKey) {
          event.preventDefault();
          toggleStyle(this.vEditor, { italic: true });
        }
        break;
      // underline ctrl+u
      case 'U':
      case 'u':
        if (event.metaKey || event.ctrlKey) {
          event.preventDefault();
          toggleStyle(this.vEditor, { underline: true });
        }
        break;
      // strikethrough ctrl+shift+s
      case 'S':
      case 's':
        if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
          event.preventDefault();
          toggleStyle(vEditor, { strike: true });
        }
        break;
      // inline code ctrl+shift+e
      case 'E':
      case 'e':
        if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
          event.preventDefault();
          toggleStyle(vEditor, { code: true });
        }
        break;
      default:
        break;
    }
  };

  private _onSoftEnter = () => {
    if (this.column && this.vEditor) {
      const vRange = this.vEditor.getVRange();
      assertExists(vRange);

      const page = this.databaseModel.page;
      page.captureSync();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = new Text(this.column.value as any);
      text.replace(vRange.index, length, '\n');
      this.vEditor.setVRange({
        index: vRange.index + 1,
        length: 0,
      });
    }
  };

  protected update(changedProperties: Map<string, unknown>) {
    super.update(changedProperties);
    if (this.column && !this.vEditor) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.vEditor = new VEditor(this.column.value as any);
      setupVirgoScroll(this.databaseModel.page, this.vEditor);
      this.vEditor.mount(this._container);
      this.vEditor.bindHandlers({
        keydown: this._handleKeyDown,
      });
    } else if (!this.column && this.vEditor) {
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
          outline: none;
        }
      </style>
      <div class="rich-text-container"></div>
    `;
  }
}

@customElement('affine-database-rich-text-column-property-editing')
class TextColumnPropertyEditing extends DatabaseCellLitElement<Y.Text> {
  static tag = literal`affine-database-rich-text-column-property-editing`;
}

export const RichTextColumnSchemaRenderer = defineColumnSchemaRenderer(
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
