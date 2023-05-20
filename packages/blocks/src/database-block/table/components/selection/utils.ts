import { assertExists } from '@blocksuite/store';

import type { RichText } from '../../../../__internal__/rich-text/rich-text.js';
import type { CellCoord } from '../../../../std.js';
import { CellLevelSelection } from './cell-selection.js';
import { RowLevelSelection } from './row-selection.js';

type CellRects = {
  left: number;
  top: number;
  height: number;
  width: number;
  cell: HTMLElement;
}[][];

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

export function setDatabaseCellSelection(
  databaseId: string,
  coords: [CellCoord, CellCoord?]
) {
  const container = getRowsContainer(databaseId);
  const cellLevelSelection = getCellLevelSelection(container);
  cellLevelSelection.setSelection({
    databaseId,
    coords,
  });

  const currentCell = getCellElementByCoord(coords[0], databaseId);
  currentCell.scrollIntoView();
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

export function setDatabaseCellEditing(databaseId: string, coord: CellCoord) {
  clearDatabaseCellSelectionByDatabaseId(databaseId);
  const currentCell = getCellElementByCoord(coord, databaseId);
  const columnTypeCell = currentCell.firstElementChild
    ?.firstElementChild as HTMLElement;
  assertExists(columnTypeCell);
  const richText = columnTypeCell?.querySelector('rich-text');

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

export function getCellCoord(
  target: CellCoord | HTMLElement,
  databaseId: string,
  key: string
) {
  const rowsContainer = getRowsContainer(databaseId);
  const cellRects = getAllCellsRect(rowsContainer);

  const rowsCount = cellRects.length;
  const columnsCount = cellRects[0].length;
  let cellCoord: CellCoord | null = null;
  if (target instanceof Element) {
    cellCoord = getCellCoordByElement(target, databaseId);
    assertExists(cellCoord);
  } else {
    cellCoord = target;
  }

  const nextCellCoord = getNextCellCoord(
    key,
    cellCoord,
    rowsCount,
    columnsCount
  );
  return nextCellCoord;
}

export function getCellSelectionRectByCoords(
  coords: [CellCoord, CellCoord?],
  databaseId: string
) {
  const rowsContainer = getRowsContainer(databaseId);
  const cellRects = getAllCellsRect(rowsContainer);

  // Currently only supports single cell selection.
  const [start] = coords;
  const cell = cellRects[start.rowIndex][start.cellIndex];
  return {
    left: cell.left,
    top: cell.top,
    width: cell.width,
    height: cell.height,
  };
}

export function getRowsContainer(databaseId: string) {
  const database = getDatabaseById(databaseId);
  const container = database.querySelector<HTMLElement>(
    '.affine-database-table-container'
  );
  assertExists(container);
  return container;
}

function getCellCoordByElement(cell: HTMLElement, databaseId: string) {
  const rowsContainer = getRowsContainer(databaseId);
  const cellRects = getAllCellsRect(rowsContainer);
  for (let i = 0; i < cellRects.length; i++) {
    const row = cellRects[i];
    for (let j = 0; j < row.length; j++) {
      if (row[j].cell === cell) {
        return {
          rowIndex: i,
          cellIndex: j,
        };
      }
    }
  }
  return null;
}

function getCellElementByCoord(coord: CellCoord, databaseId: string) {
  const rowsContainer = getRowsContainer(databaseId);
  const cellRects = getAllCellsRect(rowsContainer);
  const { rowIndex, cellIndex } = coord;
  const cell = cellRects[rowIndex][cellIndex].cell;
  return cell;
}

function getAllCellsRect(rowsContainer: Element) {
  // [ [{ left, top, height, cell }] ]
  const cellRects: CellRects = [];
  const allRows = rowsContainer.querySelectorAll('.affine-database-block-row');
  allRows.forEach((row, rowIndex) => {
    const allCells = row.querySelectorAll<HTMLElement>('.database-cell');
    allCells.forEach((cell, cellIndex) => {
      // skip the last cell which is "+"
      if (cell.classList.contains('add-column-button')) return;
      const { left, top, height, width } = cell.getBoundingClientRect();
      cellRects[rowIndex] = cellRects[rowIndex] ?? [];
      cellRects[rowIndex][cellIndex] = { left, top, height, width, cell };
    });
  });

  return cellRects;
}

function getNextCellCoord(
  key: string,
  currentCellCoord: CellCoord,
  rowsCount: number,
  cellsCount: number
) {
  switch (key) {
    case 'Escape':
      return getNextCellCoordByEscape(currentCellCoord);
    case 'Tab':
    case 'ArrowRight':
      return getNextCellCoordByTab(currentCellCoord, rowsCount, cellsCount);
    case 'ArrowUp':
      return getNextCellCoordByArrowUp(currentCellCoord);
    case 'ArrowDown':
      return getNextCellCoordByArrowDown(currentCellCoord, rowsCount);
    case 'ArrowLeft':
      return getNextCellCoordByArrowLeft(currentCellCoord, cellsCount);
  }

  return currentCellCoord;
}

function getNextCellCoordByTab(
  currentCellCoord: CellCoord,
  rowsCount: number,
  cellsCount: number
) {
  const nextCellPos = { rowIndex: 0, cellIndex: 0 };
  if (currentCellCoord.cellIndex !== cellsCount - 1) {
    // not last cell
    nextCellPos.rowIndex = currentCellCoord.rowIndex;
    nextCellPos.cellIndex = currentCellCoord.cellIndex + 1;
    return nextCellPos;
  }
  // last cell
  if (currentCellCoord.rowIndex !== rowsCount - 1) {
    // not last row
    nextCellPos.rowIndex = currentCellCoord.rowIndex + 1;
    nextCellPos.cellIndex = 0;
    return nextCellPos;
  }
  return currentCellCoord;
}

function getNextCellCoordByArrowLeft(
  currentCellCoord: CellCoord,
  cellsCount: number
) {
  const nextCellPos = { rowIndex: 0, cellIndex: 0 };
  if (currentCellCoord.cellIndex !== 0) {
    // not first cell
    nextCellPos.rowIndex = currentCellCoord.rowIndex;
    nextCellPos.cellIndex = currentCellCoord.cellIndex - 1;
    return nextCellPos;
  }
  // first cell
  if (currentCellCoord.rowIndex !== 0) {
    // not first row
    nextCellPos.rowIndex = currentCellCoord.rowIndex - 1;
    nextCellPos.cellIndex = cellsCount - 1;
    return nextCellPos;
  }
  return currentCellCoord;
}

function getNextCellCoordByArrowUp(currentCellCoord: CellCoord) {
  const nextCellPos = { rowIndex: 0, cellIndex: 0 };
  if (currentCellCoord.rowIndex !== 0) {
    // not first cell
    nextCellPos.rowIndex = currentCellCoord.rowIndex - 1;
    nextCellPos.cellIndex = currentCellCoord.cellIndex;
    return nextCellPos;
  }
  return currentCellCoord;
}

function getNextCellCoordByArrowDown(
  currentCellCoord: CellCoord,
  rowsCount: number
) {
  const nextCellPos = { rowIndex: 0, cellIndex: 0 };
  if (currentCellCoord.rowIndex + 1 !== rowsCount) {
    // not first cell
    nextCellPos.rowIndex = currentCellCoord.rowIndex + 1;
    nextCellPos.cellIndex = currentCellCoord.cellIndex;
    return nextCellPos;
  }
  return currentCellCoord;
}

function getNextCellCoordByEscape(currentCellCoord: CellCoord) {
  return currentCellCoord;
}

function getDatabaseById(id: string) {
  const database = document.querySelector<HTMLElement>(
    `affine-database[data-block-id="${id}"]`
  );
  assertExists(database);
  return database;
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
  cellLevelSelection?.clearSelection();
}
