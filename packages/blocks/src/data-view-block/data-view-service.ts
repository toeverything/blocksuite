import { Slot } from '@blocksuite/store';

import { BaseService } from '../__internal__/service/index.js';
import type {
  DatabaseSelectionState,
  TableViewSelection,
} from '../__internal__/utils/types.js';
import type { DataViewBlockModel } from './data-view-model.js';

export class DataViewBlockService extends BaseService<DataViewBlockModel> {
  private _databaseSelection?: TableViewSelection;

  slots = {
    databaseSelectionUpdated: new Slot<DatabaseSelectionState>(),
  };

  constructor() {
    super();
    this.slots.databaseSelectionUpdated.on(selection => {
      this._databaseSelection = selection;
    });
  }

  select(state: DatabaseSelectionState) {
    this._databaseSelection = state;
    this.slots.databaseSelectionUpdated.emit(state);
  }

  getSelection() {
    return this._databaseSelection;
  }
}
