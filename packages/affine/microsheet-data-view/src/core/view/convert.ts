import type { DataViewModel, GetDataFromDataViewModel } from './data-view.js';

export type ViewConvertFunction<
  From extends DataViewModel = DataViewModel,
  To extends DataViewModel = DataViewModel,
> = (
  data: GetDataFromDataViewModel<From>
) => Partial<GetDataFromDataViewModel<To>>;
export type ViewConvertConfig = {
  from: string;
  to: string;
  convert: ViewConvertFunction;
};
export const createViewConvert = <
  From extends DataViewModel,
  To extends DataViewModel,
>(
  from: From,
  to: To,
  convert: ViewConvertFunction<From, To>
): ViewConvertConfig => {
  return {
    from: from.type,
    to: to.type,
    convert,
  };
};
