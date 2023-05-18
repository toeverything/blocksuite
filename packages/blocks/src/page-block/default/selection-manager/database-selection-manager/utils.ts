import { assertExists } from '@blocksuite/store';

import { RowLevelSelection } from '../../../../database-block/table/components/selection.js';

export function getClosestRowIndex(element: Element): number {
  const rowIndex = element
    .closest('.database-row')
    ?.getAttribute('data-row-index');
  if (rowIndex) {
    return Number(rowIndex);
  }
  // Header row has no index.
  return -1;
}

export function getClosestRowId(element: Element): string {
  const rowId = element.closest('.database-row')?.getAttribute('data-row-id');
  if (rowId) {
    return rowId;
  }
  // Header row has no id.
  return '';
}

export function getSelectedRowIdsByIndexes(
  database: Element,
  indexes: number[]
) {
  return indexes.map(item => getRowIdByIndex(database, item));
}

export function getSelectedRowIndexes(
  startCell: Element,
  endCell: Element
): number[] {
  const currentRowIndex = getClosestRowIndex(startCell);
  const startRowIndex = getClosestRowIndex(endCell);
  if (currentRowIndex === -1 || startRowIndex === -1) return [];

  const minIndex = Math.min(currentRowIndex, startRowIndex);
  const maxIndex = Math.max(currentRowIndex, startRowIndex);
  const rowIndexes = [];
  for (let id = minIndex; id <= maxIndex; id++) {
    rowIndexes.push(id);
  }

  return rowIndexes;
}

export function getClosestDatabase(element: Element | null) {
  const database = element?.closest('affine-database');
  assertExists(database);
  return database;
}

export function getClosestDatabaseId(element: Element) {
  const databaseId = getClosestDatabase(element).getAttribute('data-block-id');
  assertExists(databaseId);
  return databaseId;
}

export function getDatabaseById(id: string) {
  const database = document.querySelector<HTMLElement>(
    `affine-database[data-block-id="${id}"]`
  );
  assertExists(database);
  return database;
}

export function clearAllDatabaseRowsSelection() {
  const databases = document.querySelectorAll('affine-database');
  databases.forEach(database => {
    const rowLevelSelection = database.querySelector(
      'database-row-level-selection'
    );
    if (rowLevelSelection) {
      const databaseId = database.getAttribute('data-block-id');
      assertExists(databaseId);
      rowLevelSelection.clearSelection();
    }
  });
}

export function setDatabaseRowsSelection(
  databaseId: string,
  database: HTMLElement,
  rowIds: string[]
) {
  const container = database.querySelector<HTMLElement>(
    '.affine-database-table-container'
  );
  assertExists(container);

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

function getRowIdByIndex(database: Element, index: number) {
  const rowId = database
    .querySelector(`.database-row[data-row-index="${index}"]`)
    ?.getAttribute('data-row-id');
  assertExists(rowId);
  return rowId;
}
