import type { UniComponent } from '../../../components/uni-component/uni-component.js';
import type { TType } from '../../logical/typesystem.js';
import type {
  DataViewColumnManager,
  DataViewManager,
} from '../data-view-manager.js';

type JSON =
  | null
  | number
  | string
  | boolean
  | JSON[]
  | {
      [k: string]: JSON;
    };

export interface CellRenderProps<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown,
> {
  view: DataViewManager;
  column: DataViewColumnManager<Value, Data>;
  rowId: string;
  isEditing: boolean;
  selectCurrentCell: (editing: boolean) => void;
}

export interface DataViewCellLifeCycle {
  beforeEnterEditMode(): boolean;

  onEnterEditMode(): void;

  onExitEditMode(): void;

  focusCell(): boolean;

  blurCell(): boolean;

  forceUpdate(): void;
}

export type DataViewCellComponent<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown,
> = UniComponent<CellRenderProps<Data, Value>, DataViewCellLifeCycle>;

export type CellRenderer<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown,
> = {
  view: DataViewCellComponent<Data, Value>;
  edit?: DataViewCellComponent<Data, Value>;
};
type ColumnOps<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown,
> = {
  name: string;
  defaultData: () => Data;
  type: (data: Data) => TType;
  formatValue?: (value: unknown, colData: Data) => Value;
  cellToString: (data: Value, colData: Data) => string;
  cellFromString: (
    data: string,
    colData: Data
  ) => { value: unknown; data?: Record<string, unknown> };
  cellToJson: (data: Value, colData: Data) => JSON;
  addGroup?: (text: string, oldData: Data) => Data;
};

type ConvertFunction<From extends ColumnConfig, To extends ColumnConfig> = (
  column: GetColumnDataFromConfig<From>,
  cells: (GetCellDataFromConfig<From> | undefined)[]
) => {
  column: GetColumnDataFromConfig<To>;
  cells: (GetCellDataFromConfig<To> | undefined)[];
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ColumnConfigMap {}
}

export class ColumnConfigManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map = new Map<string, ColumnConfig<any, any>>();

  getColumn<Type extends keyof ColumnConfigMap>(
    type: Type
  ): ColumnConfigMap[Type];
  getColumn(type: string): ColumnConfig;
  getColumn(type: string): ColumnConfig {
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
    const config = new ColumnConfig(type, ops);
    this.map.set(type, config);
    return config;
  }
}

export type GetColumnDataFromConfig<T extends ColumnConfig> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends ColumnConfig<infer R, any> ? R : never;
export type GetCellDataFromConfig<T extends ColumnConfig> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends ColumnConfig<any, infer R> ? R : never;

export class ColumnConfig<
  T extends NonNullable<unknown> = NonNullable<unknown>,
  CellData = unknown,
> {
  convertMap = new Map();

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

  registerConvert<ToCellName extends keyof ColumnConfigMap>(
    to: ToCellName,
    // @ts-expect-error
    convert: ConvertFunction<this, ColumnConfigMap[ToCellName]>
  ) {
    this.convertMap.set(to, convert);
  }

  get name() {
    return this.ops.name;
  }
}

export const columnManager = new ColumnConfigManager();
