import type { ColumnSchemaType } from '@blocksuite/global/database';
import type { TemplateResult } from 'lit';

export type ColumnType = {
  type: ColumnSchemaType;
  text: string;
  icon: TemplateResult;
};

export type ActionName =
  | 'rename'
  | 'column-type'
  | 'duplicate'
  | 'insert-left'
  | 'insert-right'
  | 'move-left'
  | 'move-right'
  | 'delete';

type CommonEditAction<T extends ActionName = ActionName> = {
  type: T;
  text: string;
  icon: TemplateResult;
};

export type DividerAction = {
  type: 'divider';
};

/** none title column type action */
export type ColumnAction = DividerAction | CommonEditAction;

/** title column action */
export type TitleColumnActionName = 'rename' | 'insert-right';
export type TitleColumnAction = CommonEditAction<TitleColumnActionName>;

/** select tag action */
export type SelectTagActionName = 'rename' | 'delete';
export type SelectTagAction =
  | DividerAction
  | CommonEditAction<SelectTagActionName>;
