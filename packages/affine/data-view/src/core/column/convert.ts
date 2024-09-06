import type { ColumnModel } from './column-config.js';
import type {
  GetCellDataFromConfig,
  GetColumnDataFromConfig,
} from './types.js';

export type ConvertFunction<
  From extends ColumnModel = ColumnModel,
  To extends ColumnModel = ColumnModel,
> = (
  column: GetColumnDataFromConfig<From['config']>,
  cells: (GetCellDataFromConfig<From['config']> | undefined)[]
) => {
  column: GetColumnDataFromConfig<To['config']>;
  cells: (GetCellDataFromConfig<To['config']> | undefined)[];
};
export const createColumnConvert = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  From extends ColumnModel<any, any, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  To extends ColumnModel<any, any, any>,
>(
  from: From,
  to: To,
  convert: ConvertFunction<From, To>
) => {
  return {
    from: from.type,
    to: to.type,
    convert,
  };
};
