import type { UniComponent } from '../utils/uni-component/index.js';
import type { Cell } from '../view-manager/cell.js';

export interface CellRenderProps<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown,
> {
  cell: Cell<Value, Data>;
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
