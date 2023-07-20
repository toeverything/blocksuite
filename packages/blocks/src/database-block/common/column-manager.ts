import { assertExists, nanoid, Text } from '@blocksuite/store';

import { getTagColor } from '../../components/tags/colors.js';
import type { SelectTag } from '../../components/tags/multi-tag-select.js';
import type { UniComponent } from '../../components/uni-component/uni-component.js';
import { tBoolean, tNumber, tString, tTag } from '../logical/data-type.js';
import type { TType } from '../logical/typesystem.js';
import { tArray } from '../logical/typesystem.js';
import type { DataViewColumnManager } from './data-view-manager.js';

type JSON =
  | null
  | number
  | string
  | boolean
  | JSON[]
  | {
      [k: string]: JSON;
    };

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
export const titleHelper = columnManager.register<Text['yText']>('title', {
  type: () => tString.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellToJson: data => data?.toString() ?? null,
});
export const richTextHelper = columnManager.register<Text['yText']>(
  'rich-text',
  {
    type: () => tString.create(),
    defaultData: () => ({}),
    cellToString: data => data?.toString() ?? '',
    cellToJson: data => data?.toString() ?? null,
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
    cellToJson: data => data ?? null,
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
  cellToJson: data => data ?? null,
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
  cellToJson: data => data ?? null,
});
export const checkboxHelper = columnManager.register<boolean>('checkbox', {
  type: () => tBoolean.create(),
  defaultData: () => ({}),
  cellToString: data => '',
  cellToJson: data => data ?? null,
});
export const progressHelper = columnManager.register<number>('progress', {
  type: () => tNumber.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellToJson: data => data ?? null,
});
export const linkHelper = columnManager.register<string>('link', {
  type: () => tString.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellToJson: data => data ?? null,
});

export const textHelper = columnManager.register<string>('text', {
  type: () => tString.create(),
  defaultData: () => ({}),
  cellToString: data => data ?? '',
  cellToJson: data => data ?? null,
});

columnManager.registerConvert(
  selectHelper,
  multiSelectHelper,
  (column, cells) => ({
    column,
    cells: cells.map(v => (v ? [v] : undefined)),
  })
);
columnManager.registerConvert(selectHelper, richTextHelper, (column, cells) => {
  const optionMap = Object.fromEntries(column.options.map(v => [v.id, v]));
  return {
    column: {},
    cells: cells.map(v => new Text(v ? optionMap[v]?.value : '').yText),
  };
});
columnManager.registerConvert(
  multiSelectHelper,
  selectHelper,
  (column, cells) => ({
    column,
    cells: cells.map(v => v?.[0]),
  })
);
columnManager.registerConvert(
  multiSelectHelper,
  richTextHelper,
  (column, cells) => {
    const optionMap = Object.fromEntries(column.options.map(v => [v.id, v]));
    return {
      column: {},
      cells: cells.map(
        arr =>
          new Text(arr?.map(v => optionMap[v]?.value ?? '').join(',')).yText
      ),
    };
  }
);
columnManager.registerConvert(
  numberHelper,
  richTextHelper,
  (column, cells) => ({
    column: {},
    cells: cells.map(v => new Text(v?.toString()).yText),
  })
);
columnManager.registerConvert(
  progressHelper,
  richTextHelper,
  (column, cells) => ({
    column: {},
    cells: cells.map(v => new Text(v?.toString()).yText),
  })
);

columnManager.registerConvert(richTextHelper, selectHelper, (column, cells) => {
  const options: Record<string, SelectTag> = {};
  const getTag = (name: string) => {
    if (options[name]) return options[name];
    const tag: SelectTag = { id: nanoid(), value: name, color: getTagColor() };
    options[name] = tag;
    return tag;
  };
  return {
    cells: cells.map(v => {
      const tags = v?.toString().split(',');
      const value = tags?.[0]?.trim();
      if (value) {
        return getTag(value).id;
      }
      return undefined;
    }),
    column: {
      options: Object.values(options),
    },
  };
});
columnManager.registerConvert(
  richTextHelper,
  multiSelectHelper,
  (column, cells) => {
    const options: Record<string, SelectTag> = {};
    const getTag = (name: string) => {
      if (options[name]) return options[name];
      const tag: SelectTag = {
        id: nanoid(),
        value: name,
        color: getTagColor(),
      };
      options[name] = tag;
      return tag;
    };
    return {
      cells: cells.map(v => {
        const result: string[] = [];
        const values = v?.toString().split(',');
        values?.forEach(value => {
          value = value.trim();
          if (value) {
            result.push(getTag(value).id);
          }
        });
        return result;
      }),
      column: {
        options: Object.values(options),
      },
    };
  }
);
