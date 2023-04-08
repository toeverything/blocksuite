import type { DatabaseBlockModel } from '@blocksuite/blocks/models';
import { Point } from '@blocksuite/blocks/std';
import { DisposableGroup } from '@blocksuite/global/utils';
import { assertExists } from '@blocksuite/global/utils';

import { ColumnDragIndicator } from './column-drag-indicator.js';
import { ColumnDragPreview } from './column-drag-preview.js';

export type ColumnDragConfig = {
  dragIndex: number;
  targetIndex: number;
  indicatorHeight: number;
  headerColumns: HTMLElement[];
  previewBoundaries: {
    left: number;
    right: number;
  };
};

export function initMoveColumnHandlers(
  headerContainer: HTMLElement,
  tableContainer: HTMLElement,
  targetModel: DatabaseBlockModel
) {
  let dragPreview: ColumnDragPreview | null = null;
  let dragColumnConfig: ColumnDragConfig | null = null;
  let indicator = document.querySelector<ColumnDragIndicator>(
    'affine-database-column-drag-indicator'
  );
  if (!indicator) {
    indicator = new ColumnDragIndicator();
    document.body.appendChild(indicator);
  }

  const onColumnDragStart = (event: DragEvent) => {
    event.stopPropagation();
    assertExists(event.dataTransfer);
    event.dataTransfer.effectAllowed = 'move';

    const headerColumns = Array.from<HTMLElement>(
      headerContainer.querySelectorAll('.affine-database-column')
    ).filter(column => !column.classList.contains('add-column-button'));

    const dragIcon = event.target as HTMLElement;
    const dragHeaderColumn = dragIcon.closest<HTMLElement>(
      '.affine-database-column'
    );
    assertExists(dragHeaderColumn);
    const dragIndex = headerColumns.indexOf(dragHeaderColumn) - 1;

    const database = tableContainer.closest('affine-database');
    assertExists(database);
    const { left, right } = database.getBoundingClientRect();

    dragColumnConfig = {
      dragIndex,
      headerColumns,
      targetIndex: -1,
      indicatorHeight: tableContainer.clientHeight,
      previewBoundaries: {
        left,
        right,
      },
    };

    dragPreview = createDragPreview(event);
    tableContainer.appendChild(dragPreview);
  };

  const onColumnDrag = (event: DragEvent) => {
    if (!dragColumnConfig) return;

    assertExists(dragPreview);
    if (dragPreview.style.opacity !== '1') {
      dragPreview.style.opacity = '1';
    }
    const x = event.clientX;
    const y = event.clientY;

    const { x: offsetX, y: offsetY } = dragPreview.offset;
    dragPreview.style.transform = `translate(${x + offsetX}px, ${
      y + offsetY
    }px)`;

    const { dragIndex, previewBoundaries, indicatorHeight, headerColumns } =
      dragColumnConfig;
    const point = new Point(x, y);
    const { element, index: targetIndex } = getClosestElement(
      point,
      headerColumns
    );
    const elementRect = element.getBoundingClientRect();

    const outOfBoundaries =
      elementRect.right < previewBoundaries.left ||
      elementRect.right > previewBoundaries.right;

    // both side of drag element should hide the indicator
    const rect =
      dragIndex === targetIndex ||
      dragIndex === targetIndex - 1 ||
      outOfBoundaries
        ? null
        : new DOMRect(elementRect.right, elementRect.top, 1, indicatorHeight);

    assertExists(indicator);
    indicator.targetRect = rect;
    dragColumnConfig.targetIndex = targetIndex - 1;
  };

  const onColumnDragEnd = (event: DragEvent) => {
    if (!dragColumnConfig) return;

    const { dragIndex: fromIndex, targetIndex } = dragColumnConfig;

    // clear data
    dragColumnConfig = null;
    if (indicator) indicator.targetRect = null;
    if (dragPreview) {
      dragPreview.remove();
      dragPreview = null;
    }

    const toIndex = targetIndex + 1;
    if (
      // self
      fromIndex === toIndex - 1 ||
      // same position
      fromIndex === toIndex
    ) {
      return;
    }

    targetModel.page.captureSync();
    const columns = [...targetModel.columns];
    // move column
    const column = columns[fromIndex];
    columns.splice(fromIndex, 1);
    columns.splice(toIndex, 0, column);

    targetModel.page.updateBlock(targetModel, {
      columns,
    });
  };

  const disposables = new DisposableGroup();
  const stopPropagation = (e: Event) => e.stopPropagation();
  const columnMoveElements = headerContainer.querySelectorAll<HTMLDivElement>(
    '.affine-database-column-move'
  );
  columnMoveElements.forEach(moveElement => {
    // prevent block selection and drag-handle
    disposables.addFromEvent(moveElement, 'mousedown', stopPropagation);
    disposables.addFromEvent(moveElement, 'mousemove', stopPropagation);
    disposables.addFromEvent(moveElement, 'mouseup', stopPropagation);
    disposables.addFromEvent(moveElement, 'click', stopPropagation);

    // init drag event
    disposables.addFromEvent(moveElement, 'dragstart', onColumnDragStart);
    disposables.addFromEvent(moveElement, 'drag', onColumnDrag);
    disposables.addFromEvent(moveElement, 'dragend', onColumnDragEnd);
  });
  return disposables;
}

function createDragPreview(event: DragEvent) {
  const dragPreview = new ColumnDragPreview();
  dragPreview.style.opacity = '0';

  const previewFragment = document.createDocumentFragment();
  // header
  const dragIcon = event.target as HTMLElement;
  const headerColumn = dragIcon.closest<HTMLElement>('.affine-database-column');
  assertExists(headerColumn);
  const headerColumnClone = headerColumn.cloneNode(true) as HTMLElement;
  headerColumnClone.classList.add('preview-column-header');
  previewFragment.appendChild(headerColumnClone);

  // content
  const previewContent = document.createElement('div');
  previewContent.classList.add('preview-column-content');
  previewFragment.appendChild(previewContent);

  dragPreview.appendChild(previewFragment);

  event.dataTransfer?.setDragImage(dragPreview, 0, 0);

  return dragPreview;
}

function getClosestElement(
  point: Point,
  headerColumns: HTMLElement[]
): {
  element: HTMLElement;
  index: number;
} {
  let element: HTMLElement | null = null;
  let index = -1;
  const length = headerColumns.length;

  for (let i = 0; i < length; i++) {
    const column = headerColumns[i];
    const rect = column.getBoundingClientRect();
    if (point.x >= rect.left && point.x <= rect.right) {
      element = column;
      index = i;
      break;
    }
  }

  // boundary check
  if (!element) {
    const firstColumnRect = headerColumns[0].getBoundingClientRect();
    if (point.x <= firstColumnRect.left) {
      // left boundary
      element = headerColumns[0];
      index = 0;
    } else {
      // right boundary
      element = headerColumns[length - 1];
      index = length - 1;
    }
  }
  return {
    element,
    index,
  };
}
