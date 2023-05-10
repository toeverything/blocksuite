import type { TemplateResult } from 'lit';

import type { DatabaseMode } from '../types.js';

export type SetValueOption = {
  captureSync: boolean;
};

export interface RowHost<Value = unknown> extends HTMLElement {
  setEditing(isEditing: boolean): void;
  setHeight(height: number): void;
  setValue(value: Value, option?: SetValueOption): void;
  updateColumnProperty(
    apply: (oldProperty: Record<string, unknown>) => Record<string, unknown>
  ): void;
}

export type ColumnType =
  | 'rich-text'
  | 'select'
  | 'multi-select'
  | 'number'
  | 'checkbox'
  | 'progress';

export type ColumnTypeIcon = Record<ColumnType, TemplateResult>;

export interface Column extends Record<string, unknown> {
  id: string;
  type: ColumnType;
  width: number; // px
  hide: boolean;
}

export type Cell<ValueType = unknown> = {
  columnId: Column['id'];
  value: ValueType;
};

export const enum ColumnInsertPosition {
  Left = 'left',
  Right = 'right',
}

/** select tag property */
export type SelectTag = {
  id: string;
  color: string;
  value: string;
};

export type ColumnHeader = {
  type: ColumnType;
  text: string;
  icon: TemplateResult;
};

export type ToolbarActionType = 'database-type' | 'copy' | 'delete-database';

export type SwitchViewActionType = DatabaseMode;

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
