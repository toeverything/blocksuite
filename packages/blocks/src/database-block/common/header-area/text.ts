import { assertExists } from '@blocksuite/global/utils';
import type { Y } from '@blocksuite/store';
import { Text, Workspace } from '@blocksuite/store';
import type { VRange } from '@blocksuite/virgo';
import { VEditor } from '@blocksuite/virgo';
import { css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import { affineAttributeRenderer } from '../../../_common/components/rich-text/virgo/attribute-renderer.js';
import { affineTextAttributes } from '../../../_common/components/rich-text/virgo/types.js';
import {
  getCurrentNativeRange,
  hasNativeSelection,
  resetNativeSelection,
} from '../../../_common/utils/index.js';
import { ClipboardItem } from '../../../_legacy/clipboard/clipboard-item.js';
import {
  CLIPBOARD_MIMETYPE,
  performNativeCopy,
} from '../../../_legacy/clipboard/utils/pure.js';
import type { DataViewKanbanManager } from '../../kanban/kanban-view-manager.js';
import { tRichText } from '../../logical/data-type.js';
import type { DataViewTableManager } from '../../table/table-view-manager.js';
import { BaseCellRenderer } from '../columns/base-cell.js';

interface StackItem {
  meta: Map<'v-range', VRange | null | undefined>;
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

export const addHistoryToVEditor = (vEditor: VEditor) => {
  let range: Range | null = null;
  vEditor.slots.rangeUpdated.on(vRange => {
    range = vRange;
  });
  const undoManager = new Workspace.Y.UndoManager(vEditor.yText, {
    trackedOrigins: new Set([vEditor.yText.doc?.clientID]),
  });
  undoManager.on('stack-item-added', (event: { stackItem: StackItem }) => {
    const vRange = range && vEditor.mounted ? vEditor.toVRange(range) : null;
    event.stackItem.meta.set('v-range', vRange);
  });
  undoManager.on('stack-item-popped', (event: { stackItem: StackItem }) => {
    const vRange = event.stackItem.meta.get('v-range');
    if (vRange) {
      vEditor.setVRange(vRange);
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

  get titleColumn() {
    const columnId = this.view.header.titleColumn;
    assertExists(columnId);
    return this.view.columnGet(columnId);
  }

  protected get isRichText() {
    return tRichText.is(this.titleColumn.dataType);
  }

  vEditor?: VEditor;
  @query('.data-view-header-area-rich-text')
  richText!: HTMLElement;

  protected initVirgo(container: HTMLElement): VEditor {
    const yText = this.getYText(
      this.titleColumn.getValue(this.rowId) as Y.Text | string | undefined
    );
    const vEditor = new VEditor(yText);
    this.vEditor = vEditor;
    vEditor.setAttributeSchema(affineTextAttributes);
    vEditor.setAttributeRenderer(affineAttributeRenderer);
    vEditor.mount(container);
    return vEditor;
  }

  protected initEditingMode(vEditor: VEditor) {
    const historyHelper = addHistoryToVEditor(vEditor);
    vEditor.disposables.addFromEvent(vEditor.rootElement, 'keydown', e => {
      historyHelper.handleKeyboardEvent(e);
    });
    vEditor.focusEnd();
    this._disposables.add(
      vEditor.slots.vRangeUpdated.on(([range]) => {
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
        this.isRichText ? this.vEditor?.yText : this.vEditor?.yText.toString()
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
      <div class="data-view-header-area-rich-text"></div>`;
  }
}

@customElement('data-view-header-area-text')
export class HeaderAreaTextCell extends BaseTextCell {
  private init() {
    const editor = this.initVirgo(this.richText);
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
    const editor = this.initVirgo(this.richText);
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
      if (range?.length) {
        text.replace(range.index, range.length, textClipboardData);
      } else {
        text.insert(textClipboardData, index);
      }
      this.vEditor?.setVRange({
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
