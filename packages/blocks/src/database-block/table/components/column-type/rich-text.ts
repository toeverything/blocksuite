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
} from '../../../../__internal__/rich-text/virgo/types.js';
import { activeEditorManager } from '../../../../__internal__/utils/active-editor-manager.js';
import { setupVirgoScroll } from '../../../../__internal__/utils/virgo.js';
import {
  DatabaseCellElement,
  defineColumnRenderer,
  type TableViewCell,
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
export class TextCell
  extends DatabaseCellElement<Y.Text>
  implements TableViewCell
{
  static override styles = css`
    affine-database-rich-text-cell {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      cursor: text;
    }

    .affine-database-rich-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      height: 100%;
      outline: none;
    }
    .affine-database-rich-text v-line {
      display: flex !important;
      align-items: center;
      height: 100%;
      width: 100%;
    }
    .affine-database-rich-text v-line > div {
      flex-grow: 1;
    }
  `;

  vEditor: AffineVEditor | null = null;
  static override tag = literal`affine-database-rich-text-cell`;
  cellType = 'rich-text' as const;

  @query('.affine-database-rich-text')
  private _container!: HTMLDivElement;

  private get readonly() {
    return this.databaseModel.page.readonly;
  }

  protected override firstUpdated() {
    this._onInitVEditor();
    this._disposables.addFromEvent(this, 'click', this._handleClick);
  }

  private _handleClick() {
    this.databaseModel.page.captureSync();
  }

  private _initYText = (text?: string) => {
    const yText = new this.databaseModel.page.YText(text);
    this.databaseModel.updateCell(this.rowModel.id, {
      columnId: this.column.id,
      value: yText,
    });
    return yText;
  };

  private _onInitVEditor() {
    let value: Y.Text;
    if (!this.cell?.value) {
      value = this._initYText();
    } else {
      // When copying the database, the type of the value is `string`.s
      if (typeof this.cell.value === 'string') {
        value = this._initYText(this.cell.value);
      } else {
        value = this.cell.value;
      }
    }

    this.vEditor = new VEditor(value, {
      active: () => activeEditorManager.isActive(this),
    });
    setupVirgoScroll(this.databaseModel.page, this.vEditor);
    this.vEditor.mount(this._container);
    this.vEditor.bindHandlers({
      keydown: this._handleKeyDown,
    });
    this.vEditor.setReadonly(this.readonly);
  }

  private _handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') {
      if (event.key === 'Tab') {
        event.preventDefault();
        return;
      }
      event.stopPropagation();
    }

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
    if (this.cell && this.vEditor) {
      const vRange = this.vEditor.getVRange();
      assertExists(vRange);

      const page = this.databaseModel.page;
      page.captureSync();
      const text = new Text(this.vEditor.yText);
      text.replace(vRange.index, length, '\n');
      this.vEditor.setVRange({
        index: vRange.index + 1,
        length: 0,
      });
    }
  };

  override render() {
    return html`<div class="affine-database-rich-text virgo-editor"></div>`;
  }
}

export const RichTextColumnRenderer = defineColumnRenderer(
  'rich-text',
  () => ({}),
  page => new page.YText(''),
  {
    Cell: TextCell,
    CellEditing: null,
  },
  {
    displayName: 'Rich Text',
  }
);
