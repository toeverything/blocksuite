import type { Column } from './data-view/view/presets/table/types.js';

export type { Column } from './data-view/view/presets/table/types.js';
export type ColumnUpdater<T extends Column = Column> = (data: T) => Partial<T>;
export type Cell<ValueType = unknown> = {
  columnId: Column['id'];
  value: ValueType;
};

export interface DatabaseFlags {
  enable_number_formatting: boolean;
}

export const defaultDatabaseFlags: Readonly<DatabaseFlags> = {
  enable_number_formatting: false,
};
