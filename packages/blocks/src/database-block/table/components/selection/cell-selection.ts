import { WithDisposable } from '@blocksuite/lit';
import { assertExists } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

type SelectionState = {
  databaseId: string;
  key: string;
};

type CellRects = {
  left: number;
  top: number;
  height: number;
  width: number;
  cell: HTMLElement;
}[][];
type CellCoord = {
  rowIndex: number;
  cellIndex: number;
};

@customElement('database-cell-level-selection')
export class CellLevelSelection extends WithDisposable(LitElement) {
  static override styles = css`
    .database-cell-level-selection {
      position: absolute;
      width: 100%;
      z-index: 1;
      box-sizing: border-box;
      border: 2px solid var(--affine-primary-color);
      border-radius: 2px;
      background: var(--affine-primary-color-04);
    }
  `;

  @property()
  cell!: HTMLElement;

  @state()
  state: SelectionState = {
    databaseId: '',
    key: '',
  };

  private _lastCellPos: CellCoord | null = null;
  private _currentSelectedCell: HTMLElement | null = null;

  setSelection = (state: SelectionState) => {
    this.state = state;
  };

  clearSelection = () => {
    this._currentSelectedCell = null;
    this.state = {
      databaseId: '',
      key: '',
    };
  };

  getCurrentSelectedCell = () => {
    return this._currentSelectedCell;
  };

  private _getStyles = () => {
    const { databaseId, key } = this.state;
    if (!databaseId || !key) {
      this._lastCellPos = null;
      return {
        left: 0,
        top: 0,
        height: 0,
        display: 'none',
      };
    }

    const rowsContainer = getRowsContainer(databaseId);
    const { cellRects, currentCellCoord: _currentCellCoord } =
      getCellRectByCoord(rowsContainer, this.cell);
    let currentCellCoord = _currentCellCoord;
    if (this._lastCellPos) {
      // move to next cell
      currentCellCoord = this._lastCellPos;
    }

    const nextCellCoord = getNextCellCoord(
      key,
      currentCellCoord,
      cellRects.length,
      cellRects[0].length
    );
    this._lastCellPos = nextCellCoord;
    const nextCellRect =
      cellRects[nextCellCoord.rowIndex][nextCellCoord.cellIndex];
    this._currentSelectedCell = nextCellRect.cell;
    const { left, top } = rowsContainer.getBoundingClientRect();

    return {
      left: nextCellRect.left - left,
      top: nextCellRect.top - top,
      height: nextCellRect.height,
      width: nextCellRect.width,
    };
  };

  override render() {
    const { left, top, height, width, display } = this._getStyles();

    const styles = styleMap({
      display,
      left: `${left}px`,
      top: `${top}px`,
      height: `${height}px`,
      width: `${width}px`,
    });

    return html`<div
      class="database-cell-level-selection"
      style=${styles}
    ></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'database-cell-level-selection': CellLevelSelection;
  }
}

export function getRowsContainer(databaseId: string) {
  const database = getDatabaseById(databaseId);
  const container = database.querySelector<HTMLElement>(
    '.affine-database-table-container'
  );
  assertExists(container);
  return container;
}

function getCellRectByCoord(rowsContainer: Element, currentCell: Element) {
  // [ [{ left, top, height, cell }] ]
  const cellRects: CellRects = [];
  let currentCellCoord: CellCoord = { rowIndex: 0, cellIndex: 0 };
  const allRows = rowsContainer.querySelectorAll('.affine-database-block-row');
  allRows.forEach((row, rowIndex) => {
    const allCells = row.querySelectorAll<HTMLElement>('.database-cell');
    allCells.forEach((cell, cellIndex) => {
      // skip the last cell which is "+"
      if (cell.classList.contains('add-column-button')) return;

      if (cell === currentCell) {
        currentCellCoord = {
          rowIndex,
          cellIndex,
        };
      }
      const { left, top, height, width } = cell.getBoundingClientRect();
      cellRects[rowIndex] = cellRects[rowIndex] ?? [];
      cellRects[rowIndex][cellIndex] = { left, top, height, width, cell };
    });
  });

  return {
    cellRects,
    currentCellCoord,
  };
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
