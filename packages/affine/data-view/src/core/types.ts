import type { KanbanViewSelectionWithType } from '../view-presets/kanban/types.js';
import type { TableViewSelectionWithType } from '../view-presets/table/types.js';

export type DataViewSelection =
  | TableViewSelectionWithType
  | KanbanViewSelectionWithType;
export type GetDataViewSelection<
  K extends DataViewSelection['type'],
  T = DataViewSelection,
> = T extends {
  type: K;
}
  ? T
  : never;
export type DataViewSelectionState = DataViewSelection | undefined;
export type PropertyDataUpdater<
  Data extends Record<string, unknown> = Record<string, unknown>,
> = (data: Data) => Partial<Data>;

export interface DatabaseFlags {
  enable_number_formatting: boolean;
}

export const defaultDatabaseFlags: Readonly<DatabaseFlags> = {
  enable_number_formatting: false,
};
