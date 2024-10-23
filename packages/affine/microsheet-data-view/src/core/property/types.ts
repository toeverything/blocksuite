import type { Disposable } from '@blocksuite/global/utils';

import type { TType } from '../logical/index.js';

export type GetPropertyDataFromConfig<T> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends PropertyConfig<infer R, any> ? R : never;
export type GetCellDataFromConfig<T> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends PropertyConfig<any, infer R> ? R : never;
export type PropertyConfig<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown,
> = {
  name: string;
  defaultData: () => Data;
  type: (data: Data) => TType;
  formatValue?: (value: unknown, colData: Data) => Value;
  isEmpty: (value?: Value) => boolean;
  values?: (value?: Value) => unknown[];
  cellToString: (data: Value, colData: Data) => string;
  cellFromString: (
    data: string,
    colData: Data
  ) => {
    value: unknown;
    data?: Record<string, unknown>;
  };
  cellToJson: (data: Value, colData: Data) => DVJSON;
  addGroup?: (text: string, oldData: Data) => Data;
  onUpdate?: (value: Value, Data: Data, callback: () => void) => Disposable;
  valueUpdate?: (value: Value, Data: Data, newValue: Value) => Value;
};

export type DVJSON =
  | null
  | number
  | string
  | boolean
  | DVJSON[]
  | {
      [k: string]: DVJSON;
    };
