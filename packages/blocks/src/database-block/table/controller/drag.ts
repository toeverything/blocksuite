// related component

import type { ReactiveController } from 'lit';

import type { InsertPosition } from '../../types.js';
import { startDrag } from '../../utils/drag.js';
import { TableRow } from '../components/row.js';
import type { DataViewTable } from '../table-view.js';

export class TableDragController implements ReactiveController {
  constructor(private host: DataViewTable) {
    this.host.addController(this);
  }

  dropPreview = createDropPreview();

  getInsertPosition = (
    evt: MouseEvent
  ):
    | { position: InsertPosition; y: number; width: number; x: number }
    | undefined => {
    const y = evt.y;
    const tableRect = this.host.getBoundingClientRect();
    const rows = this.host.querySelectorAll('.affine-database-block-row');
    if (!rows || !tableRect || y < tableRect.top) {
      return;
    }
    for (let i = 0; i < rows.length; i++) {
      const row = rows.item(i);
      const rect = row.getBoundingClientRect();
      const mid = (rect.top + rect.bottom) / 2;
      if (y < rect.bottom) {
        return {
          position: {
            id: row.getAttribute('data-row-id') as string,
            before: y < mid,
          },
          y: y < mid ? rect.top : rect.bottom,
          width: tableRect.width,
          x: rect.left,
        };
      }
    }
    return;
  };
  showIndicator = (evt: MouseEvent) => {
    const position = this.getInsertPosition(evt);
    if (position) {
      this.dropPreview.display(position.x, position.y, position.width);
    } else {
      this.dropPreview.remove();
    }
    return position;
  };

  hostConnected() {
    if (this.host.view.readonly) {
      return;
    }
    this.host.disposables.add(
      this.host.handleEvent('dragStart', context => {
        const event = context.get('pointerState').raw;
        const target = event.target;
        if (
          target instanceof Element &&
          this.host.contains(target) &&
          target.closest('.data-view-table-view-drag-handler')
        ) {
          event.preventDefault();
          const row = target.closest('data-view-table-row');
          if (row) {
            getSelection()?.removeAllRanges();
            this.dragStart(row, event);
          }
          return true;
        }
        return false;
      })
    );
  }

  dragStart = (row: TableRow, evt: PointerEvent) => {
    const eleRect = row.getBoundingClientRect();
    const offsetLeft = evt.x - eleRect.left;
    const offsetTop = evt.y - eleRect.top;
    const preview = createDragPreview(
      row,
      evt.x - offsetLeft,
      evt.y - offsetTop
    );
    startDrag<
      | undefined
      | {
          type: 'self';
          position: InsertPosition;
        }
      | { type: 'out'; callback: () => void },
      PointerEvent
    >(evt, {
      onDrag: () => undefined,
      onMove: evt => {
        preview.display(evt.x - offsetLeft, evt.y - offsetTop);
        if (!this.host.contains(evt.target as Node)) {
          const callback = this.host.onDrag;
          if (callback) {
            this.dropPreview.remove();
            return {
              type: 'out',
              callback: callback(evt, row.rowId),
            };
          }
          return;
        }
        const result = this.showIndicator(evt);
        if (result) {
          return {
            type: 'self',
            position: result.position,
          };
        }
        return;
      },
      onClear: () => {
        preview.remove();
        this.dropPreview.remove();
      },
      onDrop: result => {
        if (!result) {
          return;
        }
        if (result.type === 'out') {
          result.callback();
          return;
        }
        if (result.type === 'self') {
          this.host.view.rowMove(row.rowId, result.position);
        }
      },
    });
  };
}

const createDragPreview = (row: TableRow, x: number, y: number) => {
  const div = document.createElement('div');
  const cloneRow = new TableRow();
  cloneRow.view = row.view;
  cloneRow.rowIndex = row.rowIndex;
  cloneRow.rowId = row.rowId;
  div.append(cloneRow);
  div.style.width = `${row.getBoundingClientRect().width}px`;
  div.style.position = 'fixed';
  div.style.pointerEvents = 'none';
  div.style.backgroundColor = 'var(--affine-background-primary-color)';
  div.style.boxShadow = 'var(--affine-shadow-2)';
  div.style.left = `${x}px`;
  div.style.top = `${y}px`;
  div.style.zIndex = '9999';
  document.body.append(div);
  return {
    display(x: number, y: number) {
      div.style.left = `${Math.round(x)}px`;
      div.style.top = `${Math.round(y)}px`;
    },
    remove() {
      div.remove();
    },
  };
};
const createDropPreview = () => {
  const div = document.createElement('div');
  div.setAttribute('data-is-drop-preview', 'true');
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
