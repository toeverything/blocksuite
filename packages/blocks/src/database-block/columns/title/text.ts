import { IS_MAC } from '@blocksuite/global/env';
import { assertExists } from '@blocksuite/global/utils';
import type { Text } from '@blocksuite/store';
import { css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type { RichText } from '../../../_common/components/index.js';
import { getViewportElement } from '../../../_common/utils/query.js';
import { isValidUrl } from '../../../_common/utils/url.js';
import { HostContextKey } from '../../context/host-context.js';
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
  get service() {
    return this.view
      .getContext(HostContextKey)
      ?.std.spec.getService('affine:database');
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

  get inlineEditor() {
    assertExists(this.richText);
    const inlineEditor = this.richText.inlineEditor;
    assertExists(inlineEditor);
    return inlineEditor;
  }

  static override styles = styles;

  override accessor view!: DataViewTableManager | DataViewKanbanManager;

  @property({ attribute: false })
  accessor showIcon = false;

  @query('rich-text')
  accessor richText!: RichText;

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
  private _onCopy = (e: ClipboardEvent) => {
    const inlineEditor = this.inlineEditor;
    assertExists(inlineEditor);

    const inlineRange = inlineEditor.getInlineRange();
    if (!inlineRange) return;

    const text = inlineEditor.yTextString.slice(
      inlineRange.index,
      inlineRange.index + inlineRange.length
    );

    e.clipboardData?.setData('text/plain', text);
    e.preventDefault();
    e.stopPropagation();
  };

  private get std() {
    const host = this.view.getContext(HostContextKey);
    return host?.std;
  }

  private _onCut = (e: ClipboardEvent) => {
    const inlineEditor = this.inlineEditor;
    assertExists(inlineEditor);

    const inlineRange = inlineEditor.getInlineRange();
    if (!inlineRange) return;

    const text = inlineEditor.yTextString.slice(
      inlineRange.index,
      inlineRange.index + inlineRange.length
    );
    inlineEditor.deleteText(inlineRange);
    inlineEditor.setInlineRange({
      index: inlineRange.index,
      length: 0,
    });

    e.clipboardData?.setData('text/plain', text);
    e.preventDefault();
    e.stopPropagation();
  };

  private _onPaste = async (e: ClipboardEvent) => {
    const inlineEditor = this.inlineEditor;
    assertExists(inlineEditor);

    const inlineRange = inlineEditor.getInlineRange();
    if (!inlineRange) return;

    const text = e.clipboardData
      ?.getData('text/plain')
      ?.replace(/\r?\n|\r/g, '\n');
    if (!text) return;
    e.preventDefault();
    e.stopPropagation();
    if (isValidUrl(text)) {
      const std = this.std;
      const result = await std?.spec
        .getService('affine:page')
        .quickSearchService?.searchDoc({
          userInput: text,
          skipSelection: true,
        });
      if (result && 'docId' in result) {
        const text = ' ';
        inlineEditor.insertText(inlineRange, text, {
          reference: {
            type: 'LinkedPage',
            pageId: result.docId,
          },
        });
        inlineEditor.setInlineRange({
          index: inlineRange.index + text.length,
          length: 0,
        });
      } else {
        inlineEditor.insertText(inlineRange, text, {
          link: text,
        });
        inlineEditor.setInlineRange({
          index: inlineRange.index + text.length,
          length: 0,
        });
      }
    } else {
      inlineEditor.insertText(inlineRange, text);
      inlineEditor.setInlineRange({
        index: inlineRange.index + text.length,
        length: 0,
      });
    }
  };

  override firstUpdated(props: Map<string, unknown>) {
    super.firstUpdated(props);
    this.disposables.addFromEvent(this.richText, 'copy', this._onCopy);
    this.disposables.addFromEvent(this.richText, 'cut', this._onCut);
    this.disposables.addFromEvent(this.richText, 'paste', e => {
      this._onPaste(e).catch(console.error);
    });
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

  override connectedCallback() {
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
        .enableClipboard=${false}
        .verticalScrollContainerGetter=${() =>
          this.topContenteditableElement?.host
            ? getViewportElement(this.topContenteditableElement.host)
            : null}
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
