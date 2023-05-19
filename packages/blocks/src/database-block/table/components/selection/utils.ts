import { assertExists } from '@blocksuite/store';

import type { RichText } from '../../../../__internal__/rich-text/rich-text.js';
import { CellLevelSelection, getRowsContainer } from './cell-selection.js';
import { RowLevelSelection } from './row-selection.js';

export function setDatabaseCellSelection(
  databaseId: string,
  cell: HTMLElement,
  key: string
) {
  const container = getRowsContainer(databaseId);
  const cellLevelSelection = getCellLevelSelection(container);
  cellLevelSelection.cell = cell;
  cellLevelSelection.setSelection({
    databaseId,
    key,
  });
}

export function clearAllDatabaseCellSelection() {
  const databases = document.querySelectorAll('affine-database');
  databases.forEach(database => {
    const cellLevelSelection = database.querySelector(
      'database-cell-level-selection'
    );
    cellLevelSelection?.clearSelection();
  });
}

export function setDatabaseCellEditing(databaseId: string) {
  const currentCell = clearDatabaseCellSelectionByDatabaseId(databaseId);
  const columnTypeCell = currentCell?.firstElementChild
    ?.firstElementChild as HTMLElement;
  assertExists(columnTypeCell);

  const richText = currentCell?.querySelector('rich-text');

  // number or rich-text column
  if ('vEditor' in columnTypeCell) {
    const richTextCell = columnTypeCell as RichText;
    richTextCell.vEditor?.focusEnd();
  } else if (richText) {
    // title column
    richText.vEditor?.focusEnd();
  } else {
    columnTypeCell.click();
  }
}

export function clearAllDatabaseRowsSelection() {
  const databases = document.querySelectorAll('affine-database');
  databases.forEach(database => {
    const rowLevelSelection = database.querySelector(
      'database-row-level-selection'
    );
    rowLevelSelection?.clearSelection();
  });
}

export function setDatabaseRowsSelection(databaseId: string, rowIds: string[]) {
  const container = getRowsContainer(databaseId);

  let rowLevelSelection = container.querySelector(
    'database-row-level-selection'
  );
  if (!rowLevelSelection) {
    rowLevelSelection = new RowLevelSelection();
    container.appendChild(rowLevelSelection);
  }

  rowLevelSelection.container = container;
  rowLevelSelection.setSelection({
    databaseId,
    rowIds,
  });
}

function getCellLevelSelection(container: Element) {
  let cellLevelSelection = container.querySelector(
    'database-cell-level-selection'
  );
  if (!cellLevelSelection) {
    cellLevelSelection = new CellLevelSelection();
    container.appendChild(cellLevelSelection);
  }

  return cellLevelSelection;
}

function clearDatabaseCellSelectionByDatabaseId(databaseId: string) {
  const container = getRowsContainer(databaseId);
  const cellLevelSelection = container.querySelector(
    'database-cell-level-selection'
  );
  const currentCell = cellLevelSelection?.getCurrentSelectedCell();
  cellLevelSelection?.clearSelection();
  return currentCell;
}
