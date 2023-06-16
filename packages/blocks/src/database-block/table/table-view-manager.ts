import type { FilterGroup } from '../common/ast.js';
import type {
  DatabaseViewDataMap,
  TableMixColumn,
} from '../common/view-manager.js';
import type { ColumnDataUpdater, InsertPosition } from '../database-model.js';

export interface TableViewManager {
  readonly name: string;
  readonly filter: FilterGroup;
  readonly columns: ColumnManager[];
  readonly readonly: boolean;

  changeName(name: string): void;

  changeFilter(filter: FilterGroup): void;

  moveColumn(column: string, toAfterOfColumn?: InsertPosition): void;

  newColumn(toAfterOfColumn?: InsertPosition): void;

  preColumn(id: string): TableMixColumn | undefined;

  nextColumn(id: string): TableMixColumn | undefined;
}

export interface ColumnManager<
  Data extends Record<string, unknown> = Record<string, unknown>
> {
  readonly id: string;
  readonly type: string;
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

  isFirst: boolean;
  isLast: boolean;
}

export class DatabaseTableViewManager implements TableViewManager {
  constructor(
    private ops: {
      view: DatabaseViewDataMap['table'];
      columns: TableMixColumn[];
    }
  ) {
    //TODO
  }

  get columns(): ColumnManager[] {
    return this.ops.columns;
  }

  readonly filter: FilterGroup;
  readonly name: string;
  readonly readonly: boolean;

  changeFilter(filter: FilterGroup): void {
    //
  }

  changeName(name: string): void {
    //
  }

  moveColumn(column: string, toAfterOfColumn?: InsertPosition): void {
    //
  }

  newColumn(toAfterOfColumn?: InsertPosition): void {
    //
  }

  nextColumn(id: string): TableMixColumn | undefined {
    return undefined;
  }

  preColumn(id: string): TableMixColumn | undefined {
    return undefined;
  }
}

export class DatabaseColumnManager implements ColumnManager {
  constructor(column: TableMixColumn) {
    //TODO
  }
}
