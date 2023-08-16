import { assertExists } from '@blocksuite/global/utils';
import { VEditor } from '@blocksuite/virgo';
import { css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';
import { Doc, Text as YText } from 'yjs';

import { activeEditorManager } from '../../../__internal__/utils/active-editor-manager.js';
import type { DataViewKanbanManager } from '../../kanban/kanban-view-manager.js';
import { tRichText } from '../../logical/data-type.js';
import type { DataViewTableManager } from '../../table/table-view-manager.js';
import { BaseCellRenderer } from '../columns/base-cell.js';
import { createFromBaseCellRenderer } from '../columns/renderer.js';

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
    height: var(--data-view-cell-text-line-height);
    display: flex;
    align-items: center;
    margin-right: 4px;
  }
  .data-view-header-area-icon img {
    width: 20px;
    height: 20px;
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

  editor?: VEditor;

  @query('.data-view-header-area-rich-text')
  richText!: HTMLElement;

  protected initVirgo(): VEditor {
    const yText = this.getYText(
      this.titleColumn.getValue(this.rowId) as YText | string | undefined
    );
    this.editor = new VEditor(yText, {
      active: () => activeEditorManager.isActive(this),
    });
    this.editor.mount(this.richText);
    return this.editor;
  }

  private getYText(text?: string | YText) {
    if (this.isRichText && (text instanceof YText || text == null)) {
      const yText = text ?? new YText();

      this.titleColumn?.setValue(this.rowId, yText);
      return yText;
    }
    const yText = new Doc().getText('title');
    if (text instanceof YText) {
      return text;
    }
    yText.insert(0, text ?? '');
    return yText;
  }

  public override onExitEditMode() {
    this.view.cellUpdateValue(
      this.rowId,
      this.titleColumn.id,
      this.isRichText ? this.editor?.yText : this.editor?.yText.toString()
    );
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
    return html`<div class="data-view-header-area-icon">
      <img src="${icon}" alt="" />
    </div>`;
  }

  override render() {
    return html` ${this.renderIcon()}
      <div class="data-view-header-area-rich-text"></div>`;
  }
}

@customElement('data-view-header-area-text')
export class HeaderAreaTextCell extends BaseTextCell {
  public override firstUpdated() {
    super.connectedCallback();
    const editor = this.initVirgo();
    editor.setReadonly(true);
  }
}

@customElement('data-view-header-area-text-editing')
export class HeaderAreaTextCellEditing extends BaseTextCell {
  public override firstUpdated() {
    super.connectedCallback();
    const editor = this.initVirgo();
    editor.focusEnd();
    this._disposables.add(
      editor.slots.vRangeUpdated.on(([range]) => {
        if (range) {
          if (!this.isEditing) {
            this.selectCurrentCell(true);
          }
          this.onRectChange?.();
        } else {
          if (this.isEditing) {
            this.selectCurrentCell(false);
          }
        }
      })
    );
  }
}

export const textRenderer = {
  view: createFromBaseCellRenderer(HeaderAreaTextCell),
  edit: createFromBaseCellRenderer(HeaderAreaTextCellEditing),
};
