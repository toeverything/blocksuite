import { IS_MAC } from '@blocksuite/global/env';
import { assertExists } from '@blocksuite/global/utils';
import type { Text } from '@blocksuite/store';
import { css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type { RichText } from '../../../_common/components/index.js';
import { BaseCellRenderer } from '../../data-view/column/index.js';
import type { DataViewKanbanManager } from '../../data-view/view/presets/kanban/kanban-view-manager.js';
import type { DataViewTableManager } from '../../data-view/view/presets/table/table-view-manager.js';
import type { DatabaseBlockComponent } from '../../database-block.js';

const styles = css`
  data-view-header-area-text {
    width: 100%;
    display: flex;
  }

  data-view-header-area-text rich-text {
    pointer-events: none;
    user-select: none;
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

abstract class BaseTextCell extends BaseCellRenderer<Text> {
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
}

@customElement('data-view-header-area-text')
export class HeaderAreaTextCell extends BaseTextCell {
  override render() {
    return html`${this.renderIcon()}
      <rich-text
        .yText=${this.value}
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
    return html`${this.renderIcon()}
      <rich-text
        .yText=${this.value}
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
