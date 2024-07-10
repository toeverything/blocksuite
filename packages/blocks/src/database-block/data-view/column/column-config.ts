import type { Disposable } from '@blocksuite/global/utils';

import type { TType } from '../logical/typesystem.js';
import type { StatCalcOpType } from '../view/presets/table/types.js';
import type {
  GetCellDataFromConfig,
  GetColumnDataFromConfig,
} from './manager.js';
import { createRendererConfig, type Renderer } from './renderer.js';

type JSON =
  | null
  | number
  | string
  | boolean
  | JSON[]
  | {
      [k: string]: JSON;
    };

type ColumnOps<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown,
> = {
  name: string;
  defaultData: () => Data;
  type: (data: Data) => TType;
  formatValue?: (value: unknown, colData: Data) => Value;
  isEmpty: (value?: Value) => boolean;
  cellToString: (data: Value, colData: Data) => string;
  cellFromString: (
    data: string,
    colData: Data
  ) => {
    value: unknown;
    data?: Record<string, unknown>;
  };
  cellToJson: (data: Value, colData: Data) => JSON;
  addGroup?: (text: string, oldData: Data) => Data;
  onUpdate?: (value: Value, Data: Data, callback: () => void) => Disposable;
  valueUpdate?: (value: Value, Data: Data, newValue: Value) => Value;
};

export class ColumnConfig<
  Type extends string = keyof ColumnConfigMap,
  T extends NonNullable<unknown> = NonNullable<unknown>,
  CellData = unknown,
> {
  convertMap = new Map();

  constructor(
    readonly type: Type,
    public ops: ColumnOps<T, CellData>
  ) {}

  create = (
    name: string,
    data?: T
  ): {
    type: string;
    name: string;
    statCalcOp: StatCalcOpType;
    data: T;
  } => {
    return {
      type: this.type,
      name,
      statCalcOp: 'none',
      data: data ?? this.ops.defaultData(),
    };
  };

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

  formatValue(cellData: CellData, colData: T): CellData | undefined {
    return cellData === undefined
      ? undefined
      : this.ops.formatValue?.(cellData, colData) ?? cellData;
  }

  fromString(cellData: string, colData: T) {
    return this.ops.cellFromString(cellData, colData);
  }

  convertCell(to: string, column: Record<string, unknown>, cells: unknown[]) {
    return this.convertMap.get(to)?.(column, cells);
  }

  registerConvert = <ToCellName extends keyof ColumnConfigMap>(
    to: ToCellName,
    convert: (
      column: GetColumnDataFromConfig<ColumnConfig<Type, T, CellData>>,
      cells: (
        | GetCellDataFromConfig<ColumnConfig<Type, T, CellData>>
        | undefined
      )[]
    ) => {
      column: GetColumnDataFromConfig<ColumnConfigMap[ToCellName]>;
      cells: (GetCellDataFromConfig<ColumnConfigMap[ToCellName]> | undefined)[];
    }
  ) => {
    this.convertMap.set(to, convert);
  };

  get name() {
    return this.ops.name;
  }
}

export type ColumnMeta<
  Type extends string = keyof ColumnConfigMap,
  CellData = unknown,
  ColumnData extends NonNullable<unknown> = NonNullable<unknown>,
> = {
  type: Type;
  model: ColumnConfig<Type, ColumnData, CellData>;
  renderer: Renderer<ColumnData, CellData>;
};
export const columnType = <Type extends string>(type: Type) => ({
  type: type,
  modelConfig: <
    CellData,
    ColumnData extends Record<string, unknown> = Record<string, never>,
  >(
    ops: ColumnOps<ColumnData, CellData>
  ) => {
    const model = new ColumnConfig(type, ops);
    return {
      type,
      model,
      create: model.create,
      addConvert: model.registerConvert,
      renderConfig: (
        renderer: Omit<Renderer<ColumnData, CellData>, 'type'>
      ): ColumnMeta<Type, CellData, ColumnData> => ({
        type,
        model,
        renderer: createRendererConfig<CellData, ColumnData>({
          ...renderer,
          type,
        }),
      }),
    };
  },
});
