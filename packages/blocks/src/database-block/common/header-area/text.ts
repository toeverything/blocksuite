import { assertExists } from '@blocksuite/global/utils';
import type { InlineRange } from '@blocksuite/inline';
import { InlineEditor } from '@blocksuite/inline';
import type { Y } from '@blocksuite/store';
import { Text, Workspace } from '@blocksuite/store';
import { css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import {
  getCurrentNativeRange,
  hasNativeSelection,
  resetNativeSelection,
} from '../../../_common/utils/index.js';
import type { DatabaseBlockComponent } from '../../database-block.js';
import type { DataViewKanbanManager } from '../../kanban/kanban-view-manager.js';
import { tRichText } from '../../logical/data-type.js';
import type { DataViewTableManager } from '../../table/table-view-manager.js';
import { BaseCellRenderer } from '../columns/base-cell.js';

const TEXT = 'text/plain';

interface StackItem {
  meta: Map<'v-range', InlineRange | null | undefined>;
  type: 'undo' | 'redo';
}

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

export const addHistoryToInlineEditor = (inlineEditor: InlineEditor) => {
  let range: Range | null = null;
  inlineEditor.slots.inlineRangeApply.on(currentRange => {
    range = currentRange;
  });
  const undoManager = new Workspace.Y.UndoManager(inlineEditor.yText, {
    trackedOrigins: new Set([inlineEditor.yText.doc?.clientID]),
  });
  undoManager.on('stack-item-added', (event: { stackItem: StackItem }) => {
    const inlineRange =
      range && inlineEditor.mounted ? inlineEditor.toInlineRange(range) : null;
    event.stackItem.meta.set('v-range', inlineRange);
  });
  undoManager.on('stack-item-popped', (event: { stackItem: StackItem }) => {
    const inlineRange = event.stackItem.meta.get('v-range');
    if (inlineRange) {
      inlineEditor.setInlineRange(inlineRange);
    }
  });
  undoManager.clear();
  return {
    undoManager,
    handleKeyboardEvent: (e: KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent &&
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'z' || e.key === 'Z')
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          if (undoManager.canRedo()) {
            undoManager.redo();
          }
        } else {
          if (undoManager.canUndo()) {
            undoManager.undo();
          }
        }
      }
    },
  };
};

class BaseTextCell extends BaseCellRenderer<unknown> {
  override view!: DataViewTableManager | DataViewKanbanManager;
  static override styles = styles;
  @property({ attribute: false })
  showIcon = false;

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

  protected get isRichText() {
    return tRichText.is(this.titleColumn.dataType);
  }

  inlineEditor?: InlineEditor;
  @query('.data-view-header-area-rich-text')
  richText!: HTMLElement;

  protected initInlineEditor(container: HTMLElement): InlineEditor {
    const yText = this.getYText(
      this.titleColumn.getValue(this.rowId) as Y.Text | string | undefined
    );
    const inlineEditor = new InlineEditor(yText);
    this.inlineEditor = inlineEditor;
    inlineEditor.mount(container, this.topContenteditableElement);
    return inlineEditor;
  }

  protected initEditingMode(inlineEditor: InlineEditor) {
    const historyHelper = addHistoryToInlineEditor(inlineEditor);
    inlineEditor.disposables.addFromEvent(
      inlineEditor.rootElement,
      'keydown',
      e => {
        historyHelper.handleKeyboardEvent(e);
      }
    );
    inlineEditor.focusEnd();
    this._disposables.add(
      inlineEditor.slots.inlineRangeUpdate.on(([range]) => {
        if (range) {
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
  }

  private getYText(text?: string | Y.Text) {
    if (this.isRichText && (text instanceof Workspace.Y.Text || text == null)) {
      let yText = text;
      if (!yText) {
        yText = new Workspace.Y.Text();
        this.titleColumn?.setValue(this.rowId, yText);
      }
      return yText;
    }
    const yText = new Workspace.Y.Doc().getText('title');
    if (text instanceof Workspace.Y.Text) {
      return text;
    }
    yText.insert(0, text ?? '');
    return yText;
  }

  public override onExitEditMode() {
    if (!this.isRichText) {
      this.view.cellUpdateValue(
        this.rowId,
        this.titleColumn.id,
        this.isRichText
          ? this.inlineEditor?.yText
          : this.inlineEditor?.yText.toString()
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
    return html`<div class="data-view-header-area-icon">${icon}</div>`;
  }

  override render() {
    return html` ${this.renderIcon()}
      <div class="data-view-header-area-rich-text"></div>`;
  }
}

@customElement('data-view-header-area-text')
export class HeaderAreaTextCell extends BaseTextCell {
  private init() {
    const editor = this.initInlineEditor(this.richText);
    editor.setReadonly(true);
    this._disposables.add({
      dispose: () => {
        editor.unmount();
      },
    });
  }

  override firstUpdated() {
    this.init();
  }

  public override connectedCallback() {
    super.connectedCallback();
    if (this.richText) {
      this.init();
    }
  }
}

@customElement('data-view-header-area-text-editing')
export class HeaderAreaTextCellEditing extends BaseTextCell {
  private init() {
    const editor = this.initInlineEditor(this.richText);
    this.initEditingMode(editor);
    this._disposables.add({
      dispose: () => {
        editor.unmount();
      },
    });
  }

  override firstUpdated() {
    this.init();
  }

  public override connectedCallback() {
    super.connectedCallback();
    if (this.richText) {
      this.init();
    }
  }

  override onCopy(_e: ClipboardEvent) {
    let data = '';
    const range = this.inlineEditor?.getInlineRange();
    if (range) {
      const start = range.index;
      const end = range.index + range.length;
      const value = this.column.getStringValue(this.rowId);
      data = value?.slice(start, end) ?? '';
    }

    // TODO: replace this dom operation
    const rootEl = document.querySelector('editor-host');
    assertExists(rootEl);
    rootEl.std.clipboard
      .writeToClipboard(async items => {
        return {
          ...items,
          [TEXT]: data,
        };
      })
      .catch(console.error);

    const savedRange = hasNativeSelection() ? getCurrentNativeRange() : null;
    if (savedRange) {
      resetNativeSelection(savedRange);
    }
  }

  override onPaste(e: ClipboardEvent) {
    const textClipboardData = e.clipboardData?.getData(TEXT);
    if (!textClipboardData) return;

    const range = this.inlineEditor?.getInlineRange();
    const yText = this.inlineEditor?.yText;
    if (yText) {
      const text = new Text(yText);
      const index = range?.index ?? yText.length;
      if (range?.length) {
        text.replace(range.index, range.length, textClipboardData);
      } else {
        text.insert(textClipboardData, index);
      }
      this.inlineEditor?.setInlineRange({
        index: index + textClipboardData.length,
        length: 0,
      });
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-area-text': HeaderAreaTextCell;
    'data-view-header-area-text-editing': HeaderAreaTextCellEditing;
  }
}
