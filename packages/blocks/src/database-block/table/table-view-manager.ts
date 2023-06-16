import type { FilterGroup } from '../common/ast.js';
import type {
  DatabaseViewDataMap,
  TableMixColumn,
} from '../common/view-manager.js';
import type { ColumnDataUpdater } from '../database-model.js';

export interface TableViewManager {
  readonly name: string;
  readonly filter: FilterGroup;
  readonly columns: ColumnManager[];
  readonly readonly: boolean;

  changeName(name: string): void;

  changeFilter(filter: FilterGroup): void;
}

export interface ColumnManager<
  Data extends Record<string, unknown> = Record<string, unknown>
> {
  readonly name: string;
  readonly width: number;
  readonly hide?: boolean;

  updateWidth(width: number): void;

  updateData(data: ColumnDataUpdater<Data>): void;

  updateHide(hide: boolean): void;

  updateName(name: string): void;

  updateType?(type: string): void;

  delete?(): void;

  duplicate?(): void;
}

export class DatabaseTableViewManager implements TableViewManager {
  constructor(ops: { view: DatabaseViewDataMap['table'] }) {
    //TODO
  }
}

export class DatabaseColumnManager implements ColumnManager {
  constructor(column: TableMixColumn) {
    //TODO
  }
}
