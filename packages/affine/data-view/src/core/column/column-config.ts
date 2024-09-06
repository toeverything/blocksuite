import type { Renderer } from './renderer.js';
import type { ColumnConfig } from './types.js';

export type ColumnMeta<
  Type extends string = string,
  ColumnData extends NonNullable<unknown> = NonNullable<unknown>,
  CellData = unknown,
> = {
  type: Type;
  config: ColumnConfig<ColumnData, CellData>;
  create: Create<ColumnData>;
  renderer: Renderer<ColumnData, CellData>;
};
type CreateColumnMeta<
  Type extends string = string,
  ColumnData extends Record<string, unknown> = Record<string, never>,
  CellData = unknown,
> = (
  renderer: Omit<Renderer<ColumnData, CellData>, 'type'>
) => ColumnMeta<Type, ColumnData, CellData>;
type Create<
  ColumnData extends Record<string, unknown> = Record<string, never>,
> = (
  name: string,
  data?: ColumnData
) => {
  type: string;
  name: string;
  statCalcOp?: string;
  data: ColumnData;
};
export type ColumnModel<
  Type extends string = string,
  ColumnData extends Record<string, unknown> = Record<string, never>,
  CellData = unknown,
> = {
  type: Type;
  config: ColumnConfig<ColumnData, CellData>;
  create: Create<ColumnData>;
  createColumnMeta: CreateColumnMeta<Type, ColumnData, CellData>;
};
export const columnType = <Type extends string>(type: Type) => ({
  type: type,
  modelConfig: <
    CellData,
    ColumnData extends Record<string, unknown> = Record<string, never>,
  >(
    ops: ColumnConfig<ColumnData, CellData>
  ): ColumnModel<Type, ColumnData, CellData> => {
    const create: Create<ColumnData> = (name, data) => {
      return {
        type,
        name,
        data: data ?? ops.defaultData(),
      };
    };
    return {
      type,
      config: ops,
      create,
      createColumnMeta: renderer => ({
        type,
        config: ops,
        create,
        renderer: {
          type,
          ...renderer,
        },
      }),
    };
  },
});
