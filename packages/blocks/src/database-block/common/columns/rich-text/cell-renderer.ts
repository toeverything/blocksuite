import '../../../../__internal__/rich-text/rich-text.js';

import type { Y } from '@blocksuite/store';
import { Text } from '@blocksuite/store';
import { css } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';
import { Text as YText, UndoManager } from 'yjs';

import { ClipboardItem } from '../../../../__internal__/clipboard/clipboard-item.js';
import {
  CLIPBOARD_MIMETYPE,
  performNativeCopy,
} from '../../../../__internal__/clipboard/utils/pure.js';
import {
  getCurrentNativeRange,
  hasNativeSelection,
  resetNativeSelection,
} from '../../../../__internal__/index.js';
import type { RichText } from '../../../../__internal__/rich-text/rich-text.js';
import { attributeRenderer } from '../../../../__internal__/rich-text/virgo/attribute-renderer.js';
import type { AffineTextSchema } from '../../../../__internal__/rich-text/virgo/types.js';
import { affineTextAttributes } from '../../../../__internal__/rich-text/virgo/types.js';
import { createIcon } from '../../../../components/icon/uni-icon.js';
import { BaseCellRenderer } from '../base-cell.js';
import { columnRenderer, createFromBaseCellRenderer } from '../renderer.js';
import { richTextColumnTypeName, richTextPureColumnConfig } from './define.js';

const textSchema: AffineTextSchema = {
  textRenderer: attributeRenderer,
  attributesSchema: affineTextAttributes,
};

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

  private yText!: Y.Text;
  private undoManager!: UndoManager;

  override connectedCallback() {
    super.connectedCallback();
    this.yText = this.getYText();
    this.undoManager = new UndoManager(this.yText, {
      trackedOrigins: new Set([this.yText.doc?.clientID]),
    });
  }

  private _initYText = (text?: string) => {
    const yText = new YText(text);
    this.onChange(yText);
    return yText;
  };

  private getYText() {
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

    return value;
  }

  override render() {
    return html` <rich-text
      class="affine-database-rich-text"
      .yText="${this.yText}"
      .undoManager="${this.undoManager}"
      .textSchema="${textSchema}"
      .readonly="${true}"
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

  @query('rich-text')
  private richText!: RichText;

  get vEditor() {
    return this.richText.vEditor;
  }

  private yText!: Y.Text;
  private undoManager!: UndoManager;

  override connectedCallback() {
    super.connectedCallback();
    this.yText = this.getYText();
    this.undoManager = new UndoManager(this.yText, {
      trackedOrigins: new Set([this.yText.doc]),
    });
    requestAnimationFrame(() => {
      this.richText.vEditor?.focusEnd();
    });
  }

  private _initYText = (text?: string) => {
    const yText = new YText(text);
    this.onChange(yText);
    return yText;
  };

  private getYText() {
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

    return value;
  }

  override onCopy(_e: ClipboardEvent) {
    let data = '';
    const range = this.vEditor?.getVRange();
    if (range) {
      const start = range.index;
      const end = range.index + range.length;
      const value = this.column.getStringValue(this.rowId);
      data = value?.slice(start, end) ?? '';
    }
    const textClipboardItem = new ClipboardItem(CLIPBOARD_MIMETYPE.TEXT, data);

    const savedRange = hasNativeSelection() ? getCurrentNativeRange() : null;
    performNativeCopy([textClipboardItem]);
    if (savedRange) {
      resetNativeSelection(savedRange);
    }
  }

  override onPaste(e: ClipboardEvent) {
    const textClipboardData = e.clipboardData?.getData(CLIPBOARD_MIMETYPE.TEXT);
    if (!textClipboardData) return;

    const range = this.vEditor?.getVRange();
    const yText = this.vEditor?.yText;
    if (yText) {
      const text = new Text(yText);
      const index = range?.index ?? yText.length;
      text.insert(textClipboardData, index);
      this.vEditor?.setVRange({
        index: index + textClipboardData.length,
        length: 0,
      });
    }
  }

  override render() {
    return html` <rich-text
      class="affine-database-rich-text"
      .yText="${this.yText}"
      .undoManager="${this.undoManager}"
      .textSchema="${textSchema}"
      .readonly="${this.readonly}"
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
