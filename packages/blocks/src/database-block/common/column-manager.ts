import { assertExists, Text } from '@blocksuite/store';
import type { TemplateResult } from 'lit';
import { html } from 'lit';

import type { TType } from '../logical/typesystem.js';
import {
  tArray,
  tBoolean,
  tNumber,
  tString,
  tTag,
} from '../logical/typesystem.js';
import type { SelectTag } from '../types.js';

type ColumnOps<
  ColumnData extends Record<string, unknown> = Record<string, never>,
  CellData = unknown
> = {
  defaultData: () => ColumnData;
  type: (data: ColumnData) => TType;
  configRender: (data: ColumnData) => TemplateResult<1>;
  cellToString: (data: CellData, colData: ColumnData) => string;
};

class ColumnManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map = new Map<string, ColumnHelper<any, any>>();
  private convert = new Map<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (columnData: any) => [any, (cell: any) => any]
  >();

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
    const column = this.map.get(targetType);
    if (!column) {
      throw new Error(`${targetType} is not exist`);
    }
    return column?.create(name, data);
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
  ): { type: string; name: string; data: T; id?: string } {
    return {
      type: this.type,
      name,
      data: data ?? this.ops.defaultData(),
    };
  }

  createWithId(
    id: string,
    name: string,
    data?: T
  ): { type: string; name: string; data: T; id: string } {
    return {
      id,
      type: this.type,
      name,
      data: data ?? this.ops.defaultData(),
    };
  }

  render(data: T) {
    return this.ops.configRender(data);
  }

  dataType(data: T) {
    return this.ops.type(data);
  }

  toString(cellData: CellData, colData: T): string {
    return this.ops.cellToString(cellData, colData);
  }
}

export const columnManager = new ColumnManager();
export const richTextHelper = columnManager.register<Text['yText']>(
  'rich-text',
  {
    type: () => tString.create(),
    defaultData: () => ({}),
    configRender: () => html``,
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
    configRender: () => html``,
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
  configRender: () => html``,
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
  configRender: () => html``,
  cellToString: data => data?.toString() ?? '',
});
export const checkboxHelper = columnManager.register<boolean>('checkbox', {
  type: () => tBoolean.create(),
  defaultData: () => ({}),
  configRender: () => html``,
  cellToString: data => '',
});
export const progressHelper = columnManager.register<number>('progress', {
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
  cell => cell[0],
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
  cell => new Text(cell.toString()).yText,
]);
columnManager.registerConvert(progressHelper, richTextHelper, column => [
  {},
  cell => new Text(cell.toString()).yText,
]);
