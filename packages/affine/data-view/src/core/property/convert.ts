import type { PropertyModel } from './property-config.js';
import type {
  GetCellDataFromConfig,
  GetPropertyDataFromConfig,
} from './types.js';

export type ConvertFunction<
  From extends PropertyModel = PropertyModel,
  To extends PropertyModel = PropertyModel,
> = (
  property: GetPropertyDataFromConfig<From['config']>,
  cells: (GetCellDataFromConfig<From['config']> | undefined)[]
) => {
  property: GetPropertyDataFromConfig<To['config']>;
  cells: (GetCellDataFromConfig<To['config']> | undefined)[];
};
export const createPropertyConvert = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  From extends PropertyModel<any, any, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  To extends PropertyModel<any, any, any>,
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
