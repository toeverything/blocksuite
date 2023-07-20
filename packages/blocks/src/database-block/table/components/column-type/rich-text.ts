import { assertExists } from '@blocksuite/global/utils';
import type { Y } from '@blocksuite/store';
import { Text } from '@blocksuite/store';
import { VEditor } from '@blocksuite/virgo';
import { css } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';
import { Text as YText } from 'yjs';

import type {
  AffineTextAttributes,
  AffineVEditor,
} from '../../../../__internal__/rich-text/virgo/types.js';
import { activeEditorManager } from '../../../../__internal__/utils/active-editor-manager.js';
import { setupVirgoScroll } from '../../../../__internal__/utils/virgo.js';
import { DatabaseCellElement } from '../../register.js';

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
export class RichTextCell extends DatabaseCellElement<Y.Text> {
  static override styles = css`
    affine-database-rich-text-cell {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      user-select: none;
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

  @query('.affine-database-rich-text')
  private _container!: HTMLDivElement;

  protected override firstUpdated() {
    this._onInitVEditor();
    this.column.captureSync();
  }

  private _initYText = (text?: string) => {
    const yText = new YText(text);

    this.onChange(yText);
    return yText;
  };

  private _onInitVEditor() {
    let value: Y.Text;
    if (!this.value) {
      value = this._initYText();
    } else {
      // When copying the database, the type of the value is `string`.
      if (typeof this.value === 'string') {
        value = this._initYText(this.value);
      } else {
        value = this.value;
      }
    }

    this.vEditor = new VEditor(value, {
      active: () => activeEditorManager.isActive(this),
    });
    setupVirgoScroll(this, this.vEditor);
    this.vEditor.mount(this._container);
    this.vEditor.setReadonly(true);
  }

  override render() {
    return html` <div class="affine-database-rich-text virgo-editor"></div>`;
  }
}

@customElement('affine-database-rich-text-cell-editing')
export class RichTextCellEditing extends DatabaseCellElement<Y.Text> {
  static override styles = css`
    affine-database-rich-text-cell-editing {
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

  @query('.affine-database-rich-text')
  private _container!: HTMLDivElement;

  protected override firstUpdated() {
    this._onInitVEditor();
    this.column.captureSync();
  }

  private _initYText = (text?: string) => {
    const yText = new YText(text);

    this.onChange(yText);
    return yText;
  };

  private _onInitVEditor() {
    let value: Y.Text;
    if (!this.value) {
      value = this._initYText();
    } else {
      // When copying the database, the type of the value is `string`.
      if (typeof this.value === 'string') {
        value = this._initYText(this.value);
      } else {
        value = this.value;
      }
    }

    this.vEditor = new VEditor(value, {
      active: () => activeEditorManager.isActive(this),
    });
    setupVirgoScroll(this, this.vEditor);
    this.vEditor.mount(this._container);
    this.vEditor.bindHandlers({
      keydown: this._handleKeyDown,
    });
    this.vEditor.focusEnd();
    this.vEditor.setReadonly(this.readonly);
  }

  private _handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') {
      if (event.key === 'Tab') {
        event.preventDefault();
        return;
      }
      event.stopPropagation();
    } else {
      // this._setEditing(false);
      // this._container.blur();
    }

    if (!this.vEditor) return;
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // soft enter
        this._onSoftEnter();
      } else {
        // exit editing
        this.selectCurrentCell(false);
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
    if (this.value && this.vEditor) {
      const vRange = this.vEditor.getVRange();
      assertExists(vRange);

      this.column.captureSync();
      const text = new Text(this.vEditor.yText);
      text.replace(vRange.index, length, '\n');
      this.vEditor.setVRange({
        index: vRange.index + 1,
        length: 0,
      });
    }
  };

  override render() {
    return html` <div class="affine-database-rich-text virgo-editor"></div>`;
  }
}
