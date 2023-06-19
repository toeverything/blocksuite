import type {
  EventName,
  UIEventDispatcher,
  UIEventHandler,
  UIEventStateContext,
} from '@blocksuite/lit';
import { DisposableGroup } from '@blocksuite/store';

import { getService } from '../../../__internal__/service.js';
import type { DatabaseBlockModel } from '../../database-model.js';
import type { DatabaseBlockService } from '../../database-service.js';
import {
  getCellCoord,
  getRowsContainer,
  setDatabaseCellEditing,
} from '../components/selection/utils.js';
import type { DatabaseCellElement } from '../register.js';

const CELL_SELECTION_MOVE_KEYS = [
  'Tab',
  'Enter',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
];

const CELL_SELECTION_ENTER_KEYS = ['Tab', 'Escape'];
export type CellSelectionEnterKeys = 'Tab' | 'Escape';

export class CellSelectionManager {
  private readonly _dispatcher: UIEventDispatcher;
  private readonly _disposables = new DisposableGroup();
  private readonly _model!: DatabaseBlockModel;

  private _service: DatabaseBlockService | null = null;

  constructor(dispatcher: UIEventDispatcher, model: DatabaseBlockModel) {
    this._dispatcher = dispatcher;
    this._model = model;
    this._service = getService('affine:database');

    this._add('click', this._onClick);
    this._add('keyDown', this._onCellSelectionMove);
  }

  private _onClick = (ctx: UIEventStateContext) => {
    this._service?.clearCellLevelSelection();
  };

  private _onCellSelectionMove = (ctx: UIEventStateContext) => {
    const e = ctx.get('keyboardState');
    const event = e.raw;
    const service = getService('affine:database');
    if (
      CELL_SELECTION_MOVE_KEYS.indexOf(event.key) <= -1 ||
      service.getLastCellSelection()?.isEditing
    )
      return;
    service.clearRowSelection();
    const cellSelection = service.getLastCellSelection();
    if (!cellSelection) return;
    event.preventDefault();

    const { databaseId, coords } = cellSelection;
    if (event.key === 'Enter') {
      setDatabaseCellEditing(databaseId, coords[0]);
    } else {
      // set cell selection
      const nextCoord = getCellCoord(coords[0], databaseId, event.key);
      service.setCellSelection({
        type: 'select',
        coords: [nextCoord],
        databaseId,
        isEditing: false,
      });
    }

    return true;
  };

  private _add = (name: EventName, fn: UIEventHandler) => {
    this._disposables.add(this._dispatcher.add(name, fn));
  };

  onCellSelectionChange = (event: KeyboardEvent) => {
    if (!isValidKey(event.key)) return;
    event.preventDefault();
    event.stopPropagation();

    const lastCellSelection = this._service?.getLastCellSelection();
    if (!lastCellSelection) {
      return;
    }
    const cellCoord = lastCellSelection.coords[0];
    if (lastCellSelection.isEditing) {
      const ele = findFocusedElement(
        lastCellSelection.databaseId,
        cellCoord.rowIndex,
        cellCoord.cellIndex
      );
      if (!ele) {
        return;
      }
      ele?.exitEditMode();
    }
    if (event.key === 'Tab') {
      this._service?.setCellSelection({
        type: 'select',
        coords: [getCellCoord(cellCoord, this._model.id, 'Tab')],
        databaseId: this._model.id,
        isEditing: false,
      });
    }
  };

  dispose() {
    this._disposables.dispose();
  }
}

function isValidKey(key: string): key is CellSelectionEnterKeys {
  return CELL_SELECTION_ENTER_KEYS.indexOf(key) > -1;
}

export function selectCellByElement(
  element: Element,
  databaseId: string,
  key: CellSelectionEnterKeys
) {
  const rowsContainer = element.closest('.affine-database-block-rows');
  const currentCell = element.closest<HTMLElement>('.database-cell');
  if (!rowsContainer) return;
  if (!currentCell) return;
  const nextCoord = getCellCoord(currentCell, databaseId, key);
  const service = getService('affine:database');
  // TODO
  // Maybe we can no longer trigger the cell selection logic after selecting the row selection.
  const hasRowSelection = service.getLastRowSelection() !== null;
  if (hasRowSelection) return;

  service.setCellSelection({
    type: 'select',
    coords: [nextCoord],
    databaseId,
    isEditing: false,
  });
}

export function selectCurrentCell(element: Element, isEditing: boolean) {
  const rowsContainer = element.closest('.affine-database-block-rows');
  const currentCell = element.closest<HTMLElement>('.database-cell');
  const databaseId =
    element.closest<HTMLElement>('affine-database')?.dataset.blockId;
  if (!rowsContainer || !currentCell || !databaseId) return;
  const nextCoord = getCellCoord(currentCell, databaseId, 'Escape');

  const service = getService('affine:database');

  service.setCellSelection({
    type: 'select',
    coords: [nextCoord],
    databaseId,
    isEditing,
  });
}

export const findFocusedElement = (
  databaseId: string,
  row: number,
  column: number
) => {
  const container = getRowsContainer(databaseId);
  const rows = container.querySelectorAll('.affine-database-block-row');
  return rows[row]?.querySelectorAll('affine-database-cell-container')?.[column]
    ?.firstElementChild as DatabaseCellElement<unknown> | undefined;
};
