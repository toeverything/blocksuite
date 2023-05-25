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
import { getCellCoord } from '../components/selection/utils.js';

const CELL_SELECTION_MOVE_KEYS = [
  'Tab',
  'Enter',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
];

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
    if (CELL_SELECTION_MOVE_KEYS.indexOf(event.key) <= -1) return;

    const service = getService('affine:database');
    const cellSelection = service.getLastCellSelection();
    if (!cellSelection) return;
    event.preventDefault();

    const { databaseId, coords } = cellSelection;
    if (event.key === 'Enter') {
      // enter editing state
      service.setCellSelection({
        type: 'edit',
        coords,
        databaseId,
      });
    } else {
      // set cell selection
      const nextCoord = getCellCoord(coords[0], databaseId, event.key);
      service.setCellSelection({
        type: 'select',
        coords: [nextCoord],
        databaseId,
      });
    }

    return true;
  };

  private _add = (name: EventName, fn: UIEventHandler) => {
    this._disposables.add(this._dispatcher.add(name, fn));
  };

  onCellSelectionChange = (event: KeyboardEvent) => {
    if (['Tab', 'Escape'].indexOf(event.key) <= -1) return;

    const target = event.target as HTMLElement;
    const rowsContainer = target.closest('.affine-database-block-rows');
    const currentCell = target.closest<HTMLElement>('.database-cell');
    if (!rowsContainer) return;
    if (!currentCell) return;
    event.preventDefault();
    event.stopPropagation();

    const databaseId = this._model.id;
    const editor = currentCell.querySelector<HTMLElement>('.virgo-editor');
    editor?.blur();

    const nextCoord = getCellCoord(currentCell, databaseId, event.key);

    const service = getService('affine:database');
    service.setCellSelection({
      type: 'select',
      coords: [nextCoord],
      databaseId,
    });
  };

  dispose() {
    this._disposables.dispose();
  }
}
