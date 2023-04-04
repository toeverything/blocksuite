export interface RowHost<Value = unknown> extends HTMLElement {
  setEditing(isEditing: boolean): void;
  setHeight(height: number): void;
  setValue(value: Value): void;
  updateColumnProperty(
    apply: (oldProperty: Record<string, unknown>) => Record<string, unknown>
  ): void;
}

export type ColumnSchemaType =
  | 'rich-text'
  | 'select'
  | 'multi-select'
  | 'number'
  | 'progress';

export interface ColumnSchema extends Record<string, unknown> {
  id: string;
  type: ColumnSchemaType;
  width: number; // px
  hide: boolean;
}

export type Cell = {
  columnId: ColumnSchema['id'];
  value: unknown;
};

export const enum ColumnInsertPosition {
  Left = 'left',
  Right = 'right',
}

/** select tag property */
export type SelectTag = {
  color: string;
  value: string;
};
