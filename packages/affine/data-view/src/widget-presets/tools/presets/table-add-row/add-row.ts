import type { InsertToPosition } from '@blocksuite/affine-shared/utils';

import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { IS_MOBILE } from '@blocksuite/global/env';
import { PlusIcon } from '@blocksuite/icons/lit';
import { css, html } from 'lit';
import { state } from 'lit/decorators.js';

import { startDrag } from '../../../../core/utils/drag.js';
import { WidgetBase } from '../../../../core/widget/widget-base.js';
import { NewRecordPreview } from './new-record-preview.js';

const styles = css`
  .new-record {
    cursor: grab;
    font-weight: 500;
  }

  .new-record svg {
    font-size: 20px;
    color: ${unsafeCSSVarV2('icon/primary')};
  }
`;

export class DataViewHeaderToolsAddRow extends WidgetBase {
  static override styles = styles;

  private _onAddNewRecord = () => {
    if (this.readonly) return;
    const selection = this.viewMethods.getSelection?.();
    if (!selection) {
      this.addRow('start');
    } else if (
      selection.type === 'table' &&
      selection.selectionType === 'area'
    ) {
      const { rowsSelection, columnsSelection, focus } = selection;
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
        id: v.dataset.rowId as string,
        top: rect.top,
        bottom: rect.bottom,
        mid: (rect.top + rect.bottom) / 2,
        width: rect.width,
        left: rect.left,
      };
    });

    const getPosition = (
      y: number
    ):
      | {
          position: InsertToPosition;
          y: number;
          x: number;
          width: number;
        }
      | undefined => {
      const data = rects.find(v => y < v.bottom);
      if (!data || y < data.top) {
        return;
      }
      return {
        position: {
          id: data.id,
          before: y < data.mid,
        },
        y: y < data.mid ? data.top : data.bottom,
        width: data.width,
        x: data.left,
      };
    };

    const dropPreview = createDropPreview();
    const dragPreview = createDragPreview();
    startDrag<
      {
        position?: InsertToPosition;
      },
      MouseEvent
    >(e, {
      transform: e => e,
      onDrag: () => {
        return {};
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
      onDrop: data => {
        if (data.position) {
          this.viewMethods.addRow?.(data.position);
        }
      },
      onClear: () => {
        dropPreview.remove();
        dragPreview.remove();
      },
    });
  };

  addRow = (position: InsertToPosition | number) => {
    this.viewMethods.addRow?.(position);
  };

  private get readonly() {
    return this.view.readonly$.value;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.readonly && !IS_MOBILE) {
      this.disposables.addFromEvent(this, 'pointerdown', e => {
        this._dragStart(e);
      });
    }
  }

  override render() {
    if (this.readonly) {
      return;
    }
    return html` <data-view-component-button
      class="affine-database-toolbar-item new-record"
      draggable="true"
      .onClick="${this._onAddNewRecord}"
      .icon="${PlusIcon()}"
      .text="${IS_MOBILE
        ? html`<span style="font-weight: 500">New</span>`
        : html`<span style="font-weight: 500">New Record</span>`}"
    >
    </data-view-component-button>`;
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
