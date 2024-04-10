import { IS_MAC } from '@blocksuite/global/env';
import { assertExists } from '@blocksuite/global/utils';
import type { Y } from '@blocksuite/store';
import { DocCollection } from '@blocksuite/store';
import { css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type { RichText } from '../../../../_common/components/index.js';
import type { DatabaseBlockComponent } from '../../../database-block.js';
import { BaseCellRenderer } from '../../column/index.js';
import { tRichText } from '../../logical/data-type.js';
import type { DataViewKanbanManager } from '../../views/kanban/kanban-view-manager.js';
import type { DataViewTableManager } from '../../views/table/table-view-manager.js';

const styles = css`
  data-view-header-area-text {
    width: 100%;
    display: flex;
  }

  data-view-header-area-text-editing {
    width: 100%;
    display: flex;
    cursor: text;
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

abstract class BaseTextCell extends BaseCellRenderer<unknown> {
  override view!: DataViewTableManager | DataViewKanbanManager;
  static override styles = styles;
  @property({ attribute: false })
  showIcon = false;
  get service() {
    const database = this.closest<DatabaseBlockComponent>('affine-database');
    return database?.service;
  }

  get inlineManager() {
    return this.service?.inlineManager;
  }
  get attributesSchema() {
    return this.inlineManager?.getSchema();
  }
  get attributeRenderer() {
    return this.inlineManager?.getRenderer();
  }
  get topContenteditableElement() {
    const databaseBlock =
      this.closest<DatabaseBlockComponent>('affine-database');
    return databaseBlock?.topContenteditableElement;
  }

  get titleColumn() {
    const columnId = this.view.header.titleColumn;
    assertExists(columnId);
    return this.view.columnGet(columnId);
  }

  @query('rich-text')
  richText!: RichText;
  get inlineEditor() {
    assertExists(this.richText);
    const inlineEditor = this.richText.inlineEditor;
    assertExists(inlineEditor);
    return inlineEditor;
  }

  override onExitEditMode() {
    if (!this._isRichText) {
      this.view.cellUpdateValue(
        this.rowId,
        this.titleColumn.id,
        this._isRichText
          ? this.inlineEditor?.yText
          : this.inlineEditor?.yText.toString()
      );
    }
  }

  getYText(text?: string | Y.Text) {
    if (
      this._isRichText &&
      (text instanceof DocCollection.Y.Text || text == null)
    ) {
      let yText = text;
      if (!yText) {
        yText = new DocCollection.Y.Text();
        this.titleColumn?.setValue(this.rowId, yText);
      }
      return yText;
    }
    const yText = new DocCollection.Y.Doc().getText('title');
    if (text instanceof DocCollection.Y.Text) {
      return text;
    }
    yText.insert(0, text ?? '');
    return yText;
  }

  renderIcon() {
    if (!this.showIcon) {
      return;
    }

    const iconColumn = this.view.header.iconColumn;
    if (!iconColumn) return;

    const icon = this.view.columnGet(iconColumn).getValue(this.rowId) as string;
    if (!icon) return;

    return html`<div class="data-view-header-area-icon">${icon}</div>`;
  }

  private get _isRichText() {
    return tRichText.is(this.titleColumn.dataType);
  }
}

@customElement('data-view-header-area-text')
export class HeaderAreaTextCell extends BaseTextCell {
  override render() {
    const yText = this.getYText(
      this.titleColumn.getValue(this.rowId) as Y.Text | string | undefined
    );
    return html`${this.renderIcon()}
      <rich-text
        .yText=${yText}
        .inlineEventSource=${this.topContenteditableElement}
        .attributesSchema=${this.attributesSchema}
        .attributeRenderer=${this.attributeRenderer}
        .embedChecker=${this.inlineManager?.embedChecker}
        .markdownShortcutHandler=${this.inlineManager?.markdownShortcutHandler}
        .readonly=${true}
        class="data-view-header-area-rich-text"
      ></rich-text>`;
  }
}

@customElement('data-view-header-area-text-editing')
export class HeaderAreaTextCellEditing extends BaseTextCell {
  override firstUpdated(props: Map<string, unknown>) {
    super.firstUpdated(props);

    this.richText.updateComplete
      .then(() => {
        this.inlineEditor.focusEnd();

        this.disposables.add(
          this.inlineEditor.slots.inlineRangeUpdate.on(([inlineRange]) => {
            if (inlineRange) {
              if (!this.isEditing) {
                this.selectCurrentCell(true);
              }
            } else {
              if (this.isEditing) {
                this.selectCurrentCell(false);
              }
            }
          })
        );
      })
      .catch(console.error);
  }

  public override connectedCallback() {
    super.connectedCallback();
    const selectAll = (e: KeyboardEvent) => {
      if (e.key === 'a' && (IS_MAC ? e.metaKey : e.ctrlKey)) {
        e.stopPropagation();
        e.preventDefault();
        this.inlineEditor.selectAll();
      }
    };
    this.addEventListener('keydown', selectAll);
    this.disposables.add(() => {
      this.removeEventListener('keydown', selectAll);
    });
  }

  override render() {
    const yText = this.getYText(
      this.titleColumn.getValue(this.rowId) as Y.Text | string | undefined
    );
    return html`${this.renderIcon()}
      <rich-text
        .yText=${yText}
        .inlineEventSource=${this.topContenteditableElement}
        .attributesSchema=${this.attributesSchema}
        .attributeRenderer=${this.attributeRenderer}
        .embedChecker=${this.inlineManager?.embedChecker}
        .markdownShortcutHandler=${this.inlineManager?.markdownShortcutHandler}
        .readonly=${this.readonly}
        class="data-view-header-area-rich-text"
      ></rich-text>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-area-text': HeaderAreaTextCell;
    'data-view-header-area-text-editing': HeaderAreaTextCellEditing;
  }
}
