import { assertExists } from '@blocksuite/global/utils';
import { css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';
import type * as Y from 'yjs';
import { Doc, Text as YText, UndoManager } from 'yjs';

import type { RichText } from '../../../__internal__/rich-text/rich-text.js';
import { attributeRenderer } from '../../../__internal__/rich-text/virgo/attribute-renderer.js';
import type { AffineTextSchema } from '../../../__internal__/rich-text/virgo/types.js';
import { affineTextAttributes } from '../../../__internal__/rich-text/virgo/types.js';
import type { DataViewKanbanManager } from '../../kanban/kanban-view-manager.js';
import { tRichText } from '../../logical/data-type.js';
import type { DataViewTableManager } from '../../table/table-view-manager.js';
import { BaseCellRenderer } from '../columns/base-cell.js';

const textSchema: AffineTextSchema = {
  textRenderer: attributeRenderer,
  attributesSchema: affineTextAttributes,
};

const styles = css`
  data-view-header-area-text {
    width: 100%;
    display: flex;
  }

  data-view-header-area-text-editing {
    width: 100%;
    display: flex;
  }

  .data-view-header-area-rich-text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    height: 100%;
    outline: none;
    word-break: break-all;
    font-size: var(--data-view-cell-text-size);
    line-height: var(--data-view-cell-text-line-height);
  }

  .data-view-header-area-rich-text v-line {
    display: flex !important;
    align-items: center;
    height: 100%;
    width: 100%;
  }

  .data-view-header-area-rich-text v-line > div {
    flex-grow: 1;
  }

  .data-view-header-area-icon {
    height: max-content;
    display: flex;
    align-items: center;
    margin-right: 8px;
    padding: 2px;
    border-radius: 4px;
    margin-top: 2px;
    background-color: var(--affine-background-secondary-color);
  }

  .data-view-header-area-icon svg {
    width: 14px;
    height: 14px;
    fill: var(--affine-icon-color);
    color: var(--affine-icon-color);
  }
`;

class BaseTextCell extends BaseCellRenderer<unknown> {
  override view!: DataViewTableManager | DataViewKanbanManager;
  static override styles = styles;
  @property({ attribute: false })
  showIcon = false;

  get titleColumn() {
    const columnId = this.view.header.titleColumn;
    assertExists(columnId);
    return this.view.columnGet(columnId);
  }

  protected get isRichText() {
    return tRichText.is(this.titleColumn.dataType);
  }

  yText!: Y.Text;
  undoManager!: UndoManager;
  @query('rich-text')
  richText!: RichText;

  get vEditor() {
    return this.richText.vEditor;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.yText = this.getYText(
      this.titleColumn.getValue(this.rowId) as YText | string | undefined
    );
    this.undoManager = new UndoManager(this.yText, {
      trackedOrigins: new Set([this.yText.doc?.clientID]),
    });
  }

  private getYText(text?: string | YText) {
    let yText: YText;
    if (text instanceof YText) {
      yText = text;
    } else {
      if (this.isRichText) {
        yText = new YText(text);
        this.titleColumn?.setValue(this.rowId, yText);
      } else {
        const title = new Doc().getText('title');
        title.insert(0, text ?? '');
        yText = title;
      }
    }
    return yText;
  }

  public override onExitEditMode() {
    if (!this.isRichText) {
      this.view.cellUpdateValue(
        this.rowId,
        this.titleColumn.id,
        this.isRichText ? this.richText.yText : this.richText.yText.toString()
      );
    }
  }

  private get icon(): string | undefined {
    const iconColumn = this.view.header.iconColumn;
    if (!iconColumn) return;
    return this.view.columnGet(iconColumn).getValue(this.rowId) as string;
  }

  private renderIcon() {
    if (!this.showIcon) {
      return;
    }
    const icon = this.icon;
    if (!icon) {
      return;
    }
    return html` <div class="data-view-header-area-icon">${icon}</div>`;
  }

  override render() {
    return html` ${this.renderIcon()}
      <rich-text
        class="data-view-header-area-rich-text"
        .yText="${this.yText}"
        .undoManager="${this.undoManager}"
        .textSchema="${textSchema}"
        .readonly="${this.readonly}"
      ></rich-text>
      <div class="data-view-header-area-rich-text"></div>`;
  }
}

@customElement('data-view-header-area-text')
export class HeaderAreaTextCell extends BaseTextCell {
  override get readonly(): boolean {
    return true;
  }
}

@customElement('data-view-header-area-text-editing')
export class HeaderAreaTextCellEditing extends BaseTextCell {
  override connectedCallback() {
    super.connectedCallback();
    requestAnimationFrame(() => {
      this.richText.vEditor?.focusEnd();
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-area-text': HeaderAreaTextCell;
    'data-view-header-area-text-editing': HeaderAreaTextCellEditing;
  }
}
