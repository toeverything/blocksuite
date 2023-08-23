import { assertExists } from '@blocksuite/global/utils';
import type { VRange } from '@blocksuite/virgo';
import { VEditor } from '@blocksuite/virgo';
import { css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';
import * as Y from 'yjs';
import { Doc, Text as YText } from 'yjs';

import { REFERENCE_NODE } from '../../../__internal__/rich-text/consts.js';
import { attributeRenderer } from '../../../__internal__/rich-text/virgo/attribute-renderer.js';
import {
  affineTextAttributes,
  type AffineVEditor,
} from '../../../__internal__/rich-text/virgo/types.js';
import type { DataViewKanbanManager } from '../../kanban/kanban-view-manager.js';
import { tRichText } from '../../logical/data-type.js';
import type { DataViewTableManager } from '../../table/table-view-manager.js';
import { BaseCellRenderer } from '../columns/base-cell.js';
import { createFromBaseCellRenderer } from '../columns/renderer.js';

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

const autoIdentifyReference = (editor: AffineVEditor, text: string) => {
  // @AffineReference:(id)
  const referencePattern = /@AffineReference:\((.*)\)/g;

  const match = referencePattern.exec(text);
  if (!match) {
    return;
  }

  const pageId = match[1];

  editor.deleteText({
    index: 0,
    length: match[0].length,
  });
  editor.setVRange({
    index: 0,
    length: 0,
  });

  const vRange = {
    index: match[0].length,
    length: 0,
  };

  editor.insertText(vRange, REFERENCE_NODE, {
    reference: { type: 'Subpage', pageId },
  });
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
  undoManager?: Y.UndoManager;
  @query('.data-view-header-area-rich-text')
  richText!: HTMLElement;

  protected initVirgo(): VEditor {
    const yText = this.getYText(
      this.titleColumn.getValue(this.rowId) as YText | string | undefined
    );
    this.vEditor = new VEditor(yText);
    this.vEditor.setAttributeSchema(affineTextAttributes);
    this.vEditor.setAttributeRenderer(attributeRenderer());
    autoIdentifyReference(this.vEditor, yText.toString());
    this.vEditor.mount(this.richText);
    this.vEditor.bindHandlers({
      keydown: e => {
        if (
          e instanceof KeyboardEvent &&
          (e.ctrlKey || e.metaKey) &&
          (e.key === 'z' || e.key === 'Z')
        ) {
          e.preventDefault();
          if (e.shiftKey) {
            this.undoManager?.redo();
          } else {
            this.undoManager?.undo();
          }
        }
      },
    });

    this.undoManager = new Y.UndoManager(yText, {
      trackedOrigins: new Set([yText.doc?.clientID]),
    });
    this.undoManager.on(
      'stack-item-added',
      (event: { stackItem: StackItem }) => {
        const vRange = this.vEditor?.getVRange();
        event.stackItem.meta.set('v-range', vRange);
      }
    );
    this.undoManager.on(
      'stack-item-popped',
      (event: { stackItem: StackItem }) => {
        const vRange = event.stackItem.meta.get('v-range');
        if (vRange) {
          this.vEditor?.setVRange(vRange);
        }
      }
    );
    return this.vEditor;
  }

  private getYText(text?: string | YText) {
    if (this.isRichText && (text instanceof YText || text == null)) {
      let yText = text;
      if (!yText) {
        yText = new YText();
        this.titleColumn?.setValue(this.rowId, yText);
      }
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
        } else {
          if (this.isEditing) {
            this.selectCurrentCell(false);
          }
        }
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-area-text': HeaderAreaTextCell;
    'data-view-header-area-text-editing': HeaderAreaTextCellEditing;
  }
}

export const textRenderer = {
  view: createFromBaseCellRenderer(HeaderAreaTextCell),
  edit: createFromBaseCellRenderer(HeaderAreaTextCellEditing),
};
