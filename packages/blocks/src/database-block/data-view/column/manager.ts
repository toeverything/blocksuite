import type { UniComponent } from '../utils/uni-component/index.js';
import type {
  DataViewColumnManager,
  DataViewManager,
} from '../view/data-view-manager.js';
import type { ColumnConfig } from './column-config.js';

export interface CellRenderProps<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown,
> {
  column: DataViewColumnManager<Value, Data>;
  isEditing: boolean;
  rowId: string;
  selectCurrentCell: (editing: boolean) => void;
  view: DataViewManager;
}

export interface DataViewCellLifeCycle {
  beforeEnterEditMode(): boolean;

  blurCell(): boolean;

  focusCell(): boolean;

  forceUpdate(): void;

  onEnterEditMode(): void;

  onExitEditMode(): void;
}

export type DataViewCellComponent<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown,
> = UniComponent<CellRenderProps<Data, Value>, DataViewCellLifeCycle>;

export type CellRenderer<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown,
> = {
  edit?: DataViewCellComponent<Data, Value>;
  view: DataViewCellComponent<Data, Value>;
};
declare global {
  export interface ColumnConfigMap {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GetColumnDataFromConfig<T extends ColumnConfig<any, any, any>> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends ColumnConfig<infer _, infer R, any> ? R : never;
export type GetCellDataFromConfig<T> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends ColumnConfig<infer _, any, infer R> ? R : never;
