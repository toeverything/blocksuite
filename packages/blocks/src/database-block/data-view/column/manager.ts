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
  view: DataViewManager;
  column: DataViewColumnManager<Value, Data>;
  rowId: string;
  isEditing: boolean;
  selectCurrentCell: (editing: boolean) => void;
}

export interface DataViewCellLifeCycle {
  beforeEnterEditMode(): boolean;

  onEnterEditMode(): void;

  onExitEditMode(): void;

  focusCell(): boolean;

  blurCell(): boolean;

  forceUpdate(): void;
}

export type DataViewCellComponent<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown,
> = UniComponent<CellRenderProps<Data, Value>, DataViewCellLifeCycle>;

export type CellRenderer<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown,
> = {
  view: DataViewCellComponent<Data, Value>;
  edit?: DataViewCellComponent<Data, Value>;
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
