import type { TType } from '../../logical/typesystem.js';
import type { UniComponent } from '../../utils/uni-component/uni-component.js';

import { Matcher } from '../../logical/matcher.js';

export interface GroupRenderProps<
  Data extends NonNullable<unknown> = NonNullable<unknown>,
  Value = unknown,
> {
  data: Data;
  readonly: boolean;
  updateData?: (data: Data) => void;
  updateValue?: (value: Value) => void;
  value: Value;
}

export type GroupByConfig = {
  addToGroup?: (value: unknown, oldValue: unknown) => unknown;
  defaultKeys: (type: TType) => {
    key: string;
    value: unknown;
  }[];
  groupName: (type: TType, value: unknown) => string;
  name: string;
  removeFromGroup?: (value: unknown, oldValue: unknown) => unknown;
  valuesGroup: (
    value: unknown,
    type: TType
  ) => {
    key: string;
    value: unknown;
  }[];
  view: UniComponent<GroupRenderProps>;
};
export const groupByMatcher = new Matcher<GroupByConfig>();
