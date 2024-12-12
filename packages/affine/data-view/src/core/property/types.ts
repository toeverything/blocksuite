import type { Disposable } from '@blocksuite/global/utils';

import type { DataSource } from '../data-source/base.js';
import type { TypeInstance } from '../logical/type.js';

export type WithCommonPropertyConfig<T = {}> = T & {
  dataSource: DataSource;
};
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
  type: (
    config: WithCommonPropertyConfig<{
      data: Data;
    }>
  ) => TypeInstance;
  formatValue?: (
    config: WithCommonPropertyConfig<{
      value: Value;
      data: Data;
    }>
  ) => Value;
  isEmpty: (
    config: WithCommonPropertyConfig<{
      value?: Value;
    }>
  ) => boolean;
  minWidth?: number;
  values?: (
    config: WithCommonPropertyConfig<{
      value?: Value;
    }>
  ) => unknown[];
  cellToString: (
    config: WithCommonPropertyConfig<{
      value: Value;
      data: Data;
    }>
  ) => string;
  cellFromString: (
    config: WithCommonPropertyConfig<{
      value: string;
      data: Data;
    }>
  ) => {
    value: unknown;
    data?: Record<string, unknown>;
  };
  cellToJson: (
    config: WithCommonPropertyConfig<{
      value: Value;
      data: Data;
    }>
  ) => DVJSON;
  cellFromJson: (
    config: WithCommonPropertyConfig<{
      value: DVJSON;
      data: Data;
    }>
  ) => Value | undefined;
  addGroup?: (
    config: WithCommonPropertyConfig<{
      text: string;
      oldData: Data;
    }>
  ) => Data;
  onUpdate?: (
    config: WithCommonPropertyConfig<{
      value: Value;
      data: Data;
      callback: () => void;
    }>
  ) => Disposable;
  valueUpdate?: (
    config: WithCommonPropertyConfig<{
      value: Value;
      data: Data;
      newValue: Value;
    }>
  ) => Value;
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
