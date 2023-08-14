import { ShadowlessElement } from '@blocksuite/lit';
import { assertExists, DisposableGroup } from '@blocksuite/store';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { Point, Rect } from '../../../../__internal__/utils/rect.js';
import type { DragIndicator } from '../../../../components/drag-indicator.js';
import { PlusIcon } from '../../../../icons/index.js';
import type { InsertPosition } from '../../../types.js';

@customElement('affine-database-new-record-preview')
class NewRecordPreview extends ShadowlessElement {
  @property({ attribute: false })
  offset = {
    x: 0,
    y: 0,
  };

  override render() {
    return html`
      <style>
        affine-database-new-record-preview {
          display: flex;
          align-items: center;
          justify-content: center;
          position: fixed;
          top: 0;
          left: 0;
          height: 32px;
          width: 32px;
          border: 1px solid var(--affine-border-color);
          border-radius: 50%;
          background: var(--affine-blue-100);
          box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.05),
            0px 0px 0px 0.5px var(--affine-black-10);
          cursor: none;
          user-select: none;
          pointer-events: none;
          caret-color: transparent;
          z-index: 100;
        }

        affine-database-new-record-preview svg {
          width: 16px;
          height: 16px;
        }

        affine-database-new-record-preview path {
          fill: var(--affine-brand-color);
        }
      </style>
      ${PlusIcon}
    `;
  }
}

type ColumnConfig = {
  position?: InsertPosition;
  rows: HTMLElement[];
};

export function initAddNewRecordHandlers(
  element: HTMLElement,
  container: HTMLElement,
  addRow: (position: InsertPosition) => void
) {
  let dragConfig: ColumnConfig | null = null;
  let dragPreview: NewRecordPreview | null = null;
  const database = container.closest('affine-database');
  if (!database) return;

  const rowContainer = database.querySelector<HTMLElement>(
    '.affine-database-block-rows'
  );
  if (!rowContainer) {
    return;
  }

  const indicator = document.querySelector<DragIndicator>(
    'affine-drag-indicator'
  );
  if (!indicator) {
    const indicator = <DragIndicator>(
      document.createElement('affine-drag-indicator')
    );
    document.body.appendChild(indicator);
  }

  const onDragStart = (event: DragEvent) => {
    event.stopPropagation();
    assertExists(event.dataTransfer);
    event.dataTransfer.effectAllowed = 'move';

    dragPreview = new NewRecordPreview();
    dragPreview.style.opacity = '0';
    event.dataTransfer?.setDragImage(dragPreview, 0, 0);
    container.appendChild(dragPreview);

    const rows = Array.from(
      rowContainer.querySelectorAll<HTMLElement>('.affine-database-block-row')
    );
    dragConfig = {
      rows,
    };
  };

  const onDrag = (event: DragEvent) => {
    if (!dragConfig) return;
    if (!dragPreview) return;

    if (dragPreview.style.opacity !== '1') {
      dragPreview.style.opacity = '1';
    }
    const x = event.clientX;
    const y = event.clientY;

    dragPreview.style.transform = `translate(${x}px, ${y}px)`;

    const point = new Point(x, y);
    const row = getClosestRow(point, dragConfig.rows);
    assertExists(indicator);

    if (row) {
      const { top, bottom } = row.element.getBoundingClientRect();
      const rectTop = row.isLast ? bottom : top;
      const { width: databaseWidth, left: databaseLeft } =
        database.getBoundingClientRect();
      indicator.rect = Rect.fromLWTH(databaseLeft, databaseWidth, rectTop, 3);
      dragConfig.position = row.position;
    } else {
      indicator.rect = null;
      dragConfig.position = undefined;
    }
  };

  const onDragEnd = () => {
    if (!dragConfig) return;
    const { position } = dragConfig;
    // clear data
    dragConfig = null;
    if (indicator) indicator.rect = null;
    if (dragPreview) {
      dragPreview.remove();
      dragPreview = null;
    }
    if (position) {
      addRow(position);
    }
  };

  const disposables = new DisposableGroup();
  const stopPropagation = (e: Event) => {
    e.stopPropagation();
  };
  disposables.addFromEvent(element, 'pointerdown', stopPropagation);
  disposables.addFromEvent(element, 'pointermove', stopPropagation);
  disposables.addFromEvent(element, 'pointerup', stopPropagation);

  disposables.addFromEvent(element, 'dragstart', onDragStart);
  disposables.addFromEvent(element, 'drag', onDrag);
  disposables.addFromEvent(element, 'dragend', onDragEnd);
  return disposables;
}

function getClosestRow(
  point: Point,
  rows: HTMLElement[]
): {
  element: HTMLElement;
  position: InsertPosition;
  isLast: boolean;
} | null {
  const length = rows.length;

  for (let i = 0; i < length; i++) {
    const row = rows[i];
    const { top, bottom } = row.getBoundingClientRect();
    if (point.y <= top + 20 && point.y >= top - 20) {
      return {
        element: row,
        position: {
          id: row.dataset.rowId ?? '',
          before: true,
        },
        isLast: false,
      };
    }

    // last row
    if (i === length - 1) {
      if (point.y >= bottom - 20 && point.y <= bottom + 20) {
        return {
          element: row,
          position: {
            id: row.dataset.rowId ?? '',
            before: false,
          },
          isLast: true,
        };
      }
    }
  }

  return null;
}
