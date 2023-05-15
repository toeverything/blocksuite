import { assertExists } from '@blocksuite/store';

const DATABASE_ROW_SELECTED_CLASS = 'selected';

export function getSelectedRowIds(
  startCell: HTMLElement,
  endCell: HTMLElement
): number[] {
  const currentRowId = getClosestRowId(startCell);
  const startRowId = getClosestRowId(endCell);

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
    clearDatabaseRowsSelection(database);
  });
}

export function setDatabaseRowsSelection(
  database: HTMLElement,
  rowIds: number[]
) {
  clearDatabaseRowsSelection(database);

  rowIds.forEach(rowId => {
    const row = database.querySelector(`.database-row[data-row-id="${rowId}"]`);
    row?.classList.add(DATABASE_ROW_SELECTED_CLASS);
  });
}

function clearDatabaseRowsSelection(database: HTMLElement) {
  const allRows = database.querySelectorAll<HTMLElement>('.database-row');
  allRows.forEach(row => {
    row.classList.remove(DATABASE_ROW_SELECTED_CLASS);
  });
}

function getClosestRowId(element: Element): number {
  const rowId = element.closest('.database-row')?.getAttribute('data-row-id');
  assertExists(rowId);
  return Number(rowId);
}
