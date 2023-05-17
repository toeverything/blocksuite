import { assertExists } from '@blocksuite/store';

import { RowLevelSelection } from '../../../../database-block/table/components/selection.js';

export function getClosestRowId(element: Element): number {
  const rowId = element.closest('.database-row')?.getAttribute('data-row-id');
  if (rowId) {
    return Number(rowId);
  }
  // Header row has no id.
  return -1;
}

export function getSelectedRowIds(
  startCell: Element,
  endCell: Element
): number[] {
  const currentRowId = getClosestRowId(startCell);
  const startRowId = getClosestRowId(endCell);
  if (currentRowId === -1 || startRowId === -1) return [];

  const minId = Math.min(currentRowId, startRowId);
  const maxId = Math.max(currentRowId, startRowId);
  const rowIds = [];
  for (let id = minId; id <= maxId; id++) {
    rowIds.push(id);
  }

  return rowIds;
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
  database: HTMLElement,
  rowIds: number[]
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

  const databaseId = database.getAttribute('data-block-id');
  assertExists(databaseId);
  rowLevelSelection.container = container;
  rowLevelSelection.setSelection({
    databaseId,
    rowIds,
  });
}
