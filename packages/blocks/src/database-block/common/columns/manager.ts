import { assertExists } from '@blocksuite/store';

import type { UniComponent } from '../../../components/uni-component/uni-component.js';
import type { TType } from '../../logical/typesystem.js';
import type { DataViewColumnManager } from '../data-view-manager.js';

type JSON =
  | null
  | number
  | string
  | boolean
  | JSON[]
  | {
      [k: string]: JSON;
    };

interface CellRenderProps<
  Data extends Record<string, unknown> = Record<string, never>,
  Value = unknown
> {
  column: DataViewColumnManager<Value, Data>;
  rowId: string;
  isEditing: boolean;
  selectCurrentCell: (editing: boolean) => void;
}

export type CellRenderer<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown
> = {
  view: UniComponent<CellRenderProps<Data, Value>>;
  edit?: UniComponent<CellRenderProps<Data, Value>>;
};
type ColumnOps<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown
> = {
  defaultData: () => Data;
  type: (data: Data) => TType;
  cellToString: (data: Value, colData: Data) => string;
  cellToJson: (data: Value, colData: Data) => JSON;
};

type ConvertFunction<
  FromColumn extends Record<string, unknown>,
  FromCell,
  ToColumn extends Record<string, unknown>,
  ToCell
> = (
  column: FromColumn,
  cells: (FromCell | undefined)[]
) => {
  column: ToColumn;
  cells: (ToCell | undefined)[];
};

class ColumnHelperContainer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map = new Map<string, ColumnHelper<any, any>>();
  private convert = new Map<
    string,
    (
      column: Record<string, unknown>,
      cells: unknown[]
    ) => {
      column: Record<string, unknown>;
      cells: unknown[];
    }
  >();

  getColumn(type: string) {
    const column = this.map.get(type);
    if (!column) {
      throw new Error(`${type} is not exist`);
    }
    return column;
  }

  register<CellData, T extends Record<string, unknown> = Record<string, never>>(
    type: string,
    ops: ColumnOps<T, CellData>
  ) {
    const helper = new ColumnHelper(type, ops);
    this.map.set(type, helper);
    return helper;
  }

  toString(type: string, cellData: unknown, colData: unknown) {
    return this.map.get(type)?.toString(cellData, colData);
  }

  registerConvert<
    FromCell,
    ToCell,
    FromColumn extends Record<string, unknown>,
    ToColumn extends Record<string, unknown>
  >(
    from: ColumnHelper<FromColumn, FromCell>,
    to: ColumnHelper<ToColumn, ToCell>,
    convert: ConvertFunction<FromColumn, FromCell, ToColumn, ToCell>
  ) {
    this.convert.set(`${from.type}|${to.type}`, convert as never);
  }

  convertCell(
    from: string,
    to: string,
    column: Record<string, unknown>,
    cells: unknown[]
  ) {
    return this.convert.get(`${from}|${to}`)?.(column, cells);
  }

  create(targetType: string, name: string, data?: unknown) {
    return this.getColumn(targetType)?.create(name, data);
  }

  defaultData(type: string): Record<string, unknown> {
    return this.getColumn(type)?.defaultData();
  }

  typeOf(type: string, data: unknown): TType {
    const dataType = this.map.get(type)?.dataType(data);
    assertExists(dataType);
    return dataType;
  }
}

class ColumnHelper<
  T extends Record<string, unknown> = Record<string, never>,
  CellData = unknown
> {
  constructor(
    public readonly type: string,
    public ops: ColumnOps<T, CellData>
  ) {}

  create(
    name: string,
    data?: T
  ): {
    type: string;
    name: string;
    data: T;
  } {
    return {
      type: this.type,
      name,
      data: data ?? this.ops.defaultData(),
    };
  }

  defaultData() {
    return this.ops.defaultData();
  }

  createWithId(
    id: string,
    name: string,
    data?: T
  ): {
    type: string;
    name: string;
    data: T;
    id: string;
  } {
    return {
      id,
      type: this.type,
      name,
      data: data ?? this.ops.defaultData(),
    };
  }

  dataType(data: T) {
    return this.ops.type(data);
  }

  toString(cellData: CellData, colData: T): string {
    return this.ops.cellToString(cellData, colData);
  }

  toJson(cellData: CellData, colData: T): JSON {
    return this.ops.cellToJson(cellData, colData);
  }
}

export const columnManager = new ColumnHelperContainer();
