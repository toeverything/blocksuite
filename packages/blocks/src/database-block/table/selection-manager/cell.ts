import type {
  EventName,
  UIEventDispatcher,
  UIEventHandler,
  UIEventStateContext,
} from '@blocksuite/lit';
import { DisposableGroup } from '@blocksuite/store';

import { getService } from '../../../__internal__/service.js';
import { resetNativeSelection } from '../../../std.js';
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
    if (!isValidKey(event.key)) return;
    event.preventDefault();
    event.stopPropagation();

    const element = event.target as HTMLElement;
    selectCellByElement(element, this._model.id, event.key);
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

  const editor = currentCell.querySelector<HTMLElement>('.virgo-editor');
  editor?.blur();
  resetNativeSelection(null);

  const nextCoord = getCellCoord(currentCell, databaseId, key);

  const service = getService('affine:database');
  service.setCellSelection({
    type: 'select',
    coords: [nextCoord],
    databaseId,
  });
}
