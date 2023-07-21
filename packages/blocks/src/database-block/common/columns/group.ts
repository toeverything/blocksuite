import type { UniComponent } from '../../../components/uni-component/uni-component.js';
import type { DataViewColumnManager } from '../data-view-manager.js';

interface GroupRenderProps<
  Data extends Record<string, unknown> = Record<string, never>,
  Value = unknown
> {
  column: DataViewColumnManager<Value, Data>;
  rowId: string;
  isEditing: boolean;
  selectCurrentCell: (editing: boolean) => void;
}

export type GroupRenderer<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown
> = {
  view: UniComponent<GroupRenderProps<Data, Value>>;
  edit?: UniComponent<GroupRenderProps<Data, Value>>;
};

export interface GroupProps<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown,
  GroupValue = unknown
> {
  type: string;
  groups: (
    data: Data,
    values: {
      rowId: string;
      value: Value;
    }[]
  ) => Record<
    string,
    {
      value: GroupValue;
      rows: string[];
    }
  >;
  groupRenderer?: GroupRenderer<Data, Value>;
}

export class ColumnGroupHelper {
  private _columns = new Map<string, GroupProps>();

  register(renderer: GroupProps) {
    const columns = this._columns;
    if (columns.has(renderer.type)) {
      throw new Error('cannot register twice for ' + renderer.type);
    }
    columns.set(renderer.type, renderer);
  }

  get(type: GroupProps['type']): GroupProps {
    const renderer = this._columns.get(type);
    if (!renderer) {
      throw new Error('cannot find group');
    }
    return renderer;
  }
}

export const columnGroupHelper = new ColumnGroupHelper();
