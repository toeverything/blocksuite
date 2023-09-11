import type { Column } from './table/types.js';

export type * from './table/types.js';
export type ColumnUpdater<T extends Column = Column> = (data: T) => Partial<T>;
export type ColumnDataUpdater<
  Data extends Record<string, unknown> = Record<string, unknown>,
> = (data: Data) => Partial<Data>;
export type InsertPosition =
  | 'end'
  | 'start'
  | {
      id: string;
      before: boolean;
    };
export type Cell<ValueType = unknown> = {
  columnId: Column['id'];
  value: ValueType;
};
