import type { ColumnType } from '@blocksuite/global/database';
import type { TemplateResult } from 'lit';

export type ColumnHeader = {
  type: ColumnType;
  text: string;
  icon: TemplateResult;
};

/** database toolbar */
export type ToolbarActionName = 'database-type' | 'copy' | 'delete-database';
/** database type */
export type DatabaseTypeActionName = 'table-view' | 'kanban-view';

/** database column */
export type ColumnActionName =
  | 'rename'
  | 'column-type'
  | 'duplicate'
  | 'insert-left'
  | 'insert-right'
  | 'move-left'
  | 'move-right'
  | 'delete';

/** all database action */
type DatabaseAction =
  | ColumnActionName
  | ToolbarActionName
  | DatabaseTypeActionName;

type CommonAction<T extends DatabaseAction> = {
  type: T;
  text: string;
  icon: TemplateResult;
};

export type DividerAction = {
  type: 'divider';
};

export type AnyDatabaseAction = DividerAction | CommonAction<DatabaseAction>;

/** none title column type action */
export type ColumnAction = DividerAction | CommonAction<ColumnActionName>;

/** title column action */
export type TitleColumnActionName = 'rename' | 'insert-right';
export type TitleColumnAction = CommonAction<TitleColumnActionName>;

/** select tag action */
export type SelectTagActionName = 'rename' | 'delete';
export type SelectTagAction = DividerAction | CommonAction<SelectTagActionName>;

/** database toolbar action */
export type ToolbarAction = DividerAction | CommonAction<ToolbarActionName>;

/** database type action */
export type DatabaseTypeAction = CommonAction<DatabaseTypeActionName>;
