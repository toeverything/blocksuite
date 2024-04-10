import type { KanbanViewSelectionWithType } from './view/presets/kanban/types.js';
import type { TableViewSelection } from './view/presets/table/types.js';

export type DataViewSelection =
  | TableViewSelection
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
export type InsertToPosition =
  | 'end'
  | 'start'
  | {
      id: string;
      before: boolean;
    };
export type ColumnDataUpdater<
  Data extends Record<string, unknown> = Record<string, unknown>,
> = (data: Data) => Partial<Data>;
