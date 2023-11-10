import { assertExists } from '@blocksuite/global/utils';
import type { Y } from '@blocksuite/store';
import { Text, Workspace } from '@blocksuite/store';
import { css } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import { createIcon } from '../../../../_common/components/icon/uni-icon.js';
import type { RichText } from '../../../../_common/components/rich-text/rich-text.js';
import { affineAttributeRenderer } from '../../../../_common/components/rich-text/virgo/attribute-renderer.js';
import {
  type AffineTextAttributes,
  affineTextAttributes,
  type AffineVEditor,
} from '../../../../_common/components/rich-text/virgo/types.js';
import { BaseCellRenderer } from '../base-cell.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { richTextColumnTypeName, richTextPureColumnConfig } from './define.js';

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
        v ===
          (
            oldAttributes as {
              [k: string]: unknown;
            }
          )[k]
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
export class RichTextCell extends BaseCellRenderer<Y.Text> {
  static override styles = css`
    affine-database-rich-text-cell {
      display: flex;
      align-items: center;
      width: 100%;
      user-select: none;
    }

    .affine-database-rich-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      height: 100%;
      outline: none;
      font-size: var(--data-view-cell-text-size);
      line-height: var(--data-view-cell-text-line-height);
      word-break: break-all;
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

  readonly attributesSchema = affineTextAttributes;
  readonly attributeRenderer = affineAttributeRenderer;

  @query('rich-text')
  private _richTextElement?: RichText;

  get vEditor() {
    assertExists(this._richTextElement);
    const vEditor = this._richTextElement.vEditor;
    assertExists(vEditor);
    return vEditor;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.value || typeof this.value === 'string') {
      this._initYText(this.value);
    }
  }

  private _initYText = (text?: string) => {
    const yText = new Workspace.Y.Text(text);
    this.onChange(yText);
  };

  override render() {
    return html`<rich-text
      .yText=${this.value}
      .attributesSchema=${this.attributesSchema}
      .attributeRenderer=${this.attributeRenderer}
      .readonly=${true}
      class="affine-database-rich-text virgo-editor"
    ></rich-text>`;
  }
}

@customElement('affine-database-rich-text-cell-editing')
export class RichTextCellEditing extends BaseCellRenderer<Y.Text> {
  static override styles = css`
    affine-database-rich-text-cell-editing {
      display: flex;
      align-items: center;
      width: 100%;
      min-width: 1px;
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

  readonly attributesSchema = affineTextAttributes;
  readonly attributeRenderer = affineAttributeRenderer;

  @query('rich-text')
  private _richTextElement?: RichText;

  get vEditor() {
    assertExists(this._richTextElement);
    const vEditor = this._richTextElement.vEditor;
    assertExists(vEditor);
    return vEditor;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.value || typeof this.value === 'string') {
      this._initYText(this.value);
    }
  }

  override firstUpdated() {
    assertExists(this._richTextElement);
    this.disposables.addFromEvent(
      this._richTextElement,
      'keydown',
      this._handleKeyDown
    );

    this._richTextElement?.updateComplete.then(() => {
      this.vEditor.focusEnd();
    });
  }

  private _initYText = (text?: string) => {
    const yText = new Workspace.Y.Text(text);
    this.onChange(yText);
  };

  private _handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') {
      if (event.key === 'Tab') {
        event.preventDefault();
        return;
      }
      event.stopPropagation();
    }

    if (event.key === 'Enter' && !event.isComposing) {
      if (event.shiftKey) {
        // soft enter
        this._onSoftEnter();
      } else {
        // exit editing
        this.selectCurrentCell(false);
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
    return html`<rich-text
      .yText=${this.value}
      .attributesSchema=${this.attributesSchema}
      .attributeRenderer=${this.attributeRenderer}
      class="affine-database-rich-text virgo-editor"
    ></rich-text>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-rich-text-cell-editing': RichTextCellEditing;
  }
}

columnRenderer.register({
  type: richTextColumnTypeName,
  icon: createIcon('TextIcon'),

  cellRenderer: {
    view: createFromBaseCellRenderer(RichTextCell),
    edit: createFromBaseCellRenderer(RichTextCellEditing),
  },
});

export const richTextColumnConfig = richTextPureColumnConfig;
