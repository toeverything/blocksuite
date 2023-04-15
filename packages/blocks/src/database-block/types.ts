import type { ColumnType } from '@blocksuite/global/database';
import type { TemplateResult } from 'lit';

export type ColumnHeader = {
  type: ColumnType;
  text: string;
  icon: TemplateResult;
};

export type ToolbarActionType = 'database-type' | 'copy' | 'delete-database';

export type SwitchViewActionType = 'table-view' | 'kanban-view';

type ActionMenuItem<T extends DatabaseActionType> = {
  type: T;
  text: string;
  icon: TemplateResult;
};

export type ColumnActionType =
  | 'rename'
  | 'column-type'
  | 'duplicate'
  | 'insert-left'
  | 'insert-right'
  | 'move-left'
  | 'move-right'
  | 'delete';
export type ColumnAction = ActionMenuItem<ColumnActionType> | Divider;

type DatabaseActionType =
  | ColumnActionType
  | ToolbarActionType
  | SwitchViewActionType;

export type DatabaseAction = ActionMenuItem<DatabaseActionType> | Divider;

// divider in menu
export type Divider = {
  type: 'divider';
};

export type TitleColumnActionType = 'rename' | 'insert-right';
export type TitleColumnAction = ActionMenuItem<TitleColumnActionType>;

export type SelectTagActionType = 'rename' | 'delete';
export type SelectTagAction = ActionMenuItem<SelectTagActionType> | Divider;

export type ToolbarAction = ActionMenuItem<ToolbarActionType> | Divider;

export type SwitchViewAction = ActionMenuItem<SwitchViewActionType>;

export const enum SearchState {
  /** show search input */
  SearchInput = 'input',
  /** show search icon */
  SearchIcon = 'icon',
  /** searching */
  Searching = 'searching',
  /** show more action */
  Action = 'action',
}

export const enum SelectMode {
  Multi = 'multi',
  Single = 'single',
}
