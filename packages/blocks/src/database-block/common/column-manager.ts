import { assertExists, Text } from '@blocksuite/store';

import type { SelectTag } from '../../components/tags/multi-tag-select.js';
import type { UniComponent } from '../../components/uni-component/uni-component.js';
import { tBoolean, tNumber, tString, tTag } from '../logical/data-type.js';
import type { TType } from '../logical/typesystem.js';
import { tArray } from '../logical/typesystem.js';
import type { ColumnManager } from '../table/table-view-manager.js';

interface CellRenderProps<
  Data extends Record<string, unknown> = Record<string, never>,
  Value = unknown
> {
  column: ColumnManager<Value, Data>;
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
};

class ColumnHelperContainer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map = new Map<string, ColumnHelper<any, any>>();
  private convert = new Map<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (columnData: any) => [any, (cell: any) => any]
  >();

  getColumn(type: string) {
    const column = this.map.get(type);
    if (!column) {
      throw new Error(`${type} is not exist`);
    }
    return column;
  }

  register<
    CellData,
    T extends Record<string, unknown> = Record<string, unknown>
  >(type: string, ops: ColumnOps<T, CellData>) {
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
    convert: (column: FromColumn) => [ToColumn, (cell: FromCell) => ToCell]
  ) {
    this.convert.set(`${from.type}|${to.type}`, convert);
  }

  convertCell(from: string, to: string, column: Record<string, unknown>) {
    return this.convert.get(`${from}|${to}`)?.(column);
  }

  create(targetType: string, name: string, data?: unknown) {
    return this.getColumn(targetType)?.create(name, data);
  }

  defaultData(type: string) {
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
    private ops: ColumnOps<T, CellData>
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
}

export const columnManager = new ColumnHelperContainer();
export const titleHelper = columnManager.register<Text['yText']>('title', {
  type: () => tString.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
});
export const richTextHelper = columnManager.register<Text['yText']>(
  'rich-text',
  {
    type: () => tString.create(),
    defaultData: () => ({}),
    cellToString: data => data?.toString() ?? '',
  }
);
export type SelectColumnData = {
  options: SelectTag[];
};
export const selectHelper = columnManager.register<string, SelectColumnData>(
  'select',
  {
    type: data => tArray(tTag.create({ tags: data.options })),
    defaultData: () => ({
      options: [],
    }),
    cellToString: (data, colData) =>
      colData.options.find(v => v.id === data)?.value ?? '',
  }
);
export const multiSelectHelper = columnManager.register<
  string[],
  SelectColumnData
>('multi-select', {
  type: data => tArray(tTag.create({ tags: data.options })),
  defaultData: () => ({
    options: [],
  }),
  cellToString: (data, colData) =>
    data?.map(id => colData.options.find(v => v.id === id)?.value).join(' '),
});
export const numberHelper = columnManager.register<
  number,
  {
    decimal: number;
  }
>('number', {
  type: () => tNumber.create(),
  defaultData: () => ({ decimal: 0 }),
  cellToString: data => data?.toString() ?? '',
});
export const checkboxHelper = columnManager.register<boolean>('checkbox', {
  type: () => tBoolean.create(),
  defaultData: () => ({}),
  cellToString: data => '',
});
export const progressHelper = columnManager.register<number>('progress', {
  type: () => tNumber.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
});
export const linkHelper = columnManager.register<string>('link', {
  type: () => tString.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
});
export const dateHelper = columnManager.register<number>('date', {
  type: () => tNumber.create(),
  defaultData: () => ({}),
  configRender: () => html``,
  cellToString: data => data?.toString() ?? '',
});

columnManager.registerConvert(selectHelper, multiSelectHelper, column => [
  column,
  cell => [cell],
]);
columnManager.registerConvert(selectHelper, richTextHelper, column => [
  column,
  cell => new Text(column.options.find(v => v.id === cell)?.value ?? '').yText,
]);
columnManager.registerConvert(multiSelectHelper, selectHelper, column => [
  column,
  cell => cell?.[0],
]);
columnManager.registerConvert(multiSelectHelper, richTextHelper, column => [
  column,
  cell =>
    new Text(
      cell
        ?.map(id => column.options.find(v => v.id === id)?.value ?? '')
        .join(',')
    ).yText,
]);
columnManager.registerConvert(numberHelper, richTextHelper, column => [
  {},
  cell => new Text(cell?.toString()).yText,
]);
columnManager.registerConvert(progressHelper, richTextHelper, column => [
  {},
  cell => new Text(cell?.toString()).yText,
]);
