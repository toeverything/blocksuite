import { CellLevelSelection, getRowsContainer } from './cell-selection.js';
import { RowLevelSelection } from './row-selection.js';

export function setDatabaseCellSelection(
  databaseId: string,
  cell: Element,
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
