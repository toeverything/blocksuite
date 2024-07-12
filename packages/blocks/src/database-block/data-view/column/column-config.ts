import type { Disposable } from '@blocksuite/global/utils';

import type { TType } from '../logical/typesystem.js';
import type { StatCalcOpType } from '../view/presets/table/types.js';
import type {
  GetCellDataFromConfig,
  GetColumnDataFromConfig,
} from './manager.js';

import { type Renderer, createRendererConfig } from './renderer.js';

type JSON =
  | {
      [k: string]: JSON;
    }
  | JSON[]
  | boolean
  | null
  | number
  | string;

type ColumnOps<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown,
> = {
  addGroup?: (text: string, oldData: Data) => Data;
  cellFromString: (
    data: string,
    colData: Data
  ) => {
    data?: Record<string, unknown>;
    value: unknown;
  };
  cellToJson: (data: Value, colData: Data) => JSON;
  cellToString: (data: Value, colData: Data) => string;
  defaultData: () => Data;
  formatValue?: (value: unknown, colData: Data) => Value;
  isEmpty: (value?: Value) => boolean;
  name: string;
  onUpdate?: (value: Value, Data: Data, callback: () => void) => Disposable;
  type: (data: Data) => TType;
  valueUpdate?: (value: Value, Data: Data, newValue: Value) => Value;
};

export class ColumnConfig<
  Type extends string = keyof ColumnConfigMap,
  T extends NonNullable<unknown> = NonNullable<unknown>,
  CellData = unknown,
> {
  convertMap = new Map();

  create = (
    name: string,
    data?: T
  ): {
    data: T;
    name: string;
    statCalcOp: StatCalcOpType;
    type: string;
  } => {
    return {
      data: data ?? this.ops.defaultData(),
      name,
      statCalcOp: 'none',
      type: this.type,
    };
  };

  registerConvert = <ToCellName extends keyof ColumnConfigMap>(
    to: ToCellName,
    convert: (
      column: GetColumnDataFromConfig<ColumnConfig<Type, T, CellData>>,
      cells: (
        | GetCellDataFromConfig<ColumnConfig<Type, T, CellData>>
        | undefined
      )[]
    ) => {
      cells: (GetCellDataFromConfig<ColumnConfigMap[ToCellName]> | undefined)[];
      column: GetColumnDataFromConfig<ColumnConfigMap[ToCellName]>;
    }
  ) => {
    this.convertMap.set(to, convert);
  };

  constructor(
    readonly type: Type,
    public ops: ColumnOps<T, CellData>
  ) {}

  convertCell(to: string, column: Record<string, unknown>, cells: unknown[]) {
    return this.convertMap.get(to)?.(column, cells);
  }

  createWithId(
    id: string,
    name: string,
    data?: T
  ): {
    data: T;
    id: string;
    name: string;
    type: string;
  } {
    return {
      data: data ?? this.ops.defaultData(),
      id,
      name,
      type: this.type,
    };
  }

  dataType(data: T) {
    return this.ops.type(data);
  }

  defaultData() {
    return this.ops.defaultData();
  }

  formatValue(cellData: CellData, colData: T): CellData | undefined {
    return cellData === undefined
      ? undefined
      : this.ops.formatValue?.(cellData, colData) ?? cellData;
  }

  fromString(cellData: string, colData: T) {
    return this.ops.cellFromString(cellData, colData);
  }

  toJson(cellData: CellData, colData: T): JSON {
    return this.ops.cellToJson(cellData, colData);
  }

  toString(cellData: CellData, colData: T): string {
    return this.ops.cellToString(cellData, colData);
  }

  get name() {
    return this.ops.name;
  }
}

export type ColumnMeta<
  Type extends string = keyof ColumnConfigMap,
  CellData = unknown,
  ColumnData extends NonNullable<unknown> = NonNullable<unknown>,
> = {
  model: ColumnConfig<Type, ColumnData, CellData>;
  renderer: Renderer<ColumnData, CellData>;
  type: Type;
};
export const columnType = <Type extends string>(type: Type) => ({
  modelConfig: <
    CellData,
    ColumnData extends Record<string, unknown> = Record<string, never>,
  >(
    ops: ColumnOps<ColumnData, CellData>
  ) => {
    const model = new ColumnConfig(type, ops);
    return {
      addConvert: model.registerConvert,
      create: model.create,
      model,
      renderConfig: (
        renderer: Omit<Renderer<ColumnData, CellData>, 'type'>
      ): ColumnMeta<Type, CellData, ColumnData> => ({
        model,
        renderer: createRendererConfig<CellData, ColumnData>({
          ...renderer,
          type,
        }),
        type,
      }),
      type,
    };
  },
  type: type,
});
