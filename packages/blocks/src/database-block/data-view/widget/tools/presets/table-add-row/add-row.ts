import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import type { InsertToPosition } from '../../../../types.js';

import { PlusIcon } from '../../../../../../_common/icons/index.js';
import { startDrag } from '../../../../utils/drag.js';
import { WidgetBase } from '../../../widget-base.js';
import { NewRecordPreview } from './new-record-preview.js';

const styles = css`
  .affine-database-toolbar-item.new-record {
    margin-left: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    width: 120px;
    height: 32px;
    padding: 6px 8px;
    border-radius: 8px;
    font-size: 14px;
    background: var(--affine-white);
    box-shadow: 0px 0px 0px 0.5px rgba(0, 0, 0, 0.1);
    cursor: grab;
  }

  .new-record svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-icon-color);
  }
`;

@customElement('data-view-header-tools-add-row')
export class DataViewHeaderToolsAddRow extends WidgetBase {
  static override styles = styles;

  _dragStart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const container = this.closest('affine-data-view-renderer');
    const tableRect = container
      ?.querySelector('affine-database-table')
      ?.getBoundingClientRect();
    const rows: NodeListOf<HTMLElement> | undefined =
      container?.querySelectorAll('.affine-database-block-row');
    if (!rows || !tableRect) {
      return;
    }
    const rects = Array.from(rows).map(v => {
      const rect = v.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        id: v.dataset.rowId as string,
        left: rect.left,
        mid: (rect.top + rect.bottom) / 2,
        top: rect.top,
        width: rect.width,
      };
    });

    const getPosition = (
      y: number
    ):
      | { position: InsertToPosition; width: number; x: number; y: number }
      | undefined => {
      const data = rects.find(v => y < v.bottom);
      if (!data || y < data.top) {
        return;
      }
      return {
        position: {
          before: y < data.mid,
          id: data.id,
        },
        width: data.width,
        x: data.left,
        y: y < data.mid ? data.top : data.bottom,
      };
    };

    const dropPreview = createDropPreview();
    const dragPreview = createDragPreview();
    startDrag<{ position?: InsertToPosition }, MouseEvent>(e, {
      onClear: () => {
        dropPreview.remove();
        dragPreview.remove();
      },
      onDrag: () => {
        return {};
      },
      onDrop: data => {
        if (data.position) {
          this.viewMethods.addRow?.(data.position);
        }
      },
      onMove: e => {
        dragPreview.display(e.x, e.y);
        const p = getPosition(e.y);
        if (p) {
          dropPreview.display(tableRect.left, p.y, tableRect.width);
        } else {
          dropPreview.remove();
        }
        return {
          position: p?.position,
        };
      },
      transform: e => e,
    });
  };

  private _onAddNewRecord = () => {
    if (this.readonly) return;
    const selection = this.viewMethods.getSelection?.();
    if (!selection) {
      this.addRow('start');
    } else if (selection.type === 'table') {
      const { columnsSelection, focus, rowsSelection } = selection;
      let index = 0;
      if (rowsSelection && !columnsSelection) {
        // rows
        index = rowsSelection.end;
      } else if (rowsSelection && columnsSelection) {
        // multiple cells
        index = rowsSelection.end;
      } else if (!rowsSelection && !columnsSelection && focus) {
        // single cell
        index = focus.rowIndex;
      }

      this.addRow(index + 1);
    }
  };

  addRow = (position: InsertToPosition | number) => {
    this.viewMethods.addRow?.(position);
  };

  private get readonly() {
    return this.view.readonly;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.readonly) {
      this.disposables.addFromEvent(this, 'pointerdown', e => {
        this._dragStart(e);
      });
    }
  }

  override render() {
    if (this.readonly) {
      return;
    }
    return html` <div
      class="affine-database-toolbar-item new-record"
      draggable="true"
      @click="${this._onAddNewRecord}"
    >
      ${PlusIcon}<span>New Record</span>
    </div>`;
  }

  @state()
  accessor showToolBar = false;
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools-add-row': DataViewHeaderToolsAddRow;
  }
}
const createDropPreview = () => {
  const div = document.createElement('div');
  div.dataset.isDropPreview = 'true';
  div.style.pointerEvents = 'none';
  div.style.position = 'fixed';
  div.style.zIndex = '9999';
  div.style.height = '4px';
  div.style.borderRadius = '2px';
  div.style.backgroundColor = 'var(--affine-primary-color)';
  div.style.boxShadow = '0px 0px 8px 0px rgba(30, 150, 235, 0.35)';
  return {
    display(x: number, y: number, width: number) {
      document.body.append(div);
      div.style.left = `${x}px`;
      div.style.top = `${y - 2}px`;
      div.style.width = `${width}px`;
    },
    remove() {
      div.remove();
    },
  };
};

const createDragPreview = () => {
  const preview = new NewRecordPreview();
  document.body.append(preview);
  return {
    display(x: number, y: number) {
      preview.style.left = `${x}px`;
      preview.style.top = `${y}px`;
    },
    remove() {
      preview.remove();
    },
  };
};
