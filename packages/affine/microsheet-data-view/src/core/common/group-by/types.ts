import type { TType } from '../../logical/index.js';
import type { UniComponent } from '../../utils/index.js';

export interface GroupRenderProps<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown,
> {
  data: Data;
  updateData?: (data: Data) => void;
  value: Value;
  updateValue?: (value: Value) => void;
  readonly: boolean;
}

export type GroupByConfig = {
  name: string;
  groupName: (type: TType, value: unknown) => string;
  defaultKeys: (type: TType) => {
    key: string;
    value: unknown;
  }[];
  valuesGroup: (
    value: unknown,
    type: TType
  ) => {
    key: string;
    value: unknown;
  }[];
  addToGroup?: (value: unknown, oldValue: unknown) => unknown;
  removeFromGroup?: (value: unknown, oldValue: unknown) => unknown;
  view: UniComponent<GroupRenderProps>;
};
